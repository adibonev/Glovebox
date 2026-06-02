"""
Polish the car silhouettes for the dark dashboard scene.

The raw renders in  apps/web/public/cars/raw/  are transparent PNGs cut from a WHITE
studio background, which leaves two problems on the dark ink scene:
  1. a bright white halo on the anti-aliased edges (partial-alpha, near-white RGB), and
  2. a baked grey ground shadow under the car (a near-opaque grey band) that reads as an
     ugly jagged smear — VehicleCard already draws its own clean shadow, so we drop this.

This script, in one pass per car:
  * defringes the white matte (un-multiplies white on partial-alpha edge pixels),
  * removes the baked ground shadow by cutting everything below the tyre contact line,
  * trims, downscales to a sensible max width (crisp LANCZOS), and writes an optimised PNG.

Run:  python apps/web/scripts/polish-cars.py [max_width]
  max_width (optional, default 900): output width in px; smaller file, still retina-crisp.

Also writes  apps/web/public/cars/_preview.png  (contact sheet on the ink scene) for review.
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

HERE = Path(__file__).resolve().parent
CARS = HERE.parent / "public" / "cars"
RAW = CARS / "raw"

BODY_TYPES = ["hatchback", "sedan", "wagon", "suv", "coupe", "pickup"]
INK = (7, 16, 12)  # brand ink #07100C — the scene the cars sit on

DEFAULT_MAX_W = 900


def polish(src: Path, dst: Path, max_w: int) -> Image.Image:
    im = Image.open(src).convert("RGBA")
    arr = np.asarray(im).astype(np.float64)
    h, w = arr.shape[:2]
    rgb = arr[..., :3].copy()
    a = arr[..., 3] / 255.0

    # 1) Defringe the white matte: O = a*C + (1-a)*255  →  recover the true colour C.
    partial = (a > 0.0) & (a < 1.0)
    a_safe = np.where(a == 0.0, 1.0, a)
    inv = (1.0 - a) * 255.0
    recovered = np.clip((rgb - inv[..., None]) / a_safe[..., None], 0, 255)
    rgb = np.where(partial[..., None], recovered, rgb)

    value = rgb.max(axis=2)
    sat = value - rgb.min(axis=2)
    rows = np.arange(h)[:, None]

    # 2) Drop the baked ground shadow. The ground is flat, so the cut is one horizontal line.
    #    Find the lowest solid-black tyre pixel, then cut a few px ABOVE it: that also removes
    #    the dark contact-shadow core (which is the same near-black as a tyre and can't be told
    #    apart by colour), at the cost of an invisible ~5px flat on the very bottom of the tyres.
    tyre_ys = np.where((a > 0.85) & (value < 60.0))[0]
    if tyre_ys.size:
        cut_y = int(np.quantile(tyre_ys, 0.999)) - 5
        a = np.where(rows > cut_y, 0.0, a)
        # Above the cut, wipe the lighter grey penumbra wisps without touching the black tyres
        # (value<60, kept) or the bright-white body (value>215, kept).
        band = (rows <= cut_y) & (rows > cut_y - 22)
        greyish = (sat < 30.0) & (value >= 80.0) & (value <= 215.0)
        a = np.where(band & greyish, 0.0, a)

    out = np.dstack([rgb, a * 255.0]).astype(np.uint8)
    img = Image.fromarray(out, "RGBA")

    # Feather the freshly cut edge so it reads smooth, not stepped.
    alpha = img.getchannel("A").filter(ImageFilter.GaussianBlur(0.5))
    img.putalpha(alpha)

    # 3) Trim to the car, then downscale crisply for a smaller, retina-sharp file.
    bbox = img.getchannel("A").getbbox()
    if bbox:
        pad = 4
        left, top, right, bottom = bbox
        img = img.crop((max(0, left - pad), max(0, top - pad), min(w, right + pad), min(h, bottom + pad)))
    if img.width > max_w:
        new_h = round(img.height * max_w / img.width)
        img = img.resize((max_w, new_h), Image.LANCZOS)

    dst.parent.mkdir(parents=True, exist_ok=True)
    img.save(dst, "WEBP", quality=88, method=6)  # alpha-aware, ~1/4 the size of PNG at equal quality
    kb = dst.stat().st_size // 1024
    print(f"  {src.name:14s} -> public/cars/{dst.name:14s} {img.size[0]}x{img.size[1]}  {kb} KB")
    return img


def build_preview(cars: dict[str, Image.Image]) -> None:
    cols, cell_w, cell_h, gap = 2, 540, 200, 8
    rows = (len(BODY_TYPES) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * cell_w + (cols + 1) * gap, rows * cell_h + (rows + 1) * gap), INK + (255,))
    for i, name in enumerate(BODY_TYPES):
        im = cars.get(name)
        if im is None:
            continue
        scale = min((cell_w - 24) / im.width, (cell_h - 24) / im.height)
        thumb = im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))), Image.LANCZOS)
        cx = gap + (i % cols) * (cell_w + gap) + (cell_w - thumb.width) // 2
        cy = gap + (i // cols) * (cell_h + gap) + (cell_h - thumb.height) // 2
        sheet.alpha_composite(thumb, (cx, cy))
    sheet.convert("RGB").save(CARS / "_preview.png")
    print(f"  preview        -> public/cars/_preview.png {sheet.size[0]}x{sheet.size[1]}")


def main() -> int:
    max_w = int(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_MAX_W
    if not RAW.exists():
        print(f"No raw folder: {RAW}")
        return 1

    print(f"Polishing cars (max_width={max_w}) ...")
    cars: dict[str, Image.Image] = {}
    for name in BODY_TYPES:
        src = next((RAW / f"{name}{e}" for e in (".png", ".jpg", ".jpeg", ".webp") if (RAW / f"{name}{e}").exists()), None)
        if src is None:
            print(f"  {name:14s} -- missing in raw/, skipped")
            continue
        cars[name] = polish(src, CARS / f"{name}.webp", max_w)
        stale_png = CARS / f"{name}.png"  # retire the old PNG output, if any
        if stale_png.exists():
            stale_png.unlink()

    if cars:
        build_preview(cars)
    print(f"Done: {len(cars)}/{len(BODY_TYPES)} silhouettes polished.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

"""Generate Expo store icons from the Glovebox brand (brand/glovebox-appicon.svg).

Pillow can't rasterize SVG, so we redraw the brand mark programmatically (4x supersample
+ LANCZOS for clean edges). Outputs to apps/mobile/assets/:
  - icon.png             1024  full tile (gradient + copper glow) + 3-spoke wheel  (iOS / main)
  - adaptive-icon.png    1024  wheel on transparent bg, sized for Android's safe zone
  - splash-icon.png      1024  same wheel, used by expo-splash-screen
  - notification-icon.png 256  WHITE wheel on transparent (Android push status-bar icon;
                               Android keeps only the alpha and tints it with the plugin `color`)
"""

import os

import numpy as np
from PIL import Image, ImageDraw

S = 4               # supersample factor
SIZE = 1024
W = SIZE * S

COPPER = (196, 149, 76)
HUB = (224, 178, 102)
WHITE = (255, 255, 255)
TILE_TL = (0x0F, 0x20, 0x18)
TILE_BR = (0x07, 0x0D, 0x0A)
OUT = os.path.join(os.path.dirname(__file__), "..", "assets")


def tile_background() -> Image.Image:
    """Diagonal gradient + a soft copper radial glow (top-right) — the brand tile."""
    ys, xs = np.mgrid[0:W, 0:W].astype(np.float64)
    t = (xs + ys) / (2 * (W - 1))
    bg = np.stack([TILE_TL[i] + (TILE_BR[i] - TILE_TL[i]) * t for i in range(3)], axis=-1)

    cx, cy, rad = 0.78 * W, 0.18 * W, 0.70 * W
    r = np.sqrt((xs - cx) ** 2 + (ys - cy) ** 2)
    glow = np.clip(1 - r / rad, 0, 1) * 0.22
    bg = bg * (1 - glow[..., None]) + np.array(COPPER) * glow[..., None]

    return Image.fromarray(np.clip(bg, 0, 255).astype("uint8"), "RGB").convert("RGBA")


def draw_wheel(img: Image.Image, rim_r: float, color=COPPER, hub_color=HUB) -> None:
    """A 3-spoke steering wheel (9/3/6 o'clock — no top spoke) centred on the canvas."""
    d = ImageDraw.Draw(img)
    cx = cy = W / 2
    stroke = rim_r * (0.06 / 0.27)
    spoke_w = rim_r * (0.052 / 0.27)
    hub_r = rim_r * (0.075 / 0.27)
    cap = spoke_w / 2
    rgba = color + (255,)

    # rim
    d.ellipse([cx - rim_r, cy - rim_r, cx + rim_r, cy + rim_r], outline=rgba, width=round(stroke))
    # spokes: full horizontal (9+3 o'clock) and a single downward (6 o'clock)
    d.line([(cx - rim_r, cy), (cx + rim_r, cy)], fill=rgba, width=round(spoke_w))
    d.line([(cx, cy), (cx, cy + rim_r)], fill=rgba, width=round(spoke_w))
    for px, py in [(cx - rim_r, cy), (cx + rim_r, cy), (cx, cy + rim_r)]:
        d.ellipse([px - cap, py - cap, px + cap, py + cap], fill=rgba)
    # hub
    d.ellipse([cx - hub_r, cy - hub_r, cx + hub_r, cy + hub_r], fill=hub_color + (255,))


def main() -> None:
    os.makedirs(OUT, exist_ok=True)

    # Full app icon: tile + wheel (iOS rounds the corners itself, so keep it square).
    icon = tile_background()
    draw_wheel(icon, 0.27 * W)
    icon.resize((SIZE, SIZE), Image.LANCZOS).convert("RGB").save(os.path.join(OUT, "icon.png"))

    # Transparent wheel for Android adaptive foreground + the splash (a touch larger).
    wheel = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    draw_wheel(wheel, 0.30 * W)
    small = wheel.resize((SIZE, SIZE), Image.LANCZOS)
    small.save(os.path.join(OUT, "adaptive-icon.png"))
    small.save(os.path.join(OUT, "splash-icon.png"))

    # Android push notification icon: pure white wheel on transparent. Android masks it to the
    # alpha and tints with the expo-notifications `color`, so RGB must be white and it should
    # nearly fill the canvas (the status bar renders it small). 256px is plenty.
    notif = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    draw_wheel(notif, 0.42 * W, color=WHITE, hub_color=WHITE)
    notif.resize((256, 256), Image.LANCZOS).save(os.path.join(OUT, "notification-icon.png"))

    print("wrote icon.png, adaptive-icon.png, splash-icon.png, notification-icon.png to",
          os.path.normpath(OUT))


if __name__ == "__main__":
    main()

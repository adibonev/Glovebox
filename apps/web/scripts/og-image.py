"""Generate the Open Graph share card -> apps/web/app/opengraph-image.png (1200x630)."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
WEB = HERE.parent
W, H = 1200, 630
INK = (7, 16, 12)
IVORY = (244, 241, 234)
COPPER = (196, 149, 76)
MUTED = (154, 167, 156)


def font(names, size):
    for n in names:
        try:
            return ImageFont.truetype(n, size)
        except OSError:
            continue
    return ImageFont.load_default()


img = Image.new("RGB", (W, H), INK)
d = ImageDraw.Draw(img)

# Cinematic vertical gradient (emerald-dark -> ink).
top, bot = (14, 42, 30), INK
for y in range(H):
    t = y / H
    d.line([(0, y), (W, y)], fill=tuple(int(top[i] + (bot[i] - top[i]) * t) for i in range(3)))

# Soft emerald glow, top-center.
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
gd = ImageDraw.Draw(glow)
gd.ellipse([W // 2 - 520, -340, W // 2 + 520, 360], fill=(20, 80, 58, 90))
from PIL import ImageFilter
glow = glow.filter(ImageFilter.GaussianBlur(120))
img.paste(glow, (0, 0), glow)
d = ImageDraw.Draw(img)

# Car silhouette, bleeding off the right.
car = Image.open(WEB / "public" / "cars" / "sedan.webp").convert("RGBA")
cw = 640
car = car.resize((cw, round(car.height * cw / car.width)))
img.paste(car, (W - 540, H // 2 - car.height // 2 + 30), car)

fw = font(["georgiab.ttf", "C:/Windows/Fonts/georgiab.ttf", "DejaVuSerif-Bold.ttf"], 96)
ftag = font(["georgiab.ttf", "C:/Windows/Fonts/georgiab.ttf", "DejaVuSerif-Bold.ttf"], 48)
fsub = font(["arial.ttf", "C:/Windows/Fonts/arial.ttf", "DejaVuSans.ttf"], 29)

x0, y0 = 84, 150

# Wordmark: "Glove" (ivory) + "b" (copper) + wheel-o + "x" (copper).
d.text((x0, y0), "Glove", font=fw, fill=IVORY)
xb = x0 + d.textlength("Glove", font=fw)
d.text((xb, y0), "b", font=fw, fill=COPPER)
xo = xb + d.textlength("b", font=fw) + 6

asc, desc = fw.getmetrics()
oh = int(asc * 0.52)  # ~ x-height of the lowercase "o"
cx = xo + oh / 2
cy = y0 + asc - oh / 2
r = oh / 2
lw = max(6, oh // 8)
d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=COPPER, width=lw)
hub = lw
d.ellipse([cx - hub, cy - hub, cx + hub, cy + hub], fill=COPPER)
for x2, y2 in [(cx - r, cy), (cx + r, cy), (cx, cy + r)]:
    d.line([cx, cy, x2, y2], fill=COPPER, width=lw)
xx = xo + oh + 8
d.text((xx, y0), "x", font=fw, fill=COPPER)

# Tagline + subtitle.
d.text((x0, y0 + 150), "Нито един срок", font=ftag, fill=IVORY)
d.text((x0, y0 + 208), "не те изненадва.", font=ftag, fill=IVORY)
d.text((x0, y0 + 290), "Документите и сроковете на колата ти.", font=fsub, fill=MUTED)

(WEB / "app" / "opengraph-image.png").parent.mkdir(parents=True, exist_ok=True)
img.save(WEB / "app" / "opengraph-image.png")
print("saved app/opengraph-image.png", img.size)

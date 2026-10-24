"""Generate the hero photo set from the original in assets-src/ (git-ignored).

Usage: python scripts/photo.py [assets-src/foto.png]
Writes public/photo/ernesto-{w}.avif and .webp. Only pixels are copied into a new image,
so EXIF, GPS, XMP and PNG text chunks never reach the outputs. No retouching: resize only.
Outputs are committed; run this again only when the original changes.
"""
import sys
from pathlib import Path
from PIL import Image

WIDTHS = (400, 640, 960)
root = Path(__file__).resolve().parent.parent
src = Path(sys.argv[1] if len(sys.argv) > 1 else root / "assets-src" / "foto.png")
out = root / "public" / "photo"
out.mkdir(exist_ok=True)

with Image.open(src) as im:
    print(f"source {src.name}: {im.size}, mode {im.mode}, exif tags {len(im.getexif())}, info keys {sorted(im.info)}")
    rgba = im.convert("RGBA")
clean = Image.frombytes("RGBA", rgba.size, rgba.tobytes())

for w in WIDTHS:
    h = round(clean.height * w / clean.width)
    img = clean.resize((w, h), Image.LANCZOS)
    img.save(out / f"ernesto-{w}.avif", quality=62, speed=4)
    img.save(out / f"ernesto-{w}.webp", quality=80, method=6)

for f in sorted(out.iterdir()):
    with Image.open(f) as check:
        assert not check.getexif(), f"{f.name} carries EXIF"
        assert "xmp" not in check.info and "exif" not in check.info, f"{f.name} carries metadata"
        print(f"{f.name}: {check.size}, {f.stat().st_size} bytes, no metadata")

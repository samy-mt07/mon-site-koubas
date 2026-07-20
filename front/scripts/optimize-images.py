"""One-off image optimization pass. Not part of the build; run manually when
new large/uncompressed assets are added to front/public."""

from pathlib import Path
from PIL import Image

PUBLIC_DIR = Path(__file__).resolve().parent.parent / "public"


def optimize_background():
    src = PUBLIC_DIR / "background.png"
    im = Image.open(src).convert("RGB")
    im.save(PUBLIC_DIR / "background.jpg", "JPEG", quality=80, optimize=True)
    im.save(PUBLIC_DIR / "background.webp", "WEBP", quality=78)


def optimize_product_images():
    images_dir = PUBLIC_DIR / "images"
    for path in images_dir.iterdir():
        if not path.is_file():
            continue
        im = Image.open(path)
        im.thumbnail((1200, 1200))
        suffix = path.suffix.lower()
        if suffix in (".jpg", ".jpeg"):
            im.convert("RGB").save(path, "JPEG", quality=78, optimize=True)
        elif suffix == ".png":
            im.save(path, "PNG", optimize=True)


def make_favicon():
    logo = Image.open(PUBLIC_DIR / "LOGO.png").convert("RGBA")
    logo.thumbnail((64, 64))
    logo.save(PUBLIC_DIR / "favicon.png", "PNG", optimize=True)


if __name__ == "__main__":
    optimize_background()
    optimize_product_images()
    make_favicon()
    print("done")

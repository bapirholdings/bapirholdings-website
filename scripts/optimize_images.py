from PIL import Image
from pathlib import Path

INPUT_DIR = Path(__file__).resolve().parents[1] / 'images'
OUTPUT_DIR = INPUT_DIR / 'optimized'
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Files to skip (logos)
SKIP_PREFIX = ('logo',)
# Target sizes
MAX_DIM = (1200, 1200)
CARD_SIZE = (800, 600)  # width x height for product card crops

for img_path in sorted(INPUT_DIR.iterdir()):
    if not img_path.is_file():
        continue
    name = img_path.name
    if name.lower().startswith(SKIP_PREFIX):
        print(f"Skipping logo: {name}")
        continue
    if img_path.suffix.lower() not in ('.png', '.jpg', '.jpeg', '.webp'):
        print(f"Skipping unknown format: {name}")
        continue

    try:
        with Image.open(img_path) as im:
            # Create optimized full-size copy (max dimensions)
            im_copy = im.copy()
            im_copy.thumbnail(MAX_DIM, Image.LANCZOS)
            optimized_path = OUTPUT_DIR / name
            if im_copy.mode in ('RGBA', 'LA') and img_path.suffix.lower() == '.png':
                im_copy.save(optimized_path, optimize=True)
            else:
                # convert to RGB and save as JPEG for smaller size
                rgb = im_copy.convert('RGB')
                out_jpg = optimized_path.with_suffix('.jpg')
                rgb.save(out_jpg, format='JPEG', quality=85, optimize=True)
                optimized_path = out_jpg
            print(f"Saved optimized: {optimized_path.name}")

            # Create center-cropped card version (cover)
            # First, make a copy that covers the aspect ratio, then center-crop
            target_w, target_h = CARD_SIZE
            # Calculate scale to cover
            src_w, src_h = im.size
            scale = max(target_w / src_w, target_h / src_h)
            cover_w, cover_h = int(src_w * scale), int(src_h * scale)
            im_cover = im.resize((cover_w, cover_h), Image.LANCZOS)
            left = (cover_w - target_w) // 2
            top = (cover_h - target_h) // 2
            right = left + target_w
            bottom = top + target_h
            im_card = im_cover.crop((left, top, right, bottom))
            im_card_rgb = im_card.convert('RGB')
            card_name = img_path.stem + '_card.jpg'
            card_path = OUTPUT_DIR / card_name
            im_card_rgb.save(card_path, format='JPEG', quality=85, optimize=True)
            print(f"Saved card: {card_path.name}")
    except Exception as e:
        print(f"Failed processing {name}: {e}")

print('Done')

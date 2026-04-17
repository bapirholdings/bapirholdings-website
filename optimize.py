import os
from PIL import Image

# This script ensures your shop stays fast on mobile
def optimize_store_images():
    source = 'images'
    dest = 'images/mobile_optimized'
    
    if not os.path.exists(dest):
        os.makedirs(dest)

    for file in os.listdir(source):
        if file.lower().endswith(('.jpg', '.jpeg', '.png')):
            with Image.open(os.path.join(source, file)) as img:
                # Resize shop images to a max width of 600px for speed
                if img.width > 600:
                    img.thumbnail((600, 600))
                img.save(os.path.join(dest, file), optimize=True, quality=85)
                print(f"Optimized: {file}")

if __name__ == "__main__":
    optimize_store_images()
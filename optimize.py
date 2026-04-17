import os
from PIL import Image # type: ignore

# Directories
SOURCE_DIR = 'images'
MOBILE_DIR = 'images/mobile_optimized'

def optimize_images_for_mobile():
    """
    Compresses and resizes images for faster mobile loading.
    """
    # Create the output directory if it doesn't exist
    if not os.path.exists(MOBILE_DIR):
        os.makedirs(MOBILE_DIR)
        print(f"Created directory: {MOBILE_DIR}")

    for filename in os.listdir(SOURCE_DIR):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
            img_path = os.path.join(SOURCE_DIR, filename)
            mobile_path = os.path.join(MOBILE_DIR, filename)
            
            try:
                with Image.open(img_path) as img:
                    # Convert to RGB if necessary (useful for some PNGs)
                    if img.mode in ("RGBA", "P"):
                        img = img.convert("RGB")
                        
                    # Target mobile width (standard for modern smartphones)
                    target_width = 800
                    
                    if img.width > target_width:
                        # Calculate new height maintaining aspect ratio
                        ratio = target_width / img.width
                        new_height = int(img.height * ratio)
                        
                        # Resize the image using high-quality resampling
                        img = img.resize((target_width, new_height), Image.Resampling.LANCZOS)
                        
                    # Save the image with optimized settings to reduce file size
                    img.save(mobile_path, optimize=True, quality=80)
                    print(f"Successfully optimized: {filename}")
                    
            except Exception as e:
                print(f"Error optimizing {filename}: {e}")

if __name__ == '__main__':
    print("Starting mobile image optimization...")
    optimize_images_for_mobile()
    print("Finished! Check the 'images/mobile_optimized' folder.")
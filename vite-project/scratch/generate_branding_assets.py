import os
import sys
from PIL import Image, ImageDraw

def draw_gradient_fast(width, height):
    # Diagonal gradient from top-left (67, 204, 52) to bottom-right (1, 140, 72)
    small = Image.new('RGB', (10, 10))
    for y in range(10):
        for x in range(10):
            ratio = (x / 9.0 + y / 9.0) / 2.0
            r = int(67 * (1 - ratio) + 1 * ratio)
            g = int(204 * (1 - ratio) + 140 * ratio)
            b = int(52 * (1 - ratio) + 72 * ratio)
            small.putpixel((x, y), (r, g, b))
    return small.resize((width, height), Image.Resampling.BILINEAR)

def make_background_transparent(img, tolerance=40):
    img = img.convert('RGBA')
    pix = img.load()
    w, h = img.size
    
    # We assume the top-left corner is the background color
    target_color = pix[0, 0]
    
    visited = set()
    queue = [(0, 0), (w-1, 0), (0, h-1), (w-1, h-1)]
    for q in queue:
        visited.add(q)
        
    while queue:
        cx, cy = queue.pop(0)
        curr = pix[cx, cy]
        # Calculate color distance
        dist = abs(curr[0] - target_color[0]) + abs(curr[1] - target_color[1]) + abs(curr[2] - target_color[2])
        if dist < tolerance:
            pix[cx, cy] = (curr[0], curr[1], curr[2], 0)
            for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
                nx, ny = cx + dx, cy + dy
                if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in visited:
                    visited.add((nx, ny))
                    queue.append((nx, ny))
    return img

def main():
    logo_path = '/Users/shashankshetty/Documents/HostelGo/vite-project/public/assets/branding/buyto-logo.png'
    if not os.path.exists(logo_path):
        print(f"Error: logo not found at {logo_path}")
        sys.exit(1)
        
    logo = Image.open(logo_path)
    
    # Define bounding boxes based on scanning
    # Cart: 211, 118, 737, 503
    # Text: 286, 516, 750, 709
    # Overall: 211, 118, 750, 709
    cart_box = (211, 118, 737, 503)
    overall_box = (211, 118, 750, 709)
    
    cart = logo.crop(cart_box)
    overall = logo.crop(overall_box)
    
    # Generate background-subtracted transparent cart for adaptive foregrounds
    transparent_cart = make_background_transparent(cart)
    
    # We will generate PWA and local assets
    pwa_assets = {
        '/Users/shashankshetty/Documents/HostelGo/vite-project/public/icon-192.png': (192, 192, 'cart'),
        '/Users/shashankshetty/Documents/HostelGo/vite-project/public/icon-512.png': (512, 512, 'cart'),
        '/Users/shashankshetty/Documents/HostelGo/vite-project/public/apple-touch-icon.png': (180, 180, 'cart'),
        '/Users/shashankshetty/Documents/HostelGo/vite-project/public/favicon.png': (48, 48, 'cart'),
        '/Users/shashankshetty/Documents/HostelGo/vite-project/assets/icon.png': (1024, 1024, 'cart'),
        '/Users/shashankshetty/Documents/HostelGo/vite-project/assets/splash.png': (2732, 2732, 'overall_splash')
    }
    
    # Create target folders if they do not exist
    os.makedirs('/Users/shashankshetty/Documents/HostelGo/vite-project/public', exist_ok=True)
    os.makedirs('/Users/shashankshetty/Documents/HostelGo/vite-project/assets', exist_ok=True)
    
    for path, (w, h, style) in pwa_assets.items():
        if style == 'cart':
            # Solid green background
            img = Image.new('RGB', (w, h), (18, 194, 75)) # #12C24B
            # Scale cart to fit center (e.g. 70% of min dimension)
            scale = int(min(w, h) * 0.7)
            scaled_cart = cart.resize((scale, int(scale * cart.height / cart.width)), Image.Resampling.LANCZOS)
            # Paste in center
            px = (w - scaled_cart.width) // 2
            py = (h - scaled_cart.height) // 2
            img.paste(scaled_cart, (px, py))
            img.save(path, 'PNG')
            print(f"Generated PWA asset: {path}")
        elif style == 'overall_splash':
            # Gradient background
            img = draw_gradient_fast(w, h)
            # Scale overall to fit center (e.g. 60% of min dimension)
            scale = int(min(w, h) * 0.6)
            scaled_overall = overall.resize((scale, int(scale * overall.height / overall.width)), Image.Resampling.LANCZOS)
            # Paste in center
            px = (w - scaled_overall.width) // 2
            py = (h - scaled_overall.height) // 2
            img.paste(scaled_overall, (px, py))
            img.save(path, 'PNG')
            print(f"Generated PWA asset: {path}")

    # Now let's walk through all android resources
    res_dir = '/Users/shashankshetty/Documents/HostelGo/vite-project/android/app/src/main/res'
    if not os.path.exists(res_dir):
        print("Android resource folder not found. Skipping android resources.")
        return

    for root, dirs, files in os.walk(res_dir):
        for f in files:
            file_path = os.path.join(root, f)
            if f == 'ic_launcher_background.png':
                # Solid green background
                try:
                    orig_im = Image.open(file_path)
                    w, h = orig_im.size
                    img = Image.new('RGB', (w, h), (18, 194, 75))
                    img.save(file_path, 'PNG')
                    print(f"Updated Android adaptive background: {file_path}")
                except Exception as e:
                    print(f"Error updating {file_path}: {e}")
            elif f == 'ic_launcher_foreground.png':
                # Transparent cart foreground
                try:
                    orig_im = Image.open(file_path)
                    w, h = orig_im.size
                    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
                    # Scale to fit center (inner 66%)
                    scale = int(min(w, h) * 0.6)
                    scaled_cart = transparent_cart.resize((scale, int(scale * transparent_cart.height / transparent_cart.width)), Image.Resampling.LANCZOS)
                    px = (w - scaled_cart.width) // 2
                    py = (h - scaled_cart.height) // 2
                    img.paste(scaled_cart, (px, py), scaled_cart)
                    img.save(file_path, 'PNG')
                    print(f"Updated Android adaptive foreground: {file_path}")
                except Exception as e:
                    print(f"Error updating {file_path}: {e}")
            elif f in ['ic_launcher.png', 'ic_launcher_round.png']:
                # Cart centered on solid green
                try:
                    orig_im = Image.open(file_path)
                    w, h = orig_im.size
                    img = Image.new('RGB', (w, h), (18, 194, 75))
                    scale = int(min(w, h) * 0.7)
                    scaled_cart = cart.resize((scale, int(scale * cart.height / cart.width)), Image.Resampling.LANCZOS)
                    px = (w - scaled_cart.width) // 2
                    py = (h - scaled_cart.height) // 2
                    img.paste(scaled_cart, (px, py))
                    img.save(file_path, 'PNG')
                    print(f"Updated Android icon: {file_path}")
                except Exception as e:
                    print(f"Error updating {file_path}: {e}")
            elif f == 'splash.png':
                # Overall logo centered on gradient background
                try:
                    orig_im = Image.open(file_path)
                    w, h = orig_im.size
                    img = draw_gradient_fast(w, h)
                    # Scale overall logo to fit (e.g. 60% width for portrait, 60% height for landscape)
                    if w > h: # landscape
                        scale_h = int(h * 0.6)
                        scale_w = int(scale_h * overall.width / overall.height)
                    else: # portrait
                        scale_w = int(w * 0.65)
                        scale_h = int(scale_w * overall.height / overall.width)
                    scaled_overall = overall.resize((scale_w, scale_h), Image.Resampling.LANCZOS)
                    px = (w - scaled_overall.width) // 2
                    py = (h - scaled_overall.height) // 2
                    img.paste(scaled_overall, (px, py))
                    img.save(file_path, 'PNG')
                    print(f"Updated Android splash screen: {file_path}")
                except Exception as e:
                    print(f"Error updating {file_path}: {e}")

if __name__ == '__main__':
    main()

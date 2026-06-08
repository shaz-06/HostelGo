import os
import sys
from PIL import Image, ImageDraw, ImageFont

def make_background_transparent(img, tolerance=45):
    img = img.convert('RGBA')
    pix = img.load()
    w, h = img.size
    
    # Target color is the top-left corner background color
    target_color = pix[0, 0]
    
    visited = set()
    queue = [(0, 0), (w-1, 0), (0, h-1), (w-1, h-1)]
    for q in queue:
        visited.add(q)
        
    while queue:
        cx, cy = queue.pop(0)
        curr = pix[cx, cy]
        # Color distance formula
        dist = abs(curr[0] - target_color[0]) + abs(curr[1] - target_color[1]) + abs(curr[2] - target_color[2])
        if dist < tolerance:
            # Set alpha to 0 (transparent)
            pix[cx, cy] = (curr[0], curr[1], curr[2], 0)
            for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
                nx, ny = cx + dx, cy + dy
                if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in visited:
                    visited.add((nx, ny))
                    queue.append((nx, ny))
    return img

def main():
    logo_path = '/Users/shashankshetty/Documents/HostelGo/vite-project/src/assets/branding/buyto-logo.png'
    if not os.path.exists(logo_path):
        print(f"Error: logo not found at {logo_path}")
        sys.exit(1)
        
    logo = Image.open(logo_path)
    
    # Crop the overall logo (cart, groceries, and text)
    # The bounding box containing the complete logo
    overall_box = (211, 118, 750, 709)
    overall = logo.crop(overall_box)
    
    # Remove the gradient background to make it transparent
    transparent_logo = make_background_transparent(overall)
    
    # Target DPI sizes for android launcher icons
    dpi_sizes = {
        'mdpi': 48,
        'hdpi': 72,
        'xhdpi': 96,
        'xxhdpi': 144,
        'xxxhdpi': 192
    }
    
    res_dir = '/Users/shashankshetty/Documents/HostelGo/vite-project/android/app/src/main/res'
    
    # Generate mipmap resources
    for label, size in dpi_sizes.items():
        mipmap_path = os.path.join(res_dir, f'mipmap-{label}')
        os.makedirs(mipmap_path, exist_ok=True)
        
        # 1. ic_launcher.png (Solid green background with scaled logo centered)
        launcher_img = Image.new('RGB', (size, size), (18, 194, 75)) # #12C24B
        # Scale factor: 45% of size ensures it is safely within the 66% circle (radius ~33%)
        # Corner distance = sqrt(20.25%^2 + 20.25%^2) = 28.6% < 33% (Radius of safe circle)
        scale = int(size * 0.45)
        scaled_logo = transparent_logo.resize((scale, int(scale * transparent_logo.height / transparent_logo.width)), Image.Resampling.LANCZOS)
        
        px = (size - scaled_logo.width) // 2
        py = (size - scaled_logo.height) // 2
        
        # Paste transparent logo on background
        launcher_img.paste(scaled_logo, (px, py), scaled_logo)
        launcher_img.save(os.path.join(mipmap_path, 'ic_launcher.png'), 'PNG')
        
        # 2. ic_launcher_round.png (Circular mask over the launcher image)
        mask = Image.new('L', (size, size), 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse((0, 0, size - 1, size - 1), fill=255)
        round_img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        round_img.paste(launcher_img, (0, 0))
        round_img.putalpha(mask)
        round_img.save(os.path.join(mipmap_path, 'ic_launcher_round.png'), 'PNG')
        
        # 3. ic_launcher_foreground.png (Transparent background with logo centered)
        # Adaptive foreground should be 108dp base (in pixels: mdpi=108, hdpi=162, xhdpi=216, xxhdpi=324, xxxhdpi=432)
        fg_size = int(size * (108.0 / 48.0))
        fg_img = Image.new('RGBA', (fg_size, fg_size), (0, 0, 0, 0))
        fg_scale = int(fg_size * 0.45)
        scaled_fg_logo = transparent_logo.resize((fg_scale, int(fg_scale * transparent_logo.height / transparent_logo.width)), Image.Resampling.LANCZOS)
        
        fg_px = (fg_size - scaled_fg_logo.width) // 2
        fg_py = (fg_size - scaled_fg_logo.height) // 2
        fg_img.paste(scaled_fg_logo, (fg_px, fg_py), scaled_fg_logo)
        fg_img.save(os.path.join(mipmap_path, 'ic_launcher_foreground.png'), 'PNG')
        
        # 4. ic_launcher_background.png (Solid green background)
        bg_img = Image.new('RGB', (fg_size, fg_size), (18, 194, 75))
        bg_img.save(os.path.join(mipmap_path, 'ic_launcher_background.png'), 'PNG')
        
        print(f"Generated Android launcher resources for {label} (size {size}px)")

    # Let's generate Web/PWA icons as well using the full scaled logo
    pwa_sizes = {
        'favicon.png': 48,
        'apple-touch-icon.png': 180,
        'icon-192.png': 192,
        'icon-512.png': 512
    }
    for name, size in pwa_sizes.items():
        pwa_img = Image.new('RGB', (size, size), (18, 194, 75))
        scale = int(size * 0.45)
        scaled_logo = transparent_logo.resize((scale, int(scale * transparent_logo.height / transparent_logo.width)), Image.Resampling.LANCZOS)
        px = (size - scaled_logo.width) // 2
        py = (size - scaled_logo.height) // 2
        pwa_img.paste(scaled_logo, (px, py), scaled_logo)
        pwa_img.save(f'/Users/shashankshetty/Documents/HostelGo/vite-project/public/{name}', 'PNG')
        print(f"Generated PWA launcher icon: public/{name}")

    # Generate custom preview images for verification
    preview_dir = '/Users/shashankshetty/.gemini/antigravity-ide/brain/4090ba4b-ad48-47d3-8125-7eb99087943c'
    os.makedirs(preview_dir, exist_ok=True)
    
    # 1. Preview of launcher (192x192)
    preview_launch = Image.new('RGB', (192, 192), (18, 194, 75))
    scale = int(192 * 0.45)
    scaled_logo = transparent_logo.resize((scale, int(scale * transparent_logo.height / transparent_logo.width)), Image.Resampling.LANCZOS)
    px = (192 - scaled_logo.width) // 2
    py = (192 - scaled_logo.height) // 2
    preview_launch.paste(scaled_logo, (px, py), scaled_logo)
    preview_launch.save(os.path.join(preview_dir, 'preview_launcher.png'))
    
    # 2. Preview of round launcher (192x192)
    mask = Image.new('L', (192, 192), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, 191, 191), fill=255)
    preview_round = Image.new('RGBA', (192, 192), (0,0,0,0))
    preview_round.paste(preview_launch, (0, 0))
    preview_round.putalpha(mask)
    preview_round.save(os.path.join(preview_dir, 'preview_round.png'))

    # 3. Preview of Squircle/Adaptive launcher (192x192)
    # Squircle masking path simulation
    squircle_mask = Image.new('L', (192, 192), 0)
    draw_sq = ImageDraw.Draw(squircle_mask)
    draw_sq.rounded_rectangle((4, 4, 187, 187), radius=45, fill=255)
    preview_adaptive = Image.new('RGBA', (192, 192), (0,0,0,0))
    preview_adaptive.paste(preview_launch, (0,0))
    preview_adaptive.putalpha(squircle_mask)
    preview_adaptive.save(os.path.join(preview_dir, 'preview_adaptive.png'))

    # 4. Preview of Home screen appearance
    # Let's create a beautiful phone home screen mock (375x600)
    # Light dark gradient background wallpaper
    homescreen = Image.new('RGB', (375, 600), (33, 33, 33))
    draw_hs = ImageDraw.Draw(homescreen)
    
    # Draw simple gradient look
    for y in range(600):
        ratio = y / 599.0
        r = int(24 * (1 - ratio) + 10 * ratio)
        g = int(30 * (1 - ratio) + 15 * ratio)
        b = int(40 * (1 - ratio) + 20 * ratio)
        draw_hs.line([(0, y), (374, y)], fill=(r, g, b))
        
    # Draw a clean wallpaper bottom dock
    draw_hs.rounded_rectangle((12, 500, 363, 580), radius=20, fill=(255, 255, 255, 30))
    
    # Draw the adaptive/squircle icon on the home screen mock
    icon_display = preview_adaptive.resize((72, 72), Image.Resampling.LANCZOS)
    h_px = (375 - 72) // 2
    h_py = 180
    homescreen.paste(icon_display, (h_px, h_py), icon_display)
    
    # Draw simple text label "Buyto Instant"
    # Using a simple block rendering for the text label if font is missing
    # We will use ImageDraw default text or draw a simple clean label
    try:
        # Try loading a standard system font
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 12)
    except:
        font = ImageFont.load_default()
        
    label_text = "Buyto Instant"
    # Get text width
    if hasattr(draw_hs, 'textbbox'):
        bbox = draw_hs.textbbox((0, 0), label_text, font=font)
        tw = bbox[2] - bbox[0]
    else:
        tw = draw_hs.textsize(label_text, font=font)[0]
        
    tx = (375 - tw) // 2
    ty = h_py + 80
    draw_hs.text((tx, ty), label_text, fill=(255, 255, 255), font=font)
    
    homescreen.save(os.path.join(preview_dir, 'preview_homescreen.png'))
    print("Generated preview screenshots under artifacts folder.")

if __name__ == '__main__':
    main()

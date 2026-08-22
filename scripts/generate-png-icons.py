import math
from PIL import Image, ImageDraw

def render_sello_image(size):
    # Create high-res supersampled image (4x)
    scale = 4
    dim = size * scale
    img = Image.new("RGBA", (dim, dim), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Background color #071914
    bg_color = (7, 25, 20, 255)
    corner_radius = int(dim * 0.20)
    draw.rounded_rectangle([0, 0, dim - 1, dim - 1], radius=corner_radius, fill=bg_color)
    
    # Inner border line
    gold = (197, 168, 128, 255)
    gold_trans = (197, 168, 128, 55)
    gold_border = (197, 168, 128, 65)
    wax_white = (226, 217, 200, 255)
    
    margin = int(dim * 0.05)
    draw.rounded_rectangle(
        [margin, margin, dim - margin - 1, dim - margin - 1],
        radius=int(corner_radius * 0.8),
        outline=gold_border,
        width=int(1.5 * scale)
    )
    
    # Center and Hexagon
    cx, cy = dim / 2.0, dim / 2.0
    hex_r = dim * 0.31
    hex_points = []
    for i in range(6):
        angle_deg = 30 + i * 60
        angle_rad = math.radians(angle_deg)
        x = cx + hex_r * math.cos(angle_rad)
        y = cy + hex_r * math.sin(angle_rad)
        hex_points.append((x, y))
        
    # Draw Hexagon
    draw.polygon(hex_points, outline=gold, width=max(1, int(3 * scale)))
    
    # Draw 4 Ulmo Petals (cardinal axes: 0, 90, 180, 270 deg)
    petal_len = dim * 0.23
    petal_width = dim * 0.09
    
    for angle in [0, 90, 180, 270]:
        # Create an elliptical petal shape pointing outwards
        rad = math.radians(angle)
        px = cx + math.cos(rad) * (petal_len * 0.55)
        py = cy + math.sin(rad) * (petal_len * 0.55)
        
        # Bounding box for ellipse centered at px, py
        if angle in [0, 180]:
            bbox = [
                px - petal_len * 0.45,
                py - petal_width * 0.5,
                px + petal_len * 0.45,
                py + petal_width * 0.5
            ]
        else:
            bbox = [
                px - petal_width * 0.5,
                py - petal_len * 0.45,
                px + petal_width * 0.5,
                py + petal_len * 0.45
            ]
            
        draw.ellipse(bbox, fill=gold_trans, outline=gold, width=max(1, int(1.8 * scale)))
        
    # Inner dashed ring
    ring_r = dim * 0.085
    draw.ellipse(
        [cx - ring_r, cy - ring_r, cx + ring_r, cy + ring_r],
        outline=(197, 168, 128, 120),
        width=max(1, int(1.2 * scale))
    )
    
    # Wax drop center
    core_r = dim * 0.03
    draw.ellipse(
        [cx - core_r, cy - core_r, cx + core_r, cy + core_r],
        fill=wax_white
    )
    
    # Downsample to target size with high-quality Lanczos resampling
    final_img = img.resize((size, size), Image.Resampling.LANCZOS)
    return final_img

# Generate all required PNGs
img_512 = render_sello_image(512)
img_192 = render_sello_image(192)
img_180 = render_sello_image(180)
img_32 = render_sello_image(32)
img_16 = render_sello_image(16)

# Save to Nucleo
img_512.save("apps/nucleo/public/icons/icon-512.png")
img_192.save("apps/nucleo/public/icons/icon-192.png")
img_180.save("apps/nucleo/public/icons/apple-touch-icon.png")
img_512.save("apps/nucleo/public/favicon.ico", format="ICO", sizes=[(16,16), (32,32), (48,48), (64,64)])

# Save to Tienda
img_512.save("apps/tienda/public/icons/icon-512.png")
img_192.save("apps/tienda/public/icons/icon-192.png")
img_180.save("apps/tienda/public/icons/apple-touch-icon.png")
img_512.save("apps/tienda/public/favicon.ico", format="ICO", sizes=[(16,16), (32,32), (48,48), (64,64)])

print("All PNG and ICO icons successfully generated!")

import os
import struct
import zlib
import math

def create_png(width, height, draw_func):
    """Creates an RGBA PNG using only standard library struct and zlib."""
    raw_rows = []
    
    for y in range(height):
        row = bytearray([0]) # Filter type 0 (None)
        for x in range(width):
            r, g, b, a = draw_func(x, y, width, height)
            row.extend([r, g, b, a])
        raw_rows.append(row)
        
    raw_data = b''.join(raw_rows)
    compressed = zlib.compress(raw_data, 9)
    
    png = bytearray(b'\x89PNG\r\n\x1a\n')
    
    # IHDR chunk
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data)
    png.extend(struct.pack('>I', len(ihdr_data)))
    png.extend(b'IHDR')
    png.extend(ihdr_data)
    png.extend(struct.pack('>I', ihdr_crc))
    
    # IDAT chunk
    idat_crc = zlib.crc32(b'IDAT' + compressed)
    png.extend(struct.pack('>I', len(compressed)))
    png.extend(b'IDAT')
    png.extend(compressed)
    png.extend(struct.pack('>I', idat_crc))
    
    # IEND chunk
    iend_crc = zlib.crc32(b'IEND')
    png.extend(struct.pack('>I', 0))
    png.extend(b'IEND')
    png.extend(struct.pack('>I', iend_crc))
    
    return bytes(png)

def draw_app_icon(x, y, w, h, maskable=False):
    # Center and normalized coords [-1, 1]
    nx = (x / (w - 1)) * 2 - 1
    ny = (y / (h - 1)) * 2 - 1
    dist = math.sqrt(nx*nx + ny*ny)
    
    # Background: Rounded rectangle or full circle
    corner_radius = 0.35 if not maskable else 0.0
    # Squircles approximation
    r_val = math.pow(abs(nx), 4) + math.pow(abs(ny), 4)
    is_inside_card = r_val <= 0.88 if not maskable else True
    
    if not is_inside_card:
        return (0, 0, 0, 0) # Transparent exterior
        
    # Beautiful vibrant emerald gradient: from #059669 (5, 150, 105) to #10b981 (16, 185, 129)
    grad_t = (ny + 1) / 2
    bg_r = int(5 * (1 - grad_t) + 16 * grad_t)
    bg_g = int(150 * (1 - grad_t) + 185 * grad_t)
    bg_b = int(105 * (1 - grad_t) + 129 * grad_t)
    
    # Lithuanian Tri-color Shield / Badge in the center
    # Target center box: nx in [-0.55, 0.55], ny in [-0.55, 0.55]
    if -0.52 <= nx <= 0.52 and -0.52 <= ny <= 0.52:
        # Rounded shield/box
        shield_dist = math.pow(abs(nx / 0.52), 4) + math.pow(abs(ny / 0.52), 4)
        if shield_dist <= 1.0:
            # Golden border around shield
            if shield_dist >= 0.82:
                return (245, 158, 11, 255) # Amber gold border
            
            # Interior: Lithuanian Flag stripes (Yellow, Green, Red)
            # Yellow: top third (ny from -0.52 to -0.17)
            # Green: middle third (ny from -0.17 to 0.17)
            # Red: bottom third (ny from 0.17 to 0.52)
            if ny < -0.17:
                # Yellow: #FDB913
                return (253, 185, 19, 255)
            elif ny < 0.17:
                # Green: #006A44
                return (0, 106, 68, 255)
            else:
                # Red: #C1272D
                return (193, 39, 45, 255)
                
    # Amber glowing outer border if not maskable
    if not maskable and r_val >= 0.78:
        return (251, 191, 36, 255) # Golden rim
        
    return (bg_r, bg_g, bg_b, 255)

def main():
    os.makedirs('public/icons', exist_ok=True)
    
    icons = [
        ('public/icons/icon-192.png', 192, 192, False),
        ('public/icons/icon-512.png', 512, 512, False),
        ('public/icons/icon-maskable-192.png', 192, 192, True),
        ('public/icons/icon-maskable-512.png', 512, 512, True),
        ('public/icons/apple-touch-icon.png', 180, 180, False),
    ]
    
    for path, w, h, maskable in icons:
        print(f"Generating {path} ({w}x{h}, maskable={maskable})...")
        data = create_png(w, h, lambda x, y, width, height: draw_app_icon(x, y, width, height, maskable))
        with open(path, 'wb') as f:
            f.write(data)
        print(f"Saved {path} ({len(data)} bytes)")

if __name__ == '__main__':
    main()

import cv2
import numpy as np

img = cv2.imread('C:\\Users\\Usuario\\Desktop\\TOYOTA\\Interactivo\\Logo\\DyPgris.png', cv2.IMREAD_UNCHANGED)
h, w = img.shape[:2]

if img.shape[2] == 4:
    gray = cv2.cvtColor(img, cv2.COLOR_BGRA2GRAY)
else:
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

_, thresh = cv2.threshold(gray, 220, 255, cv2.THRESH_BINARY_INV)
contours, hierarchy = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

# Only outermost contours (parent == -1), sorted by area descending
outer = [(i, c, hierarchy[0][i]) for i, c in enumerate(contours) if hierarchy[0][i][3] == -1]
outer.sort(key=lambda x: cv2.contourArea(x[1]), reverse=True)

# Take top 3 (D, P, Y)
letters = []
for i, contour, hier in outer[:5]:
    area = cv2.contourArea(contour)
    if area < 10000:
        continue
    x, y, cw, ch = cv2.boundingRect(contour)
    mask = np.zeros(gray.shape, dtype=np.uint8)
    cv2.drawContours(mask, [contour], -1, 255, -1)
    mean_color = cv2.mean(img, mask)[:3]
    b, g, r = mean_color
    color_hex = f'#{int(r):02x}{int(g):02x}{int(b):02x}'

    # Children (holes)
    child_idx = hier[2]
    holes = []
    if child_idx >= 0:
        current = child_idx
        while current >= 0:
            child = contours[current]
            ca = cv2.contourArea(child)
            if ca > 50:
                holes.append(child)
            current = hierarchy[0][current][0]

    letters.append({
        'idx': i, 'area': area, 'contour': contour, 'holes': holes,
        'x': x, 'y': y, 'w': cw, 'h': ch, 'color': color_hex
    })
    print(f"Letter: x={x}, y={y}, w={cw}, h={ch}, area={area:.0f}, color={color_hex}, holes={len(holes)}")

# Generate SVG with eps=10 for good simplification
svg = []
svg.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}">')
svg.append(f'  <rect width="{w}" height="{h}" fill="white"/>')

eps = 12
for l in letters:
    approx = cv2.approxPolyDP(l['contour'], eps, True)
    path = f'<path d="M'
    for pt in approx:
        px, py = pt[0]
        path += f' {px},{py}'
    path += ' Z'
    for hole in l['holes']:
        hole_approx = cv2.approxPolyDP(hole, eps, True)
        path += ' M'
        for pt in hole_approx:
            px, py = pt[0]
            path += f' {px},{py}'
        path += ' Z'
    path += f'" fill="{l["color"]}" fill-opacity="1" stroke="none"/>'
    svg.append(f'  <!-- ({l["x"]},{l["y"]}) {l["w"]}x{l["h"]} -->')
    svg.append(f'  {path}')
    
    # Also output center-to-origin normalized path for D and P (same height)
    if l['w'] > 100:
        # Normalize so that the letter sits in a 100-unit coordinate system
        ox, oy, ow, oh = l['x'], l['y'], l['w'], l['h']
        npts = len(approx)
        norm_path = f'      <!-- {npts} points -->'
        norm_path += f'\n      <path d="M'
        for pt in approx:
            px, py = pt[0]
            nx = (px - ox) / ow * 100
            ny = (py - oy) / oh * 100
            norm_path += f' {nx:.1f},{ny:.1f}'
        norm_path += ' Z'
        for hole in l['holes']:
            hole_approx = cv2.approxPolyDP(hole, eps, True)
            norm_path += ' M'
            for pt in hole_approx:
                px, py = pt[0]
                nx = (px - ox) / ow * 100
                ny = (py - oy) / oh * 100
                norm_path += f' {nx:.1f},{ny:.1f}'
            norm_path += ' Z'
        norm_path += f'" fill="{l["color"]}" fill-opacity="1" stroke="none"/>'
        print(f"\nNormalized path ({ow}x{oh}):")
        print(norm_path)

svg.append('</svg>')

out_path = 'C:\\Users\\Usuario\\Desktop\\TOYOTA\\Interactivo\\Logo\\DyPgris_simplificado.svg'
with open(out_path, 'w') as f:
    f.write('\n'.join(svg))

print(f"\nSaved to {out_path}")

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

# Extract D, P, Y
outer_contours = []
for i, contour, hier in outer[:5]:
    area = cv2.contourArea(contour)
    if area < 10000:
        continue
    child_idx = hier[2]
    holes = []
    if child_idx >= 0:
        current = child_idx
        while current >= 0:
            child = contours[current]
            if cv2.contourArea(child) > 50:
                holes.append(child)
            current = hierarchy[0][current][0]
    outer_contours.append({'contour': contour, 'holes': holes})

# Map: D (area 106137, left), P (area 58607, right), Y (area 16673, middle)
contours_sorted = sorted(outer_contours, key=lambda x: cv2.boundingRect(x['contour'])[0])

eps = 12
letters = []

for l in contours_sorted:
    rect = cv2.boundingRect(l['contour'])
    x, y, cw, ch = rect
    approx = cv2.approxPolyDP(l['contour'], eps, True)
    hole_approxes = []
    for hole in l['holes']:
        ha = cv2.approxPolyDP(hole, eps, True)
        hole_approxes.append(ha)
    letters.append({'x': x, 'y': y, 'w': cw, 'h': ch, 'approx': approx, 'holes': hole_approxes})

# D should be leftmost, Y middle, P rightmost
d_l = letters[0]
y_l = letters[1]  
p_l = letters[2]

# Original layout info
# D: x=282, y=302, w=331, h=368
# Y: x=619, y=445, w=225, h=224  
# P: x=849, y=302, w=331, h=368
# total_width: 897 (from D start to P end)
# D: 0 to 331, Y: 336 to 561, P: 566 to 897

d_x0 = 0
d_w = 331
p_x0 = 566
p_w = 331
y_x0 = 336
y_w = 225
total_w = 897
total_h = 368

# Y offset: y_start = 445-302 = 143
y_y0 = 143

def transform_point(px, py, src_box, dst_x, dst_y, dst_w, dst_h):
    """Transform from normalized 0-100 space to destination box"""
    sx, sy, sw, sh = src_box
    nx = (px - sx) / sw * 100  # re-normalize
    ny = (py - sy) / sh * 100
    ox = dst_x + nx / 100 * dst_w
    oy = dst_y + ny / 100 * dst_h
    return ox, oy

# Generate final SVG
svg = []
svg.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {total_w} {total_h}">')
svg.append(f'  <rect width="{total_w}" height="{total_h}" fill="white"/>')

# D
d_path = 'M'
for pt in d_l['approx']:
    px, py = pt[0]
    ox = (px - d_l['x']) / d_l['w'] * d_w
    oy = (py - d_l['y']) / d_l['h'] * total_h
    d_path += f' {ox:.1f},{oy:.1f}'
d_path += ' Z'
for hole in d_l['holes']:
    d_path += ' M'
    for pt in hole:
        px, py = pt[0]
        ox = (px - d_l['x']) / d_l['w'] * d_w
        oy = (py - d_l['y']) / d_l['h'] * total_h
        d_path += f' {ox:.1f},{oy:.1f}'
    d_path += ' Z'
svg.append(f'  <path d="{d_path}" fill="#9e9d9e"/>')

# P
p_path = 'M'
for pt in p_l['approx']:
    px, py = pt[0]
    ox = p_x0 + (px - p_l['x']) / p_l['w'] * p_w
    oy = (py - p_l['y']) / p_l['h'] * total_h
    p_path += f' {ox:.1f},{oy:.1f}'
p_path += ' Z'
svg.append(f'  <path d="{p_path}" fill="#706f71"/>')

# Y
y_path = 'M'
for pt in y_l['approx']:
    px, py = pt[0]
    ox = y_x0 + (px - y_l['x']) / y_l['w'] * y_w
    oy = y_y0 + (py - y_l['y']) / y_l['h'] * (total_h - y_y0)
    y_path += f' {ox:.1f},{oy:.1f}'
y_path += ' Z'
svg.append(f'  <path d="{y_path}" fill="#f07e02"/>')

# Red bounding boxes and separators for reference
svg.append(f'  <rect x="0" y="0" width="{d_w}" height="{total_h}" fill="none" stroke="red" stroke-dasharray="4,4" stroke-width="2"/>')
svg.append(f'  <rect x="{y_x0}" y="{y_y0}" width="{y_w}" height="{total_h - y_y0}" fill="none" stroke="red" stroke-dasharray="4,4" stroke-width="2"/>')
svg.append(f'  <rect x="{p_x0}" y="0" width="{p_w}" height="{total_h}" fill="none" stroke="red" stroke-dasharray="4,4" stroke-width="2"/>')

svg.append('</svg>')

out_path = 'C:\\Users\\Usuario\\Desktop\\TOYOTA\\Interactivo\\Logo\\DyPgris_final.svg'
with open(out_path, 'w') as f:
    f.write('\n'.join(svg))

print(f"Saved to {out_path}")

# Also output compact version with viewBox 0 0 100 41
svg2 = []
svg2.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 41">')

scale = 100 / total_w

def fmt(x):
    return f"{x*scale:.2f}"

# D
d2 = 'M'
for pt in d_l['approx']:
    px, py = pt[0]
    ox = (px - d_l['x']) / d_l['w'] * d_w * scale
    oy = (py - d_l['y']) / d_l['h'] * total_h * scale
    d2 += f' {ox:.2f},{oy:.2f}'
d2 += ' Z'
for hole in d_l['holes']:
    d2 += ' M'
    for pt in hole:
        px, py = pt[0]
        ox = (px - d_l['x']) / d_l['w'] * d_w * scale
        oy = (py - d_l['y']) / d_l['h'] * total_h * scale
        d2 += f' {ox:.2f},{oy:.2f}'
    d2 += ' Z'
svg2.append(f'  <path d="{d2}" fill="#9e9d9e"/>')

# P
p2 = 'M'
for pt in p_l['approx']:
    px, py = pt[0]
    ox = (p_x0 + (px - p_l['x']) / p_l['w'] * p_w) * scale
    oy = (py - p_l['y']) / p_l['h'] * total_h * scale
    p2 += f' {ox:.2f},{oy:.2f}'
p2 += ' Z'
svg2.append(f'  <path d="{p2}" fill="#706f71"/>')

# Y
y2 = 'M'
for pt in y_l['approx']:
    px, py = pt[0]
    ox = (y_x0 + (px - y_l['x']) / y_l['w'] * y_w) * scale
    oy = (y_y0 + (py - y_l['y']) / y_l['h'] * (total_h - y_y0)) * scale
    y2 += f' {ox:.2f},{oy:.2f}'
y2 += ' Z'
svg2.append(f'  <path d="{y2}" fill="#f07e02"/>')

svg2.append('</svg>')

out2 = 'C:\\Users\\Usuario\\Desktop\\TOYOTA\\Interactivo\\Logo\\DyPgris_final_compact.svg'
with open(out2, 'w') as f:
    f.write('\n'.join(svg2))

print(f"Saved to {out2}")
print("Done")

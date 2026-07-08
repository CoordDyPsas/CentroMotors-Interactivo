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

print(f"Found {len(contours)} contours")

min_area = 200
large_contours = [(i, c) for i, c in enumerate(contours) if cv2.contourArea(c) > min_area]
print(f"Large contours: {len(large_contours)}")

svg_lines = []
svg_lines.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}">')

for idx, (contour_idx, contour) in enumerate(large_contours):
    area = cv2.contourArea(contour)
    peri = cv2.arcLength(contour, True)
    approx = cv2.approxPolyDP(contour, 1.0, True)

    mask = np.zeros(gray.shape, dtype=np.uint8)
    cv2.drawContours(mask, [contour], -1, 255, -1)
    mean_color = cv2.mean(img, mask)[:3]
    r, g, b = mean_color

    hier = hierarchy[0][contour_idx] if hierarchy is not None else [0,0,0,0]
    parent = hier[3]

    label = f"c{idx}_area{area:.0f}"

    # Determine rough type
    if parent >= 0:
        ctype = "hole"
        color_str = "white"
    elif r > 180 and g > 180:
        ctype = "bg"
        color_str = "white"
    elif r > 150 and g < 100:
        ctype = "orange(Y)"
        color_str = f"rgb({int(r)},{int(g)},{int(b)})"
    else:
        ctype = "gray(D/P)"
        color_str = f"rgb({int(r)},{int(g)},{int(b)})"

    print(f"  Contour {idx}: area={area:.0f} len={len(approx)} pts parent={parent} type={ctype} color=rgb({int(r)},{int(g)},{int(b)})")

    path_data = "M"
    for pt in approx:
        x, y = pt[0]
        path_data += f" {x},{y}"
    path_data += " Z"

    svg_lines.append(f'  <path d="{path_data}" fill="{color_str}" fill-opacity="0.7" stroke="{color_str}" stroke-width="3"/>')
    svg_lines.append(f'  <text x="{approx[0][0][0]}" y="{approx[0][0][1]}" font-size="16" fill="red">{idx}</text>')

svg_lines.append('</svg>')

out_path = 'C:\\Users\\Usuario\\Desktop\\TOYOTA\\Interactivo\\Logo\\DyPgris_contornos.svg'
with open(out_path, 'w') as f:
    f.write('\n'.join(svg_lines))

print(f"\nSaved to {out_path}")
print("Done")

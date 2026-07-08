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

print(f"Total contours: {len(contours)}")
print(f"Hierarchy:\n{len(hierarchy[0]) if hierarchy is not None else None} items\n")

# Show all large contours with their hierarchy
min_area = 100
big = [(i, c, hierarchy[0][i]) for i, c in enumerate(contours) if cv2.contourArea(c) > min_area]
big_sorted = sorted(big, key=lambda x: cv2.contourArea(x[1]), reverse=True)

print("All large contours sorted by area:")
for idx, (i, c, h) in enumerate(big_sorted):
    area = cv2.contourArea(c)
    x, y, cw, ch = cv2.boundingRect(c)
    mask = np.zeros(gray.shape, dtype=np.uint8)
    cv2.drawContours(mask, [c], -1, 255, -1)
    mean_color = cv2.mean(img, mask)[:3]
    b = mean_color[0]; g = mean_color[1]; r = mean_color[2]
    
    nxt, prv, child, parent = h
    print(f"  [{idx}] idx={i}: area={area:.0f} rect=({x},{y},{cw},{ch}) color=BGR({int(b)},{int(g)},{int(r)}) parent={parent} child={child}")

# Now let's generate a clean SVG with just the 3 main letters
# Identify D, Y, P based on size and position
print("\n\nGenerating clean SVG...")

# Get the full hierarchy to find outermost contours
outer_contours = [(i, c) for i, c, h in big if h[3] == -1]
outer_sorted = sorted(outer_contours, key=lambda x: cv2.contourArea(x[1]), reverse=True)

svg = []
svg.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}">')
svg.append(f'  <rect width="{w}" height="{h}" fill="white"/>')

for idx, (i, contour) in enumerate(outer_sorted[:5]):
    area = cv2.contourArea(contour)
    if area < 10000:
        continue
    
    # Get all child contours (holes)
    child_idx = hierarchy[0][i][2]
    holes = []
    if child_idx >= 0:
        # Traverse children
        current = child_idx
        while current >= 0:
            child_contour = contours[current]
            if cv2.contourArea(child_contour) > 50:
                holes.append(child_contour)
            current = hierarchy[0][current][0]  # next sibling
    
    epsilon = 0.5
    approx = cv2.approxPolyDP(contour, epsilon, True)
    
    mask = np.zeros(gray.shape, dtype=np.uint8)
    cv2.drawContours(mask, [contour], -1, 255, -1)
    mean_color = cv2.mean(img, mask)[:3]
    b, g, r = mean_color
    color_hex = f'#{int(r):02x}{int(g):02x}{int(b):02x}'
    
    x, y, cw, ch = cv2.boundingRect(contour)
    
    # Determine letter
    if area > 90000:
        letter = "D (probable)"
    elif area > 40000:
        letter = "P (probable)"
    elif area > 10000:
        letter = "Y (probable)"
    else:
        letter = "?"
    
    print(f"\nLetter: {letter}")
    print(f"  Area: {area}, Position: ({x},{y}), Size: {cw}x{ch}")
    print(f"  Color: BGR({int(b)},{int(g)},{int(r)}) = #{int(r):02x}{int(g):02x}{int(b):02x}")
    print(f"  Holes: {len(holes)}")
    print(f"  Points: {len(approx)}")
    
    # Generate SVG path
    path = f'<path d="M'
    for pt in approx:
        px, py = pt[0]
        path += f' {px},{py}'
    path += ' Z'
    
    # Add holes
    for hole in holes:
        hole_approx = cv2.approxPolyDP(hole, epsilon, True)
        path += ' M'
        for pt in hole_approx:
            px, py = pt[0]
            path += f' {px},{py}'
        path += ' Z'
    
    path += f'" fill="{color_hex}" fill-opacity="0.9" stroke="none"/>'
    svg.append(f'  <!-- {letter} area={area} pos=({x},{y}) size={cw}x{ch} -->')
    svg.append(f'  {path}')
    svg.append(f'  <rect x="{x}" y="{y}" width="{cw}" height="{ch}" fill="none" stroke="red" stroke-width="3" stroke-dasharray="8,8"/>')
    svg.append(f'  <text x="{x}" y="{y-10}" font-size="24" fill="red" font-weight="bold">{letter} ({cw}x{ch})</text>')

svg.append('</svg>')

out_path = 'C:\\Users\\Usuario\\Desktop\\TOYOTA\\Interactivo\\Logo\\DyPgris_letras.svg'
with open(out_path, 'w') as f:
    f.write('\n'.join(svg))

print(f"\nSaved to {out_path}")

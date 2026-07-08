import json, os

src = r'C:\Users\Usuario\Desktop\TOYOTA\Interactivo\colon'

with open(os.path.join(src, 'equipos.json'), encoding='utf-8') as f:
    equipos = json.load(f)
with open(os.path.join(src, 'coordenadas_colon.json'), encoding='utf-8') as f:
    coords = json.load(f)

coord_map = {c['nro']: c for c in coords}
merged = []
for e in equipos:
    n = e['nro']
    if n in coord_map:
        e['x'] = coord_map[n]['x']
        e['y'] = coord_map[n]['y']
        merged.append(e)

print(json.dumps(merged, ensure_ascii=False, indent=2))

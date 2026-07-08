import json

with open('equipos_sf.json', encoding='utf-8') as f:
    equipos = json.load(f)

with open('coordenadas_sf.json', encoding='utf-8') as f:
    coords = json.load(f)

merged = []
for eq in equipos:
    nro_str = str(eq['nro'])
    if nro_str in coords:
        eq['x'] = round(coords[nro_str]['x'])
        eq['y'] = round(coords[nro_str]['y'])
    else:
        eq['x'] = 0
        eq['y'] = 0
    merged.append(eq)

with open('merged_sf.json', 'w', encoding='utf-8') as f:
    json.dump(merged, f, ensure_ascii=False, indent=2)

pb_count = len([e for e in merged if e['piso'] == 'pb'])
pa_count = len([e for e in merged if e['piso'] == 'pa'])
print(f"Total: {len(merged)} equipos (PB: {pb_count}, PA: {pa_count})")
for eq in merged:
    print(f"  #{eq['nro']}: ({eq['x']}, {eq['y']}) {eq['ubicacion']} [{eq['piso']}]")

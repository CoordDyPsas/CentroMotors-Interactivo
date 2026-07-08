from PIL import Image
import json

img = Image.open('plano.png')
W, H = 3309, 2339
split_y = 1550

# Create PB image: top portion (0 to split_y) on white canvas
pb = Image.new('RGB', (W, H), (255, 255, 255))
pb_crop = img.crop((0, 0, W, split_y))
pb.paste(pb_crop, (0, 0))
pb.save('plano_pb.png')
print(f'plano_pb.png: {pb.size}')

# Create PA image: bottom portion (split_y to H) on white canvas, shifted up
pa = Image.new('RGB', (W, H), (255, 255, 255))
pa_crop = img.crop((0, split_y, W, H))
pa.paste(pa_crop, (0, 0))
pa.save('plano_pa.png')
print(f'plano_pa.png: {pa.size}')

# Adjust PA coordinates in merged_sf.json
with open('merged_sf.json', encoding='utf-8') as f:
    equipos = json.load(f)

for eq in equipos:
    if eq['piso'] == 'pa':
        eq['y'] -= split_y
        print(f'  #{eq["nro"]} PA: y -> {eq["y"]}')

with open('merged_sf.json', 'w', encoding='utf-8') as f:
    json.dump(equipos, f, ensure_ascii=False, indent=2)
print('merged_sf.json actualizado')

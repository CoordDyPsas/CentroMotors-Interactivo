import json, re

path = r'C:\Users\Usuario\Desktop\TOYOTA\Interactivo\sagrada-familia\index.html'
with open(path, encoding='utf-8') as f:
    content = f.read()

m = re.search(r'const EQUIPOS = (\[.*?\]);', content, re.S)
if not m:
    raise SystemExit('no match')

equipos = json.loads(m.group(1))
updates = {
    9:  {'ultimo_service':'24/10/2026','estado':'OK','ot':'10009'},
    10: {'ultimo_service':'24/10/2026','estado':'OK','ot':'10010'},
    11: {'ultimo_service':'17/10/2026','estado':'OK','ot':'9981'},
    12: {'ultimo_service':'17/10/2026','estado':'OK','ot':'9979'},
    13: {'ultimo_service':'24/10/2026','estado':'OK','ot':'10011'},
    14: {'ultimo_service':'24/10/2026','estado':'OK','ot':'10010'},
    15: {'ultimo_service':'24/10/2026','estado':'OK','ot':'10010'},
    16: {'ultimo_service':'24/10/2026','estado':'OK','ot':'10069'},
    17: {'ultimo_service':'24/10/2026','estado':'OK','ot':'10051'},
}

changed = []
for eq in equipos:
    nro = eq['nro']
    if nro in updates:
        up = updates[nro]
        for k,v in up.items():
            if eq.get(k) != v:
                eq[k] = v
                changed.append((nro,k,v))

new_arr = json.dumps(equipos, ensure_ascii=False)
new_content = content[:m.start(1)] + new_arr + content[m.end(1):]
with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)

for c in changed:
    print(c)
print('done')

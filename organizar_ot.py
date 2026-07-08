#!/usr/bin/env python3
"""organizar_ot.py - Copia PDFs de OT a estructura ot/{branch}/{ot_nro}.pdf

Busca PDFs en las carpetas de descarga de cada sucursal, extrae el numero
de OT del nombre del archivo, y copia a ot/{branch}/{ot_nro}.pdf.

Uso:
  python organizar_ot.py
"""

import json, os, re, shutil, sys

BRANCHES = {
    'monsenor': {
        'html': 'monsenor/index.html',
        'folders': ['monsenor/OT- Toyota (Monseñor)']
    },
    'colon': {
        'html': 'colon/index.html',
        'folders': ['colon/OT - Toyota (colon)']
    },
    'sagrada-familia': {
        'html': 'sagrada-familia/index.html',
        'folders': [os.path.join(os.path.expanduser('~'), 'Downloads', 'OT-SagradaFamilia')]
    }
}

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def extraer_ots(html_path):
    """Extrae los numeros de OT unicos del array EQUIPOS en el HTML."""
    path = os.path.join(BASE_DIR, html_path)
    if not os.path.exists(path):
        print(f'  ERROR: No existe {path}')
        return set()
    with open(path, 'r', encoding='utf-8') as f:
        html = f.read()
    ots = set()
    for m in re.finditer(r'"ot"\s*:\s*"(\d+)"', html):
        ots.add(int(m.group(1)))
    return ots


def encontrar_pdfs(carpetas, ots):
    """Busca PDFs en las carpetas que coincidan con los numeros de OT."""
    encontrados = {}  # ot_nro -> ruta_del_pdf
    for carpeta in carpetas:
        if not os.path.exists(carpeta):
            print(f'  AVISO: No existe carpeta {carpeta}')
            continue
        for fname in os.listdir(carpeta):
            if not fname.lower().endswith('.pdf'):
                continue
            # Extraer numero de OT del nombre del archivo
            nums_en_nombre = [int(n) for n in re.findall(r'\d+', fname)]
            for ot in ots:
                if ot in nums_en_nombre:
                    # Usar el primero que encontremos para cada OT
                    if ot not in encontrados:
                        encontrados[ot] = os.path.join(carpeta, fname)
    return encontrados


def organizar(branch, info):
    print(f'\n=== {branch} ===')

    ots = extraer_ots(info['html'])
    print(f'  OTs unicos en HTML: {len(ots)} -> {sorted(ots)}')

    encontrados = encontrar_pdfs(info['folders'], ots)
    print(f'  PDFs encontrados: {len(encontrados)}')

    faltantes = ots - set(encontrados.keys())
    if faltantes:
        print(f'  FALTANTES: {sorted(faltantes)}')
        return False

    # Crear directorio de salida
    out_dir = os.path.join(BASE_DIR, 'ot', branch)
    os.makedirs(out_dir, exist_ok=True)

    copiados = 0
    for ot in sorted(ots):
        src = encontrados[ot]
        dst = os.path.join(out_dir, f'{ot}.pdf')
        shutil.copy2(src, dst)
        copiados += 1

    print(f'  Copiados: {copiados} PDFs a {out_dir}/')
    return True


def main():
    print('=== ORGANIZAR OT PDFs ===')
    print()

    todo_ok = True
    for branch, info in BRANCHES.items():
        if not organizar(branch, info):
            todo_ok = False

    print()
    if todo_ok:
        print('TODO OK')
    else:
        print('ALGUNOS FALTANTES - revisar arriba')
    print()


if __name__ == '__main__':
    main()

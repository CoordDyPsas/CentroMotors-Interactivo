#!/usr/bin/env python3
"""sync_csv.py - Sincroniza datos desde Google Sheets a los HTML de planos interactivos.

Flujo:
  1. Obtiene CSV desde URL publica de Google Sheets (respaldo: archivo local)
  2. Parsea las 4 sucursales (Colon, Sagrada Familia, Monsenor, HINO)
  3. Por cada index.html, actualiza los campos de cada equipo en EQUIPOS[]
  4. Preserva fotos, piso, x, y; respeta formato original (orden de campos, comas)
"""

import csv
import io
import json
import os
import sys
import urllib.request
from datetime import datetime

# -- Configuracion ----------------------------------------------------------

CSV_URL = (
    "https://docs.google.com/spreadsheets/d/e/"
    "2PACX-1vQmzSSzvInJvvFDV-D_BTi7p5VrhUjfB3ja6uAy8v44epabHqWsOb6SZvnCMCVQCLnrZYFGoIOfKLnt/"
    "pub?gid=359397000&single=true&output=csv"
)
CSV_FALLBACK = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Relevamiento Toyota - Toyota.csv")

BRANCHES = [
    {"key": "colon",          "dir": "colon",          "csv_offset": 0},
    {"key": "sagrada-familia","dir": "sagrada-familia","csv_offset": 8},
    {"key": "monsenor",       "dir": "monsenor",       "csv_offset": 16},
    {"key": "hino",           "dir": "hino",           "csv_offset": 24},
]

CSV_FIELDS = ["ubicacion", "nro_csv", "marca", "capacidad", "ultimo_service", "estado", "ot"]
FIELDS_TO_SYNC = ["ubicacion", "marca", "capacidad", "ultimo_service", "estado", "ot"]

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def obtener_csv():
    """Obtiene contenido CSV desde URL con respaldo local."""
    try:
        import random
        url = CSV_URL + "&_cb=" + str(random.randint(100000, 999999))
        req = urllib.request.Request(url, headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache"
        })
        resp = urllib.request.urlopen(req, timeout=15)
        raw = resp.read()
        content = raw.decode("utf-8-sig")
        print("  Google Sheets: OK")
        return content
    except Exception as e:
        print(f"  Google Sheets: error - {e}")
        if os.path.exists(CSV_FALLBACK):
            print(f"  Usando respaldo local: {CSV_FALLBACK}")
            with open(CSV_FALLBACK, "r", encoding="utf-8-sig") as f:
                return f.read()
        print("  No hay respaldo local disponible")
        sys.exit(1)


def parsear_csv(content):
    """Parsea el CSV y devuelve {branch_key: {nro: {campo: valor, ...}}}"""
    reader = csv.reader(io.StringIO(content))
    rows = list(reader)

    # Find header row (contains "Equipo")
    header_idx = None
    for i, row in enumerate(rows):
        if any("Equipo" in cell for cell in row):
            header_idx = i
            break

    if header_idx is None:
        print("  No se encontro fila de encabezados en el CSV")
        sys.exit(1)

    data_rows = rows[header_idx + 1:]

    result = {}
    for branch in BRANCHES:
        branch_data = {}
        offset = branch["csv_offset"]

        for row in data_rows:
            if len(row) <= offset + 6:
                continue
            vals = [row[offset + i].strip() for i in range(7)]

            nro_raw = vals[1] or vals[0]
            try:
                nro = int(nro_raw)
            except (ValueError, TypeError):
                continue

            estado_raw = vals[5]
            estado_lower = estado_raw.lower()
            if estado_lower == 'ok':
                estado_normalized = 'OK'
            elif estado_lower == 'necesita service':
                estado_normalized = 'Necesita service'
            elif estado_lower == 'no funciona':
                estado_normalized = 'No funciona'
            else:
                estado_normalized = estado_raw

            branch_data[nro] = {
                "ubicacion":      vals[0],
                "marca":          vals[2],
                "capacidad":      vals[3],
                "ultimo_service": vals[4],
                "estado":         estado_normalized,
                "ot":             vals[6],
            }

        result[branch["key"]] = branch_data
        print(f"  {branch['key']}: {len(branch_data)} equipos en CSV")

    return result


def detectar_formato(lines, eq_start, eq_end):
    """Analiza orden de campos y coma final del array EQUIPOS."""
    field_order = []
    trailing_comma = False

    for i in range(eq_start + 1, eq_end):
        line = lines[i].strip()
        if line.startswith("{"):
            try:
                obj = json.loads(line.rstrip(","))
                if not field_order:
                    field_order = list(obj.keys())
            except json.JSONDecodeError:
                pass

    for i in range(eq_end - 1, eq_start, -1):
        line = lines[i].strip()
        if line.startswith("{"):
            trailing_comma = line.endswith(",")
            break

    return field_order, trailing_comma


def actualizar_html(filepath, csv_data):
    """Actualiza los equipos en el HTML con datos del CSV."""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    lines = content.split("\n")

    eq_start = eq_end = None
    for i, line in enumerate(lines):
        if "const EQUIPOS = [" in line:
            eq_start = i
        if eq_start is not None and i > eq_start and line.strip() == "];":
            eq_end = i
            break

    if eq_start is None or eq_end is None:
        print("    no se encontro EQUIPOS[]")
        return

    field_order, trailing_comma = detectar_formato(lines, eq_start, eq_end)
    if not field_order:
        print("    no se pudo determinar formato")
        return

    changes = 0
    for i in range(eq_start + 1, eq_end):
        raw = lines[i]
        stripped = raw.strip()
        if not stripped.startswith("{"):
            continue

        try:
            obj = json.loads(stripped.rstrip(","))
        except json.JSONDecodeError:
            continue

        nro = obj.get("nro")
        if nro is None:
            continue

        csv_entry = csv_data.get(nro)
        if csv_entry is None:
            continue

        modified = []
        for field in FIELDS_TO_SYNC:
            new_val = csv_entry.get(field, "")
            old_val = str(obj.get(field, ""))
            if new_val != old_val:
                obj[field] = new_val
                # Truncate long values for display
                ov = old_val if len(old_val) < 30 else old_val[:27] + "..."
                nv = new_val if len(new_val) < 30 else new_val[:27] + "..."
                modified.append(f"{field}: '{ov}' -> '{nv}'")

        if not modified:
            continue

        ordered = {}
        for key in field_order:
            if key in obj:
                ordered[key] = obj[key]
        for key in obj:
            if key not in ordered:
                ordered[key] = obj[key]

        new_json = json.dumps(ordered, ensure_ascii=False, separators=(",", ":"))

        indent = raw[:len(raw) - len(raw.lstrip())]
        is_last = (i == eq_end - 1)

        if is_last and not trailing_comma:
            lines[i] = indent + new_json
        else:
            lines[i] = indent + new_json + ","

        changes += 1
        print(f"    eq #{nro}: {'; '.join(modified)}")

    if changes:
        new_content = "\n".join(lines)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)

    return changes


def escribir_sync_timestamp(filepath):
    """Escribe la fecha/hora actual en <span id='sync-time'> dentro del HTML."""
    now = datetime.now().strftime("%d/%m/%Y %H:%M")
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    marker = '<span id="sync-time">'
    idx = content.find(marker)
    if idx == -1:
        return False
    start = idx + len(marker)
    end = content.find("</span>", start)
    if end == -1:
        return False
    new_content = content[:start] + now + content[end:]
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(new_content)
    return True


def main():
    import time
    print("sync_csv.py - Sincronizar CSV a HTML")
    print()

    for intento in range(3):
        if intento > 0:
            print(f"  Intento #{intento + 1} en 15s (Google Sheets puede tener cache)...")
            time.sleep(15)

        print("Obteniendo CSV...")
        csv_content = obtener_csv()
        print()

        print("Parseando CSV...")
        csv_data = parsear_csv(csv_content)
        print()

        total = 0
        for branch in BRANCHES:
            html_path = os.path.join(BASE_DIR, branch["dir"], "index.html")
            if not os.path.exists(html_path):
                print(f"  {branch['key']}: no hay index.html, se saltea")
                continue

            print(f"  {branch['key']}...")
            changes = actualizar_html(html_path, csv_data[branch["key"]])
            if changes is None:
                continue
            if changes > 0:
                print(f"    {changes} equipo(s) actualizado(s)")
            total += changes
            escribir_sync_timestamp(html_path)

        root_path = os.path.join(BASE_DIR, "Planos interactivos - Centro Motors.html")
        if os.path.exists(root_path):
            escribir_sync_timestamp(root_path)

        print()
        if total > 0:
            print(f"Total: {total} equipo(s) actualizado(s)")
            ts = datetime.now().strftime("%d/%m/%Y %H:%M")
            print(f"Sincronizacion completada: {ts}")
            return 0

        if intento < 2:
            print("  No se detectaron cambios. Google Sheets puede tener cache de hasta 1 minuto.")
            print("  Reintentando automaticamente...")
        else:
            print("No se detectaron cambios despues de 3 intentos.")
            print("Si realizo cambios en la planilla, espere 1 minuto y vuelva a ejecutar sync.bat")
            ts = datetime.now().strftime("%d/%m/%Y %H:%M")
            print(f"Sincronizacion completada: {ts}")
            return 0

    return 0


if __name__ == "__main__":
    main()

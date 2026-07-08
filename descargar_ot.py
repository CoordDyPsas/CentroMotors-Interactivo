#!/usr/bin/env python3
"""descargar_ot.py - Descarga ordenes de trabajo desde Persat.

Uso:
  python descargar_ot.py
  -> Pide nombre de carpeta y lista de numeros de OT
  -> Descarga cada OT con su nombre original desde Persat
"""

import json
import os
import re
import sys
import urllib.request
import urllib.error

PERSAT_URL = "https://app22.persat.com.ar/dypsas/DigitalFormToPdfServlet?action=get_work_order_in_pdf&wo_id={}"

DESCARGAS = os.path.join(os.path.expanduser("~"), "Downloads")


CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "descargar_ot_config.json")
COOKIE_VALUE = None


def cargar_config():
    global COOKIE_VALUE
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                cfg = json.load(f)
            COOKIE_VALUE = cfg.get("cookie", "")
            if COOKIE_VALUE:
                print(f"Cookie cargada ({len(COOKIE_VALUE)} chars)")
                return True
        except Exception:
            pass
    return False


def guardar_config(valor):
    try:
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump({"cookie": valor}, f)
        print(f"Cookie guardada en {CONFIG_FILE}")
    except Exception as e:
        print(f"Error al guardar cookie: {e}")


def pedir_cookie():
    global COOKIE_VALUE
    if cargar_config():
        return
    print()
    print("Para obtener la Cookie completa:")
    print("  1. Abri DevTools (F12) → pestaña Network")
    print("  2. Hace click en cualquier OT que ya este cargada")
    print("  3. En los Request Headers, busca 'Cookie:'")
    print("  4. Copia todo el valor (suele empezar con JSESSIONID=...)")
    print()
    res = input("¿Pegar Cookie? (s/N): ").strip().lower()
    if res == "s":
        COOKIE_VALUE = input("  Cookie: ").strip()
        guardar_config(COOKIE_VALUE)
        print("  Cookie configurada.")
    else:
        print("  Sin cookie.")


def pedir_carpeta():
    print("=== DESCARGA DE OT ===")
    print()
    pedir_cookie()
    print()
    while True:
        nombre = input("Nombre de la carpeta a crear en Descargas: ").strip()
        if nombre:
            carpeta = os.path.join(DESCARGAS, nombre)
            try:
                os.makedirs(carpeta, exist_ok=True)
                print(f"  Carpeta creada: {carpeta}")
                return carpeta
            except Exception as e:
                print(f"  Error al crear carpeta: {e}")
        else:
            print("  El nombre no puede estar vacio.")


def pedir_numeros():
    print()
    print("Ingrese los numeros de OT a descargar.")
    print("Puede pegar una lista (un numero por linea) o separarlos por coma.")
    print("Deje una linea vacia y presione Enter dos veces para finalizar.")
    print()
    lineas = []
    while True:
        linea = input()
        if not linea:
            if lineas:
                break
            continue
        lineas.append(linea)

    numeros = []
    for linea in lineas:
        for parte in re.split(r"[,;\s]+", linea.strip()):
            parte = parte.strip()
            if parte:
                try:
                    numeros.append(int(parte))
                except ValueError:
                    print(f"  Ignorando '{parte}' (no es un numero)")
    return numeros


def descargar_ot(carpeta, nro):
    url = PERSAT_URL.format(nro)
    req = urllib.request.Request(url)
    req.add_header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
    req.add_header("Referer", "https://app22.persat.com.ar/dypsas/")
    req.add_header("Accept", "application/pdf,image/webp,*/*")
    if COOKIE_VALUE:
        req.add_header("Cookie", COOKIE_VALUE)

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            content = resp.read()
            # Extraer filename del header Content-Disposition
            cd = resp.headers.get("Content-Disposition", "")
            match = re.search(r'filename\s*=\s*["\']?([^"\';\n]+)', cd, re.IGNORECASE)
            if match:
                filename = match.group(1).strip().strip('"').strip("'")
            else:
                # Fallback: usar nro.pdf si no hay filename
                filename = f"{nro}.pdf"

            ruta = os.path.join(carpeta, filename)

            # Si ya existe, agregar sufijo
            if os.path.exists(ruta):
                base, ext = os.path.splitext(filename)
                contador = 1
                while os.path.exists(os.path.join(carpeta, f"{base}_{contador}{ext}")):
                    contador += 1
                ruta = os.path.join(carpeta, f"{base}_{contador}{ext}")

            with open(ruta, "wb") as f:
                f.write(content)

            return True, filename, ruta

    except urllib.error.HTTPError as e:
        body = e.read()[:500].decode("utf-8", errors="replace")
        debug = f"HTTP {e.code} | Headers: {dict(e.headers)} | Body: {body[:200]}"
        return False, None, debug
    except urllib.error.URLError as e:
        return False, None, f"Error de red: {e.reason}"
    except Exception as e:
        return False, None, str(e)


def main():
    if len(sys.argv) > 1 and sys.argv[1] in ("--reset-cookie", "-r"):
        if os.path.exists(CONFIG_FILE):
            os.remove(CONFIG_FILE)
            print("Cookie eliminada.")
        else:
            print("No hay cookie guardada.")
        return

    carpeta = pedir_carpeta()
    numeros = pedir_numeros()

    if not numeros:
        print("No se ingresaron numeros de OT.")
        return

    print()
    print(f"Descargando {len(numeros)} OT(s) a {carpeta}...")
    print()

    exitos = []
    fallos = []

    for i, nro in enumerate(numeros, 1):
        print(f"  [{i}/{len(numeros)}] OT #{nro}...", end=" ", flush=True)
        ok, filename, detalle = descargar_ot(carpeta, nro)
        if ok:
            print(f"OK -> {filename}")
            exitos.append((nro, filename))
        else:
            print(f"FALLO - {detalle}")
            fallos.append(nro)

    print()
    print("=== RESUMEN ===")
    if exitos:
        print(f"Descargados: {len(exitos)}")
        for nro, fname in exitos:
            print(f"  OT #{nro} -> {fname}")
    if fallos:
        print(f"Fallidos: {len(fallos)}")
        for nro in fallos:
            print(f"  OT #{nro}")
    if not fallos and not exitos:
        print("No se proceso ninguna OT.")

    print()
    if fallos:
        print(f"Los siguientes OT no pudieron descargarse: {', '.join(str(n) for n in fallos)}")
    print("Listo.")


if __name__ == "__main__":
    main()

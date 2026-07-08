#!/usr/bin/env python3
"""servidor.py - Servidor local con boton de sincronizacion para los planos interactivos.

Uso:
  python servidor.py
  -> Abre http://localhost:8000

Endpoints:
  /sync  -> ejecuta sync_csv.py y devuelve los EQUIPOS actualizados como JSON
  /*     -> archivos estaticos (index.html, planos, etc.)
"""

import http.server
import json
import mimetypes
import os
import re
import subprocess
import urllib.parse

PORT = 8000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

BRANCH_KEYS = ["monsenor", "colon", "sagrada-familia"]

OT_DIRS = {
    "monsenor": "OT- Toyota (Monseñor)",
    "colon": "OT - Toyota (colon)",
    "sagrada-familia": "OT- Toyota (Monseñor)",
}


def leer_equipos(branch_key):
    """Lee el array EQUIPOS[] del index.html de una sucursal y lo devuelve como lista."""
    path = os.path.join(BASE_DIR, branch_key, "index.html")
    if not os.path.exists(path):
        return None
    with open(path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    eq_start = eq_end = None
    for i, line in enumerate(lines):
        if "const EQUIPOS = [" in line:
            eq_start = i
        if eq_start is not None and i > eq_start and line.strip() == "];":
            eq_end = i
            break

    if eq_start is None or eq_end is None:
        return None

    equipos = []
    for i in range(eq_start + 1, eq_end):
        line = lines[i].strip()
        if line.startswith("{"):
            try:
                equipos.append(json.loads(line.rstrip(",")))
            except json.JSONDecodeError:
                continue
    return equipos


class SyncHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/sync":
            self.handle_sync()
        elif parsed.path.startswith("/ot/"):
            self.handle_ot(parsed.path)
        else:
            if parsed.path in ("", "/"):
                self.path = "/Planos%20interactivos%20-%20Centro%20Motors.html"
            super().do_GET()

    def handle_sync(self):
        try:
            result = subprocess.run(
                ["python", "sync_csv.py"],
                capture_output=True, text=True, timeout=120,
                cwd=BASE_DIR
            )
            output = result.stdout + result.stderr

            # Leer datos actualizados de cada sucursal
            branches = {}
            for key in BRANCH_KEYS:
                equipos = leer_equipos(key)
                if equipos is not None:
                    branches[key] = equipos

            response = {
                "success": result.returncode == 0,
                "output": output,
                "branches": branches,
                "timestamp": __import__("datetime").datetime.now().strftime("%d/%m/%Y %H:%M"),
            }
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode("utf-8"))

        except subprocess.TimeoutExpired:
            self.send_error(504, "Sync timeout")
        except Exception as e:
            self.send_error(500, str(e))

    def handle_ot(self, path):
        # Parse /ot/{branch}/{nro}
        parts = path.strip("/").split("/")
        if len(parts) < 3:
            self.send_error(400, "Formato: /ot/{sucursal}/{nro}")
            return
        branch = parts[1]
        nro = parts[2]

        if branch not in OT_DIRS:
            self.send_error(404, f"Sucursal desconocida: {branch}")
            return

        folder = OT_DIRS[branch]
        ot_dir = os.path.join(BASE_DIR, branch, folder)
        if not os.path.isdir(ot_dir):
            self.send_error(404, "Carpeta OT no encontrada")
            return

        found_path = None

        # Try 1: direct match {nro}.pdf
        direct = os.path.join(ot_dir, f"{nro}.pdf")
        if os.path.isfile(direct):
            found_path = direct

        # Try 2: search by nro in filename (word boundaries to avoid false positives)
        nro_re = re.compile(r'(?<!\d)' + re.escape(str(nro)) + r'(?!\d)')
        if not found_path:
            for f in os.listdir(ot_dir):
                if f.lower().endswith(".pdf") and nro_re.search(f):
                    found_path = os.path.join(ot_dir, f)
                    break

        # Try 3: search recursively in subdirs
        if not found_path:
            for root, _dirs, files in os.walk(ot_dir):
                for f in files:
                    if f.lower().endswith(".pdf") and nro_re.search(f):
                        found_path = os.path.join(root, f)
                        break
                if found_path:
                    break

        if not found_path:
            self.send_error(404, f"OT #{nro} no encontrada en {branch}")
            return

        # Serve the file
        content_type, _ = mimetypes.guess_type(found_path)
        if not content_type:
            content_type = "application/pdf"

        try:
            with open(found_path, "rb") as f:
                data = f.read()
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Disposition", f'inline; filename="{os.path.basename(found_path)}"')
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Accept-Ranges", "bytes")
            self.end_headers()
            self.wfile.write(data)
            # Log OT access
            print(f"[OT] {branch} #{nro} -> {os.path.basename(found_path)}")
        except Exception as e:
            self.send_error(500, str(e))

    def log_message(self, format, *args):
        # Silenciar logs de archivos estaticos, mostrar solo /sync
        msg = format % args
        if "/sync" in msg or "200" not in msg:
            print(f"[{self.log_date_time_string()}] {msg}")


if __name__ == "__main__":
    os.chdir(BASE_DIR)
    print(f"Servidor local iniciado en http://localhost:{PORT}")
    print("Presione Ctrl+C para detener")
    print()
    server = http.server.HTTPServer(("localhost", PORT), SyncHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido.")
        server.server_close()

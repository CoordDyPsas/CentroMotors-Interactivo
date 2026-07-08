@echo off
echo Iniciando servidor local de Planos Interactivos...
echo.

:: Buscar Python en PATH o rutas comunes
python --version >nul 2>&1
if %errorlevel% equ 0 (
    start "" "http://localhost:8000/Planos%20interactivos%20-%20Centro%20Motors.html"
    python servidor.py
    pause
    exit /b
)

for %%p in (
    "C:\Python314\python.exe"
    "C:\Python312\python.exe"
    "C:\Python311\python.exe"
    "C:\Python310\python.exe"
    "C:\Users\%USERNAME%\AppData\Local\Programs\Python\Python314\python.exe"
    "C:\Users\%USERNAME%\AppData\Local\Programs\Python\Python312\python.exe"
    "C:\Users\%USERNAME%\AppData\Local\Programs\Python\Python313\python.exe"
) do (
    if exist %%p (
        start "" "http://localhost:8000/Planos%20interactivos%20-%20Centro%20Motors.html"
        "%%~p" servidor.py
        pause
        exit /b
    )
)

echo No se encontro Python instalado.
echo Instale Python desde https://www.python.org/downloads/
pause

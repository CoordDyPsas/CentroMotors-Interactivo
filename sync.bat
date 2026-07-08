@echo off
cd /d "%~dp0"
echo === Sincronizando datos desde Google Sheets ===
echo.

REM Try to find Python
set PYTHON_CMD=python
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    if exist "C:\Python314\python.exe" (
        set PYTHON_CMD=C:\Python314\python.exe
    ) else if exist "C:\Python312\python.exe" (
        set PYTHON_CMD=C:\Python312\python.exe
    ) else if exist "C:\Python311\python.exe" (
        set PYTHON_CMD=C:\Python311\python.exe
    ) else (
        echo ERROR: No se encontro Python.
        echo.
        echo Instale Python desde https://python.org o verifique que este en el PATH.
        echo.
        pause
        exit /b 1
    )
)

%PYTHON_CMD% sync_csv.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Fallo la sincronizacion.
    pause
    exit /b 1
)

echo.
echo Presione cualquier tecla para cerrar...
pause > nul

@echo off
echo === Deploy a Cloudflare Pages ===
echo.
echo Necesitas:
echo   1. Token de API de Cloudflare (https://dash.cloudflare.com/profile/api-tokens)
echo   2. Node.js instalado
echo.
set /p TOKEN="Token de Cloudflare: "
if "%TOKEN%"=="" echo Token requerido. & exit /b 1
set CLOUDFLARE_API_TOKEN=%TOKEN%
set WRANGLER_CACHE_DIR=%TEMP%\wrangler-cache
npx wrangler@latest pages deploy . --project-name relevamientocm --branch main
if %ERRORLEVEL% NEQ 0 (
  echo.
  echo Fallo el deploy. Asegurate de tener Node.js instalado y token valido.
  exit /b 1
)
echo.
echo Deploy completado!
echo https://relevamientocm.pages.dev/

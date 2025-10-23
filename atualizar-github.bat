@echo off
REM Script para automatizar push para o GitHub e acionar deploy no Render

git add .
git commit -m "Atualização automática"
git push origin main
pause

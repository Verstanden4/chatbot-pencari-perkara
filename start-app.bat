@echo off
title SI PERKARA - Aplikasi Web
echo ============================================
echo  Menjalankan aplikasi web SI PERKARA
echo  Buka: http://localhost:3000
echo ============================================
cd /d "%~dp0"
if not exist ".next" (
  echo Build produksi belum ada, menjalankan npm run build...
  call npm run build
)
call npm run start
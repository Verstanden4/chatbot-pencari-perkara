@echo off
title SI PERKARA - Langflow Server
echo ============================================
echo  Menjalankan Langflow (jangan tutup jendela ini)
echo  URL lokal: http://localhost:7860
echo ============================================
set LANGFLOW_A2A_ENABLED=true
langflow run --host 127.0.0.1 --port 7860
pause
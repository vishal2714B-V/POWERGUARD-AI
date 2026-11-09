@echo off
title PowerGuard AI - Presentation Demo
echo ========================================================
echo       POWERGUARD AI - ONE-CLICK DEMO LAUNCHER
echo ========================================================
echo Starting Python Backend and Vite Frontend...

if exist ".\venv\Scripts\python.exe" (
    .\venv\Scripts\python.exe start_demo.py
) else (
    python start_demo.py
)
pause

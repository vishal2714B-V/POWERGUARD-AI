import os
import sys
import subprocess
import time

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(root_dir)
    print("=" * 60)
    print("           POWERGUARD AI - ONE-COMMAND DEMO RUNNER")
    print("  AI-Powered Smart Energy Management System for Institutions")
    print("=" * 60)
    
    python_exe = os.path.join(root_dir, "venv", "Scripts", "python.exe")
    if not os.path.exists(python_exe):
        python_exe = "python"

    print("\n[1/3] Checking Database and Machine Learning Pipeline...")
    db_path = os.path.join(root_dir, "powerguard.db")
    model_path = os.path.join(root_dir, "ml", "models", "rf_predictor.joblib")
    
    if not os.path.exists(model_path):
        print("-> Training ML models & generating dataset...")
        subprocess.run([python_exe, "-m", "ml.training.train_models"], check=True)

    if not os.path.exists(db_path):
        print("-> Seeding database with baseline campus telemetry...")
        subprocess.run([python_exe, "scripts/seed_db.py"], check=True)

    print("\n[2/3] Starting Backend API & IoT Simulation Engine (Port 8000)...")
    backend_proc = subprocess.Popen(
        [python_exe, "-m", "uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"],
        cwd=root_dir
    )

    time.sleep(2)

    print("\n[3/3] Starting React + Vite Frontend (Port 5173)...")
    frontend_dir = os.path.join(root_dir, "frontend")
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=frontend_dir
    )

    print("\n" + "=" * 60)
    print("   POWERGUARD AI IS LIVE AND READY FOR PRESENTATION!")
    print("=" * 60)
    print(" Web Application URL:   http://localhost:5173")
    print(" Backend REST API:       http://localhost:8000")
    print(" Interactive Docs:       http://localhost:8000/docs")
    print("=" * 60)
    print(" Demo Accounts:")
    print("   Admin:   username='admin', password='admin123'")
    print("   Faculty: username='user',  password='user123' (Room 204)")
    print("=" * 60)
    print("Press Ctrl+C at any time to terminate all services.\n")

    try:
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        print("\nShutting down PowerGuard AI services...")
        backend_proc.terminate()
        frontend_proc.terminate()
        print("Shutdown complete. Thank you!")

if __name__ == "__main__":
    main()

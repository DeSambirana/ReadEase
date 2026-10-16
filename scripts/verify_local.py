"""Gerbang uji versi revisi: UI saat ini, PDF tiga materi dan satu origin."""

import os
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

root = Path(__file__).resolve().parents[1]
subprocess.run([sys.executable, "scripts/verify_accounts.py"], cwd=root, check=True)
temporary = tempfile.TemporaryDirectory()
server = subprocess.Popen(
    [
        sys.executable,
        "-m",
        "uvicorn",
        "app.main:app",
        "--port",
        "8000",
        "--no-access-log",
    ],
    env={**os.environ, "AKSARA_DB": str(Path(temporary.name) / "test.sqlite3")},
    cwd=root / "backend",
    stdout=subprocess.DEVNULL,
)
try:
    for _ in range(100):
        try:
            urllib.request.urlopen("http://127.0.0.1:8000/api/health")
            break
        except OSError:
            time.sleep(0.1)
    for script in ("verify_print.py", "verify_deployment.py"):
        subprocess.run([sys.executable, f"scripts/{script}"], cwd=root, check=True)
finally:
    server.terminate()
    server.wait()
    temporary.cleanup()

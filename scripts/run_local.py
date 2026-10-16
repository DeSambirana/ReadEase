"""Jalankan dari virtualenv: python scripts/run_local.py --setup (sekali)."""

import argparse
import os
import shutil
import socket
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def run(args: list[str], cwd: Path = ROOT) -> None:
    subprocess.run(args, cwd=cwd, check=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--setup",
        action="store_true",
        help="Pasang dependensi dan Chromium, lalu build frontend",
    )
    parser.add_argument(
        "--build",
        action="store_true",
        help="Build dan salin frontend tanpa instal ulang",
    )
    args = parser.parse_args()
    if args.setup and sys.prefix == sys.base_prefix:
        raise SystemExit(
            "Buat virtualenv .venv dan jalankan skrip memakai Python di dalam .venv."
        )
    npm = shutil.which("npm.cmd" if os.name == "nt" else "npm")
    if args.setup:
        if not npm:
            raise SystemExit("npm belum tersedia. Pasang Node.js sesuai README.")
        run(
            [
                sys.executable,
                "-m",
                "pip",
                "install",
                "-r",
                "backend/requirements-dev.txt",
            ]
        )
        run([sys.executable, "-m", "playwright", "install", "chromium"])
        run([npm, "ci"], ROOT / "frontend")
    if args.setup or args.build:
        if not npm:
            raise SystemExit("npm belum tersedia.")
        run([npm, "run", "build"], ROOT / "frontend")
        shutil.copytree(
            ROOT / "frontend/dist", ROOT / "backend/static", dirs_exist_ok=True
        )
    if not (ROOT / "backend/static/index.html").is_file():
        raise SystemExit("Frontend belum dibangun. Jalankan dengan --setup.")
    # Fail early with a useful message; this also checks system libraries.
    run(
        [
            sys.executable,
            "-c",
            "from playwright.sync_api import sync_playwright\nwith sync_playwright() as p:\n b=p.chromium.launch(); b.close()",
        ]
    )
    with socket.socket() as sock:
        if sock.connect_ex(("127.0.0.1", 8000)) == 0:
            raise SystemExit(
                "Port 8000 sedang dipakai. Hentikan proses tersebut sebelum menjalankan aplikasi."
            )
    print("Buka http://127.0.0.1:8000 — hentikan dengan Ctrl+C.", flush=True)
    run(
        [
            sys.executable,
            "-m",
            "uvicorn",
            "app.main:app",
            "--app-dir",
            "backend",
            "--host",
            "127.0.0.1",
            "--port",
            "8000",
            "--no-access-log",
        ]
    )


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nAplikasi dihentikan.")
    except subprocess.CalledProcessError:
        raise SystemExit(
            "Langkah gagal. Periksa pesan di atas. Untuk Chromium, gunakan Python virtualenv yang sama dan jalankan: python -m playwright install chromium. Pada Linux mungkin perlu: python -m playwright install --with-deps chromium."
        ) from None

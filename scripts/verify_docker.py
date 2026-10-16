"""Build dan jalankan container sementara; gagal jelas bila Docker tidak tersedia."""

import shutil
import subprocess
import sys
import time
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    if not shutil.which("docker"):
        raise SystemExit(
            "BELUM TERVERIFIKASI: Docker tidak tersedia. Jalankan skrip ini pada mesin dengan Docker Engine aktif."
        )
    subprocess.run(["docker", "info"], check=True, stdout=subprocess.DEVNULL)
    subprocess.run(
        ["docker", "build", "-t", "aksarainklusi:verify", "."], cwd=ROOT, check=True
    )
    container = subprocess.check_output(
        [
            "docker",
            "run",
            "--rm",
            "-d",
            "--init",
            "--shm-size=256m",
            "-p",
            "127.0.0.1::8000",
            "aksarainklusi:verify",
        ],
        text=True,
    ).strip()
    try:
        user = subprocess.check_output(
            ["docker", "inspect", "--format", "{{.Config.User}}", container], text=True
        ).strip()
        assert user not in {"", "root", "0"}, "Container harus berjalan non-root"
        port = (
            subprocess.check_output(
                ["docker", "port", container, "8000/tcp"], text=True
            )
            .strip()
            .split(":")[-1]
        )
        url = "http://127.0.0.1:" + port
        with httpx.Client(trust_env=False) as client:
            for _ in range(100):
                try:
                    if client.get(url + "/api/health").status_code == 200:
                        break
                except httpx.HTTPError:
                    pass
                time.sleep(0.1)
            else:
                raise RuntimeError("Container tidak siap dalam 10 detik.")
        subprocess.run(
            [sys.executable, "scripts/verify_deployment.py", "--url", url],
            cwd=ROOT,
            check=True,
        )
        print("PASS Docker build, runtime non-root, satu URL dan tiga PDF.")
    finally:
        subprocess.run(
            ["docker", "stop", container], check=True, stdout=subprocess.DEVNULL
        )


if __name__ == "__main__":
    main()

"""Akun dan ruang belajar lokal. Tidak mencatat isi materi atau kredensial."""

import hashlib
import hmac
import json
import os
import secrets
import sqlite3
import time
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, Field

from .models import Model, PdfRequest
from .pdf import validate_print

router = APIRouter(prefix="/api")
COOKIE = "aksara_session"


@contextmanager
def db() -> Iterator[sqlite3.Connection]:
    path = Path(
        os.environ.get("AKSARA_DB", str(Path(__file__).parents[1] / "data/accounts.sqlite3"))
    )
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.executescript("""
    CREATE TABLE IF NOT EXISTS teachers(id TEXT PRIMARY KEY,email TEXT UNIQUE,password TEXT,name TEXT);
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,role TEXT,owner TEXT,expires REAL);
    CREATE TABLE IF NOT EXISTS stores(owner TEXT PRIMARY KEY,revision INTEGER,body TEXT);
    CREATE TABLE IF NOT EXISTS pupils(id TEXT,owner TEXT,name TEXT,preferences TEXT,code TEXT UNIQUE,
      PRIMARY KEY(id,owner));
    CREATE TABLE IF NOT EXISTS lessons(id TEXT PRIMARY KEY,owner TEXT,pupil TEXT,body TEXT,
      created REAL,progress TEXT);
    CREATE TABLE IF NOT EXISTS attempts(key TEXT PRIMARY KEY,count INTEGER,until REAL);
    """)
    try:
        with conn:
            yield conn
    finally:
        conn.close()


def digest(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


from urllib.parse import urlparse

def guard_origin(request: Request) -> None:
    origin = request.headers.get("origin")
    is_local = False
    if origin:
        origin_clean = origin.rstrip("/")
        base_clean = str(request.base_url).rstrip("/")
        if origin_clean != base_clean:
            parsed_origin = urlparse(origin)
            server_host = request.url.hostname or "127.0.0.1"
            is_local = (
                parsed_origin.hostname in {"localhost", "127.0.0.1", "::1"}
                and server_host in {"localhost", "127.0.0.1", "::1", "0.0.0.0", "testserver"}
            )
            if not is_local:
                raise HTTPException(403, "Asal permintaan tidak diizinkan.")
        else:
            is_local = True
    if request.headers.get("sec-fetch-site") == "cross-site" and not is_local:
        raise HTTPException(403, "Permintaan lintas situs ditolak.")



def identity(request: Request) -> dict:
    with db() as conn:
        row = conn.execute(
            "SELECT * FROM sessions WHERE token=? AND expires>?",
            (digest(request.cookies.get(COOKIE, "")), time.time()),
        ).fetchone()
    if not row:
        raise HTTPException(401, "Sesi berakhir. Silakan masuk kembali.")
    if request.method != "GET":
        guard_origin(request)
    return dict(row)


def require_teacher(request: Request) -> dict:
    user = identity(request)
    if user["role"] != "teacher":
        raise HTTPException(403, "Halaman ini khusus guru.")
    return user


def require_student(request: Request) -> dict:
    user = identity(request)
    if user["role"] != "student":
        raise HTTPException(403, "Halaman ini khusus murid.")
    return user


def throttle(request: Request, label: str) -> None:
    guard_origin(request)
    key = digest(f"{request.client.host if request.client else 'local'}:{label}")
    now = time.time()
    with db() as conn:
        conn.execute("DELETE FROM attempts WHERE until<?", (now,))
        row = conn.execute("SELECT count FROM attempts WHERE key=?", (key,)).fetchone()
        if row and row[0] >= 20:
            raise HTTPException(429, "Terlalu banyak percobaan. Tunggu 15 menit.")
        conn.execute(
            "INSERT INTO attempts VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1",
            (key, now + 900),
        )


def password_hash(password: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 600_000).hex()


def new_session(response: Response, request: Request, role: str, owner: str) -> None:
    token = secrets.token_urlsafe(32)
    with db() as conn:
        conn.execute(
            "DELETE FROM sessions WHERE expires<? OR token=?",
            (time.time(), digest(request.cookies.get(COOKIE, ""))),
        )
        conn.execute(
            "INSERT INTO sessions VALUES(?,?,?,?)",
            (digest(token), role, owner, time.time() + 28800),
        )
    response.set_cookie(
        COOKIE,
        token,
        httponly=True,
        samesite="strict",
        secure=request.url.scheme == "https",
        max_age=28800,
        path="/",
    )
    response.headers["Cache-Control"] = "no-store"


class Credentials(Model):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=12, max_length=128)
    name: str = Field(default="Guru", min_length=1, max_length=100)


@router.post("/auth/register")
def register(data: Credentials, request: Request, response: Response) -> dict:
    throttle(request, "auth")
    email = data.email.strip().lower()
    if "@" not in email or not data.name.strip():
        raise HTTPException(422, "Periksa nama dan alamat email.")
    uid, salt = secrets.token_hex(16), secrets.token_hex(16)
    encoded = salt + ":" + password_hash(data.password, salt)
    try:
        with db() as conn:
            conn.execute(
                "INSERT INTO teachers VALUES(?,?,?,?)", (uid, email, encoded, data.name.strip())
            )
    except sqlite3.IntegrityError as exc:
        raise HTTPException(
            409, "Akun tidak dapat dibuat. Coba masuk jika sudah terdaftar."
        ) from exc
    new_session(response, request, "teacher", uid)
    return {"role": "teacher", "id": uid, "name": data.name.strip(), "email": email}


@router.post("/auth/login")
def login(data: Credentials, request: Request, response: Response) -> dict:
    throttle(request, "auth")
    with db() as conn:
        row = conn.execute(
            "SELECT * FROM teachers WHERE email=?", (data.email.strip().lower(),)
        ).fetchone()
    salt, expected = row["password"].split(":") if row else ("dummy", "0" * 64)
    if not hmac.compare_digest(password_hash(data.password, salt), expected) or not row:
        raise HTTPException(401, "Email atau kata sandi tidak cocok.")
    new_session(response, request, "teacher", row["id"])
    return {"role": "teacher", "id": row["id"], "name": row["name"], "email": row["email"]}


class CodeEntry(Model):
    code: str = Field(min_length=1, max_length=40)


@router.post("/auth/student")
def student_login(data: CodeEntry, request: Request, response: Response) -> dict:
    throttle(request, "code")
    code = data.code.upper().replace("-", "").replace(" ", "")
    with db() as conn:
        row = conn.execute("SELECT * FROM pupils WHERE code=?", (digest(code),)).fetchone()
    if not row:
        raise HTTPException(401, "Kode tidak cocok atau telah diganti. Minta kode kepada guru.")
    new_session(response, request, "student", row["owner"] + ":" + row["id"])
    return {"role": "student", "name": row["name"], "id": row["id"]}


@router.get("/auth/me")
def me(user: Annotated[dict, Depends(identity)]) -> dict:
    with db() as conn:
        if user["role"] == "teacher":
            row = conn.execute(
                "SELECT id,name,email FROM teachers WHERE id=?", (user["owner"],)
            ).fetchone()
        else:
            owner, pupil = user["owner"].split(":", 1)
            row = conn.execute(
                "SELECT id,name FROM pupils WHERE owner=? AND id=?", (owner, pupil)
            ).fetchone()
    if not row:
        raise HTTPException(401, "Akses tidak tersedia.")
    return {"role": user["role"], **dict(row)}


@router.post("/auth/logout")
def logout(request: Request, response: Response) -> dict:
    guard_origin(request)
    with db() as conn:
        conn.execute(
            "DELETE FROM sessions WHERE token=?", (digest(request.cookies.get(COOKIE, "")),)
        )
    response.delete_cookie(COOKIE, path="/")
    return {"ok": True}


class PublicPreferences(Model):
    readingMode: str = Field(pattern="^(focus|comfortable)$")
    sentenceThreshold: int = Field(default=20, ge=1, le=200)
    fontSize: str = Field(pattern="^(normal|large|xlarge)$")
    bionicReading: bool = False
    fontFamily: str = Field(pattern="^(standard|dyslexic)$")
    cardPacingMinutes: float | None = None


class PupilSnapshot(BaseModel):
    id: str = Field(min_length=1, max_length=100, pattern="^[^:]+$")
    name: str = Field(min_length=1, max_length=100)
    nickname: str = Field(default="", max_length=100)
    preferences: PublicPreferences


class StoreWrite(Model):
    revision: int = Field(ge=0)
    body: str = Field(max_length=800_000)


@router.get("/teacher/store")
def get_store(user: Annotated[dict, Depends(require_teacher)]) -> dict:
    with db() as conn:
        row = conn.execute(
            "SELECT revision,body FROM stores WHERE owner=?", (user["owner"],)
        ).fetchone()
    return dict(row) if row else {"revision": 0, "body": None}


@router.put("/teacher/store")
def put_store(data: StoreWrite, user: Annotated[dict, Depends(require_teacher)]) -> dict:
    try:
        body = json.loads(data.body)
        pupils = body["students"]
        snapshots = [PupilSnapshot.model_validate(s) for s in pupils]
        ids = [s.id for s in snapshots]
        if len(ids) > 500:
            raise ValueError()
        if not isinstance(pupils, list) or len(ids) != len(set(ids)) or any(":" in x for x in ids):
            raise ValueError()
    except (ValueError, KeyError, TypeError) as exc:
        raise HTTPException(422, "Data profil tidak valid.") from exc
    with db() as conn:
        conn.execute("BEGIN IMMEDIATE")
        row = conn.execute("SELECT revision FROM stores WHERE owner=?", (user["owner"],)).fetchone()
        if (row[0] if row else 0) != data.revision:
            raise HTTPException(
                409, "Data berubah di tab lain. Salin perubahan Anda lalu muat ulang."
            )
        conn.execute(
            "INSERT INTO stores VALUES(?,?,?) ON CONFLICT(owner) DO UPDATE SET revision=excluded.revision,body=excluded.body",
            (user["owner"], data.revision + 1, data.body),
        )
        for pupil in snapshots:
            conn.execute(
                "UPDATE pupils SET name=?,preferences=? WHERE owner=? AND id=?",
                (
                    pupil.nickname or pupil.name,
                    pupil.preferences.model_dump_json(),
                    user["owner"],
                    pupil.id,
                ),
            )
        existing = conn.execute("SELECT id FROM pupils WHERE owner=?", (user["owner"],)).fetchall()
        for item in existing:
            if item[0] not in ids:
                conn.execute("DELETE FROM pupils WHERE owner=? AND id=?", (user["owner"], item[0]))
                conn.execute(
                    "DELETE FROM lessons WHERE owner=? AND pupil=?", (user["owner"], item[0])
                )
                conn.execute(
                    "DELETE FROM sessions WHERE role='student' AND owner=?",
                    (user["owner"] + ":" + item[0],),
                )
    return {"revision": data.revision + 1}


@router.post("/teacher/students/{student_id}/code")
def issue_code(student_id: str, user: Annotated[dict, Depends(require_teacher)]) -> dict:
    with db() as conn:
        row = conn.execute("SELECT body FROM stores WHERE owner=?", (user["owner"],)).fetchone()
        pupil = (
            next((s for s in json.loads(row[0])["students"] if s["id"] == student_id), None)
            if row
            else None
        )
        if not pupil:
            raise HTTPException(404, "Murid tidak ditemukan.")
        code = "".join(secrets.choice("ABCDEFGHJKLMNPQRSTUVWXYZ23456789") for _ in range(12))
        conn.execute(
            "INSERT INTO pupils VALUES(?,?,?,?,?) ON CONFLICT(id,owner) DO UPDATE SET name=excluded.name,preferences=excluded.preferences,code=excluded.code",
            (
                student_id,
                user["owner"],
                pupil["nickname"] or pupil["name"],
                json.dumps(pupil["preferences"]),
                digest(code),
            ),
        )
        conn.execute(
            "DELETE FROM sessions WHERE role='student' AND owner=?",
            (user["owner"] + ":" + student_id,),
        )
    return {"code": "-".join(code[i : i + 4] for i in range(0, 12, 4))}


class Assignment(Model):
    student_id: str = Field(min_length=1, max_length=100)
    workspace: PdfRequest
    reviewed: bool


@router.post("/teacher/assignments")
def assign(data: Assignment, user: Annotated[dict, Depends(require_teacher)]) -> dict:
    if not data.reviewed:
        raise HTTPException(422, "Guru harus meninjau materi sebelum membagikannya.")
    try:
        validate_print(data.workspace)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    with db() as conn:
        row = conn.execute(
            "SELECT * FROM pupils WHERE owner=? AND id=?", (user["owner"], data.student_id)
        ).fetchone()
        if not row:
            raise HTTPException(404, "Buat kode akses murid terlebih dahulu.")
        uid = secrets.token_hex(16)
        body = data.workspace.model_dump(
            mode="json", exclude={"teacher_notes", "student_name", "student_class"}
        )
        body["preferences"] = json.loads(row["preferences"])
        conn.execute(
            "INSERT INTO lessons VALUES(?,?,?,?,?,?)",
            (
                uid,
                user["owner"],
                data.student_id,
                json.dumps(body),
                time.time(),
                json.dumps({"completed": [], "submitted": False}),
            ),
        )
    return {"id": uid}


@router.get("/teacher/assignments")
def teacher_lessons(user: Annotated[dict, Depends(require_teacher)]) -> list[dict]:
    with db() as conn:
        rows = conn.execute(
            "SELECT * FROM lessons WHERE owner=? ORDER BY created DESC", (user["owner"],)
        ).fetchall()
    return [
        {
            "id": r["id"],
            "student_id": r["pupil"],
            "title": json.loads(r["body"])["document"]["title"],
            "card_count": len(json.loads(r["body"])["cards"]),
            "created": r["created"],
            "progress": json.loads(r["progress"]),
        }
        for r in rows
    ]


@router.get("/student/assignments")
def student_lessons(user: Annotated[dict, Depends(require_student)]) -> list[dict]:
    owner, pupil = user["owner"].split(":", 1)
    with db() as conn:
        rows = conn.execute(
            "SELECT * FROM lessons WHERE owner=? AND pupil=? ORDER BY created DESC", (owner, pupil)
        ).fetchall()
    output = []
    for row in rows:
        body = json.loads(row["body"])
        # Whitelist: no answer keys, pedagogical notes, other profiles, or teacher identity.
        output.append(
            {
                "id": row["id"],
                "title": body["document"]["title"],
                "cards": body["cards"],
                "sources": body["document"]["sentences"],
                "preferences": body["preferences"],
                "exercises": [
                    {"id": e["id"], "blank_text": e["blank_text"]} for e in body["exercises"]
                ],
                "progress": json.loads(row["progress"]),
            }
        )
    return output


class Progress(Model):
    completed: list[str] = Field(max_length=1500)
    answers: dict[str, str] | None = None


@router.put("/student/assignments/{lesson_id}/progress")
def progress(
    lesson_id: str, data: Progress, user: Annotated[dict, Depends(require_student)]
) -> dict:
    owner, pupil = user["owner"].split(":", 1)
    with db() as conn:
        conn.execute("BEGIN IMMEDIATE")
        row = conn.execute(
            "SELECT * FROM lessons WHERE id=? AND owner=? AND pupil=?", (lesson_id, owner, pupil)
        ).fetchone()
        if not row:
            raise HTTPException(404, "Materi tidak ditemukan.")
        body, state = json.loads(row["body"]), json.loads(row["progress"])
        allowed = {c["id"] for c in body["cards"]}
        if not set(data.completed) <= allowed:
            raise HTTPException(422, "Kartu tidak cocok dengan materi.")
        if state["submitted"] and set(data.completed) != set(state["completed"]):
            raise HTTPException(409, "Hasil sudah dikirim. Progres akhir tidak diubah.")
        state["completed"] = list(dict.fromkeys(data.completed))
        if data.answers is not None:
            if state["submitted"]:
                raise HTTPException(409, "Jawaban sudah dikirim. Tanyakan hasilnya kepada guru.")
            exercises = body["exercises"]
            if set(data.answers) != {e["id"] for e in exercises} or any(
                not a.strip() or len(a) > 200 for a in data.answers.values()
            ):
                raise HTTPException(422, "Isi semua jawaban terlebih dahulu.")
            if set(data.completed) != allowed:
                raise HTTPException(422, "Tandai semua kartu yang sudah dibaca terlebih dahulu.")
            state.update(
                submitted=True,
                answered=len(exercises),
                correct=sum(data.answers[e["id"]].strip() == e["answer"] for e in exercises),
                answers=data.answers,
            )
        conn.execute("UPDATE lessons SET progress=? WHERE id=?", (json.dumps(state), lesson_id))
    return state

import json
import sqlite3

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def clients(tmp_path, monkeypatch):
    monkeypatch.setenv("AKSARA_DB", str(tmp_path / "test.sqlite3"))
    with TestClient(app) as teacher, TestClient(app) as other, TestClient(app) as student:
        yield teacher, other, student


def register(client, email="guru@example.test"):
    response = client.post(
        "/api/auth/register",
        json={"email": email, "name": "Guru Uji", "password": "uji-password-panjang"},
    )
    assert response.status_code == 200
    assert "HttpOnly" in response.headers["set-cookie"]
    return response.json()


def prepare(teacher, student):
    register(teacher)
    profile = {
        "id": "p1",
        "name": "Nara",
        "nickname": "Nara",
        "preferences": {
            "readingMode": "focus",
            "fontSize": "large",
            "fontFamily": "standard",
            "bionicReading": False,
        },
        "pedagogicalNotes": "RAHASIA GURU",
    }
    assert (
        teacher.put(
            "/api/teacher/store",
            json={
                "revision": 0,
                "body": json.dumps({"students": [profile], "logs": [], "notes": []}),
            },
        ).status_code
        == 200
    )
    response = teacher.post("/api/teacher/students/p1/code")
    assert response.status_code == 200
    code = response.json()["code"]
    assert student.post("/api/auth/student", json={"code": code}).status_code == 200
    result = teacher.post(
        "/api/analyze",
        json={"text": "Daun menghasilkan makanan. Akar menyerap air.", "title": "Tumbuhan"},
    ).json()
    workspace = {k: result[k] for k in ["document", "cards", "exercises"]}
    lesson = teacher.post(
        "/api/teacher/assignments",
        json={"student_id": "p1", "workspace": workspace, "reviewed": True},
    )
    assert lesson.status_code == 200, lesson.text
    return code, lesson.json()["id"], workspace


def test_auth_real_password_cookie_logout(clients, monkeypatch):
    teacher, other, _ = clients
    register(teacher)
    assert (
        other.post(
            "/api/auth/login",
            json={"email": "guru@example.test", "password": "salah-password-panjang"},
        ).status_code
        == 401
    )
    assert (
        other.post(
            "/api/auth/login",
            json={"email": "guru@example.test", "password": "uji-password-panjang"},
        ).status_code
        == 200
    )
    assert teacher.post("/api/auth/logout").status_code == 200
    assert teacher.get("/api/teacher/store").status_code == 401
    import os

    with sqlite3.connect(os.environ["AKSARA_DB"]) as db:
        assert (
            "uji-password-panjang" not in db.execute("SELECT password FROM teachers").fetchone()[0]
        )


def test_roles_ownership_and_no_keys(clients):
    teacher, other, student = clients
    _, uid, _ = prepare(teacher, student)
    register(other, "lain@example.test")
    assert other.get("/api/teacher/store").json()["body"] is None
    assert other.post("/api/teacher/students/p1/code").status_code == 404
    assert student.get("/api/teacher/store").status_code == 403
    assert student.post("/api/analyze", json={"text": "Teks asli."}).status_code == 403
    assert student.post("/api/pdf", json={}).status_code == 403
    assert (
        other.put(f"/api/student/assignments/{uid}/progress", json={"completed": []}).status_code
        == 403
    )
    lessons = student.get("/api/student/assignments")
    assert lessons.status_code == 200
    assert (
        "RAHASIA" not in lessons.text
        and "teacher_notes" not in lessons.text
        and '"answer":' not in lessons.text
    )


def test_code_rotation_invalidates_old_code_and_session(clients):
    teacher, other, student = clients
    code, _, _ = prepare(teacher, student)
    newcode = teacher.post("/api/teacher/students/p1/code").json()["code"]
    assert student.get("/api/student/assignments").status_code == 401
    assert other.post("/api/auth/student", json={"code": code}).status_code == 401
    assert other.post("/api/auth/student", json={"code": newcode}).status_code == 200


def test_progress_and_submission_persist_without_repeat(clients):
    teacher, _, student = clients
    _, uid, workspace = prepare(teacher, student)
    cards = [c["id"] for c in workspace["cards"]]
    url = f"/api/student/assignments/{uid}/progress"
    assert student.put(url, json={"completed": ["invalid"]}).status_code == 422
    assert student.put(url, json={"completed": [], "answers": {}}).status_code == 422
    assert student.put(url, json={"completed": cards, "answers": {}}).status_code == 200
    assert student.put(url, json={"completed": cards, "answers": {}}).status_code == 409
    log = teacher.get("/api/teacher/assignments").json()[0]
    assert log["progress"]["submitted"] is True
    assert log["progress"]["answered"] == 0


def test_cross_student_forbidden(clients):
    teacher, other, student = clients
    _, uid, _ = prepare(teacher, student)
    state = json.loads(teacher.get("/api/teacher/store").json()["body"])
    state["students"].append({**state["students"][0], "id": "p2", "name": "Bima"})
    teacher.put("/api/teacher/store", json={"revision": 1, "body": json.dumps(state)})
    code = teacher.post("/api/teacher/students/p2/code").json()["code"]
    other.post("/api/auth/student", json={"code": code})
    assert other.get("/api/student/assignments").json() == []
    assert (
        other.put(f"/api/student/assignments/{uid}/progress", json={"completed": []}).status_code
        == 404
    )


def test_origin_revision_review_and_delete(clients):
    teacher, _, student = clients
    _, _, workspace = prepare(teacher, student)
    assert (
        teacher.post(
            "/api/teacher/students/p1/code", headers={"origin": "https://evil.example"}
        ).status_code
        == 403
    )
    assert (
        teacher.post(
            "/api/teacher/assignments",
            json={"student_id": "p1", "workspace": workspace, "reviewed": False},
        ).status_code
        == 422
    )
    assert (
        teacher.put(
            "/api/teacher/store", json={"revision": 0, "body": '{"students":[]}'}
        ).status_code
        == 409
    )
    assert (
        teacher.put(
            "/api/teacher/store", json={"revision": 1, "body": '{"students":[]}'}
        ).status_code
        == 200
    )
    assert student.get("/api/student/assignments").status_code == 401
    assert teacher.get("/api/teacher/assignments").json() == []


def test_anonymous_and_rate_limit(clients):
    teacher, _, _ = clients
    assert teacher.get("/api/health").status_code == 200
    assert teacher.get("/api/teacher/store").status_code == 401
    assert teacher.post("/api/analyze", json={"text": "Teks."}).status_code == 401
    for _ in range(20):
        assert teacher.post("/api/auth/student", json={"code": "SALAH"}).status_code == 401
    assert teacher.post("/api/auth/student", json={"code": "SALAH"}).status_code == 429


def test_reviewed_exercises_exact_scoring_and_no_preanswer_leak(clients):
    teacher, _, student = clients
    _, _, workspace = prepare(teacher, student)
    candidates = teacher.post("/api/worksheet", json={"document": workspace["document"]}).json()[
        "candidates"
    ]
    candidate = candidates[0]
    selection = {k: candidate[k] for k in ["source_sentence_id", "keyword", "start"]}
    exercise = teacher.post(
        "/api/worksheet", json={"document": workspace["document"], "selections": [selection]}
    ).json()["exercises"][0]
    workspace["exercises"] = [exercise]
    payload = {"student_id": "p1", "workspace": workspace, "reviewed": True}
    assert teacher.post("/api/teacher/assignments", json=payload).status_code == 422
    exercise["reviewed"] = True
    response = teacher.post("/api/teacher/assignments", json=payload)
    assert response.status_code == 200
    uid = response.json()["id"]
    lessons = student.get("/api/student/assignments").json()
    lesson = next(x for x in lessons if x["id"] == uid)
    assert set(lesson["exercises"][0]) == {"id", "blank_text"}
    result = student.put(
        f"/api/student/assignments/{uid}/progress",
        json={
            "completed": [c["id"] for c in workspace["cards"]],
            "answers": {exercise["id"]: exercise["answer"]},
        },
    )
    assert result.status_code == 200
    assert result.json()["correct"] == 1
    assert (
        student.put(f"/api/student/assignments/{uid}/progress", json={"completed": []}).status_code
        == 409
    )


def test_store_validation_and_preference_refresh(clients):
    teacher, _, student = clients
    _, _, workspace = prepare(teacher, student)
    assert (
        teacher.put(
            "/api/teacher/store", json={"revision": 1, "body": '{"students":[{"id":"bad"}]}'}
        ).status_code
        == 422
    )
    store = json.loads(teacher.get("/api/teacher/store").json()["body"])
    store["students"][0]["preferences"]["readingMode"] = "comfortable"
    assert (
        teacher.put(
            "/api/teacher/store", json={"revision": 1, "body": json.dumps(store)}
        ).status_code
        == 200
    )
    response = teacher.post(
        "/api/teacher/assignments",
        json={"student_id": "p1", "workspace": workspace, "reviewed": True},
    )
    assert response.status_code == 200
    lessons = student.get("/api/student/assignments").json()
    assert lessons[0]["preferences"]["readingMode"] == "comfortable"


def test_login_csrf_and_expired_session(clients):
    teacher, _, _ = clients
    assert (
        teacher.post(
            "/api/auth/register",
            headers={"origin": "https://foreign.example"},
            json={"email": "guru@example.test", "password": "kata-sandi-uji-panjang"},
        ).status_code
        == 403
    )
    register(teacher)
    import os

    with sqlite3.connect(os.environ["AKSARA_DB"]) as db:
        db.execute("UPDATE sessions SET expires=0")
    assert teacher.get("/api/auth/me").status_code == 401

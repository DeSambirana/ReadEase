import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.risk import changed_risks
from app.rules import glossary_swap, list_to_bullets, split_independent_clauses

client = TestClient(app)


@pytest.mark.parametrize(
    "rule,text,expected",
    [
        (glossary_swap, "Akar memperoleh air.", "Akar mendapatkan air."),
        (glossary_swap, "Akar tidak memperoleh air.", None),
        (glossary_swap, "Akar mengambil air.", None),
        (
            list_to_bullets,
            "Bagian tanaman meliputi akar, batang, dan daun.",
            "Bagian tanaman meliputi:\n• akar\n• batang\n• daun",
        ),
        (list_to_bullets, "Bagian tanaman meliputi akar yang kuat, batang, dan daun.", None),
        (list_to_bullets, "Benda meliputi buku, pergi ke pasar, dan pensil.", None),
        (
            split_independent_clauses,
            "Daun menyerap cahaya dan akar menyerap air.",
            "Daun menyerap cahaya dan akar menyerap air.",
        ),
        (split_independent_clauses, "Jika daun basah dan akar tidak kering.", None),
        (split_independent_clauses, "Daun dan akar.", None),
        (split_independent_clauses, "Ada 3 daun dan ada 2 akar.", None),
    ],
)
def test_rules_accept_reject(rule, text, expected):
    assert rule.propose(text, []) == expected


def test_protected_glossary():
    assert glossary_swap.propose("Akar memperoleh air.", ["memperoleh"]) is None


@pytest.mark.parametrize(
    "source,target,terms,category",
    [
        ("Daun tidak basah.", "Daun basah.", [], "negasi"),
        ("Jika daun basah.", "Daun basah.", [], "syarat"),
        ("Daun basah karena hujan.", "Daun basah.", [], "sebab-akibat"),
        ("Ada 25% air.", "Ada 20% air.", [], "angka"),
        ("Panjang 3 cm.", "Panjang 3 m.", [], "satuan"),
        ("Akar menyerap air.", "Akar menyerap udara.", ["air"], "istilah penting"),
        ("Rani membaca buku.", "Budi membaca buku.", [], "istilah penting"),
        ("Air tidak tidak tersedia.", "Air tidak tersedia.", [], "negasi"),
    ],
)
def test_risk_categories(source, target, terms, category):
    assert category in changed_risks(source, target, terms)


def analyze(text, terms=None):
    response = client.post("/api/analyze", json={"text": text, "important_terms": terms or []})
    assert response.status_code == 200
    return response.json()


def recompute(data, decisions, terms=None):
    return client.post(
        "/api/recompute",
        json={
            **{k: data[k] for k in ["document", "cards", "exercises"]},
            "decisions": decisions,
            "important_terms": terms or [],
        },
    )


def test_pending_accept_edit_reject_and_metrics():
    data = analyze("Akar memperoleh air.")
    p = data["proposals"][0]
    assert p["review_status"] == "pending"
    assert data["cards"][0]["adapted_text"] == "Akar memperoleh air."
    for status, target in [
        ("accepted", "Akar mendapatkan air."),
        ("edited", "Akar mendapatkan air bersih."),
        ("rejected", "Akar memperoleh air."),
    ]:
        response = recompute(
            data,
            [
                {
                    "proposal_id": p["id"],
                    "status": status,
                    "edited_text": "Akar mendapatkan air bersih." if status == "edited" else None,
                }
            ],
        )
        assert response.status_code == 200
        result = response.json()
        assert result["cards"][0]["adapted_text"] == target
        assert result["document"]["sentences"] == data["document"]["sentences"]
        assert result["summary"][status] == 1
        assert result["document"]["metrics_after"]["avg_words_per_sentence"] == len(target.split())


def test_manual_gate_and_split_mapping():
    data = analyze("Daun menyerap cahaya dan akar menyerap air.")
    p = data["proposals"][0]
    assert p["manual_only"]
    assert recompute(data, [{"proposal_id": p["id"], "status": "accepted"}]).status_code == 422
    response = recompute(
        data,
        [
            {
                "proposal_id": p["id"],
                "status": "edited",
                "edited_text": "Daun menyerap cahaya. Akar menyerap air.",
            }
        ],
    ).json()
    assert response["document"]["metrics_after"]["avg_words_per_sentence"] == 3
    assert all(c["source_sentence_ids"] == ["s1"] for c in response["cards"])
    assert response["cards"][0]["rule_id"] == "split_independent_clauses"


def test_risky_examples_stay_intact():
    for source in [
        "Jika tumbuhan tidak memperoleh cahaya, pertumbuhannya dapat terganggu.",
        "Akar tidak menyerap air dan daun tidak tumbuh.",
    ]:
        data = analyze(source)
        assert data["proposals"] == []
        assert data["cards"][0]["adapted_text"] == source
        assert "Kalimat ini perlu ditinjau guru." in data["cards"][0]["warnings"]


def test_edit_injects_negation_blocked():
    data = analyze("Akar memperoleh air.")
    result = recompute(
        data,
        [
            {
                "proposal_id": data["proposals"][0]["id"],
                "status": "edited",
                "edited_text": "Akar tidak mendapatkan air.",
            }
        ],
    ).json()
    assert result["cards"][0]["adapted_text"] == "Akar memperoleh air."
    assert result["proposals"][0]["review_status"] == "pending"
    assert any("diblokir" in w for w in result["proposals"][0]["warnings"])


def test_tampered_accepted_text_and_unknown_id():
    data = analyze("Akar memperoleh air.")
    data["cards"][0]["adapted_text"] = "Teks palsu."
    response = recompute(
        data, [{"proposal_id": data["proposals"][0]["id"], "status": "accepted"}]
    ).json()
    assert response["cards"][0]["adapted_text"] == "Akar mendapatkan air."
    assert recompute(data, [{"proposal_id": "tidak-ada", "status": "accepted"}]).status_code == 422


def test_terms_on_cards_and_recompute():
    data = analyze("Akar memperoleh air.", ["air"])
    assert data["cards"][0]["flagged_terms"] == ["air"]
    result = recompute(data, [], ["memperoleh"]).json()
    assert result["proposals"] == []
    assert result["cards"][0]["flagged_terms"] == ["memperoleh"]


def test_duplicate_decision_and_duplicate_source_rejected():
    data = analyze("Akar memperoleh air.")
    decision = {"proposal_id": data["proposals"][0]["id"], "status": "accepted"}
    assert recompute(data, [decision, decision]).status_code == 422
    data["document"]["sentences"].append(data["document"]["sentences"][0])
    assert recompute(data, []).status_code == 422


def test_list_accept_and_terms_in_pdf_html():
    from print_helpers import printable

    from app.models import PdfRequest
    from app.pdf import render_html

    data = analyze("Bagian tanaman meliputi akar, batang, dan daun.", ["akar"])
    response = recompute(
        data, [{"proposal_id": data["proposals"][0]["id"], "status": "accepted"}], ["akar"]
    ).json()
    assert (
        response["cards"][0]["adapted_text"] == "Bagian tanaman meliputi:\n• akar\n• batang\n• daun"
    )
    assert response["cards"][0]["flagged_terms"] == ["akar"]
    html = render_html(PdfRequest(**printable(response)))
    assert "Istilah untuk dibahas: akar" in html


def test_unchanged_edit_summary_and_all_reject_trace():
    data = analyze("Akar memperoleh air. Warna daun beraneka ragam.")
    decisions = [{"proposal_id": p["id"], "status": "rejected"} for p in data["proposals"]]
    result = recompute(data, decisions).json()
    assert result["summary"]["unchanged_sentences"] == 2
    assert result["summary"]["rejected"] == 2
    for card in result["cards"]:
        assert {"source_sentence_ids", "rule_id", "review_status", "warnings"} <= card.keys()
        assert all(sid in ["s1", "s2"] for sid in card["source_sentence_ids"])
    unchanged = recompute(
        data,
        [
            {
                "proposal_id": data["proposals"][0]["id"],
                "status": "edited",
                "edited_text": "Akar memperoleh air.",
            }
        ],
    ).json()
    assert unchanged["summary"]["unchanged_sentences"] == 2

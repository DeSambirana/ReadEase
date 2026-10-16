import pytest

from app.accounts import require_teacher
from app.main import app


@pytest.fixture(autouse=True)
def contract_auth(request):
    # Unit/contract tests isolate the processing layer; account tests exercise real sessions.
    if request.module.__name__.endswith("test_accounts"):
        yield
        return
    app.dependency_overrides[require_teacher] = lambda: {
        "role": "teacher",
        "owner": "contract-test",
    }
    yield
    app.dependency_overrides.pop(require_teacher, None)

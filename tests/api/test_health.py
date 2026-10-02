from fastapi.testclient import TestClient

from api.app.main import app

client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_sources_reports_youtube_and_trends() -> None:
    response = client.get("/sources")
    assert response.status_code == 200
    names = {s["name"] for s in response.json()["sources"]}
    assert names == {"youtube", "google_trends"}

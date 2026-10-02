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
    sources = {s["name"]: s["status"] for s in response.json()["sources"]}
    assert sources["youtube"] in {"live", "mock"}
    assert sources["google_trends"] == "live"
    assert sources["hacker_news"] == "live"
    assert sources["wikimedia_pageviews"] in {"live", "degraded"}
    assert all(sources[name] == "csv" for name in ("instagram", "tiktok", "pinterest"))

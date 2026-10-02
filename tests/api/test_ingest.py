from fastapi.testclient import TestClient

import api.app.routes.ingest as ingest_routes
from api.app.main import app
from ingest.connectors.base import StatusReport

client = TestClient(app)


def test_csv_import_validates_and_persists_original_and_normalized_rows(monkeypatch) -> None:
    writes: list[tuple] = []
    monkeypatch.setattr(ingest_routes, "write_raw_csv", lambda *args: writes.append(("raw", *args)))
    monkeypatch.setattr(ingest_routes, "append_content_items", lambda *args, **kwargs: writes.append(("content", args, kwargs)))
    csv_text = (
        "post_id,caption,date,views,likes,comments,niche\n"
        "post-1,Street dance,2025-03-01T12:00:00Z,1200,88,7,dance\n"
    )

    response = client.post("/import/instagram", json={"csvText": csv_text, "niche": "dance"})

    assert response.status_code == 200
    assert response.json()["status"] == "csv"
    assert response.json()["recordsImported"] == 1
    assert writes[0][0] == "raw"
    assert writes[1][0] == "content"
    assert writes[1][2]["ingestion_mode"] == "csv_import"
    assert writes[1][2]["raw_source"] == "instagram"


def test_csv_import_rejects_missing_metrics_without_persisting(monkeypatch) -> None:
    monkeypatch.setattr(
        ingest_routes,
        "append_content_items",
        lambda *args, **kwargs: (_ for _ in ()).throw(AssertionError("must not persist invalid CSV")),
    )

    response = client.post(
        "/import/tiktok",
        json={"csvText": "id,title,published_at,views,likes\n1,Clip,2025-03-01T12:00:00Z,10,2\n"},
    )

    assert response.status_code == 422
    assert "comments" in response.json()["detail"]


def test_hacker_news_ingest_persists_timestamped_events(monkeypatch) -> None:
    observations = [{
        "source": "hacker_news",
        "event_type": "comment",
        "id": "comment-1",
        "story_id": "story-1",
        "parent_id": "story-1",
        "created_at_i": 1735689660,
    }]
    monkeypatch.setattr(
        ingest_routes,
        "HackerNewsConnector",
        lambda: type("Connector", (), {"search": lambda self, *args: (observations, StatusReport("hacker_news", "live"))})(),
    )
    stored: list[tuple] = []
    monkeypatch.setattr(ingest_routes, "append_external_observations", lambda *args: stored.append(args))

    response = client.post("/ingest/hacker_news", json={"query": "dance cascade", "niche": "dance"})

    assert response.status_code == 200
    assert response.json()["records_ingested"] == 1
    assert stored[0][1:3] == ("hacker_news", "dance cascade")
    assert stored[0][0][0]["parent_id"] == "story-1"


def test_wikimedia_ingest_reports_missing_contact_email(monkeypatch) -> None:
    monkeypatch.setattr(
        ingest_routes,
        "WikimediaPageviewsConnector",
        lambda: type("Connector", (), {"fetch_pageviews": lambda self, *args: ([], StatusReport("wikimedia_pageviews", "degraded", "WIKIMEDIA_CONTACT_EMAIL not set"))})(),
    )

    response = client.post(
        "/ingest/wikimedia",
        json={"article": "Dance", "start": "2025010100", "end": "2025020100", "niche": "dance"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "degraded"
    assert response.json()["records_ingested"] == 0


def test_youtube_ingest_returns_backfill_count(monkeypatch) -> None:
    monkeypatch.setattr(ingest_routes, "backfill", lambda *args: 7)

    response = client.post(
        "/ingest/youtube",
        json={"niche": "dance", "sinceYear": 2020, "untilYear": 2020, "maxResults": 2},
    )

    assert response.status_code == 200
    assert response.json()["recordsIngested"] == 7
    assert response.json()["itemsPersistedTotal"] == 7
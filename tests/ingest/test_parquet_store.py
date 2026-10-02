from pathlib import Path

import pandas as pd

from ingest.storage import parquet_store


def _item(views: int) -> dict:
    return {
        "id": "video-1",
        "platform": "youtube",
        "type": "video",
        "title": "Dance clip",
        "published_at": "2025-01-01T00:00:00Z",
        "thumbnail_url": "https://example.com/thumb.jpg",
        "metrics": {"views": views, "likes": 10, "comments": 2, "shares": None},
    }


def test_content_store_preserves_observations_and_retries_idempotently(
    tmp_path: Path, monkeypatch
) -> None:
    processed_dir = tmp_path / "processed"
    raw_dir = tmp_path / "raw"
    monkeypatch.setattr(parquet_store, "_PROCESSED_DIR", processed_dir)
    monkeypatch.setattr(parquet_store, "_RAW_DIR", raw_dir, raising=False)
    monkeypatch.setattr(parquet_store, "_CONTENT_ITEMS_PATH", processed_dir / "content_items.parquet")

    parquet_store.append_content_items([_item(100)], "dance", "street dance", ingestion_id="snapshot-1")
    parquet_store.append_content_items([_item(150)], "dance", "street dance", ingestion_id="snapshot-2")
    parquet_store.append_content_items([_item(150)], "dance", "street dance", ingestion_id="snapshot-2")

    observations = pd.read_parquet(processed_dir / "content_items.parquet")
    assert observations.sort_values("views")["views"].tolist() == [100, 150]
    assert set(observations["ingestion_id"]) == {"snapshot-1", "snapshot-2"}
    assert len(list((raw_dir / "youtube").glob("snapshot-*.jsonl"))) == 2


def test_external_observations_and_historical_priors_are_append_only_and_idempotent(
    tmp_path: Path, monkeypatch
) -> None:
    raw_dir = tmp_path / "raw"
    processed_dir = tmp_path / "processed"
    monkeypatch.setattr(parquet_store, "_RAW_DIR", raw_dir)
    monkeypatch.setattr(parquet_store, "_PROCESSED_DIR", processed_dir)
    monkeypatch.setattr(parquet_store, "_EXTERNAL_OBSERVATIONS_PATH", processed_dir / "external.parquet")
    monkeypatch.setattr(parquet_store, "_HISTORICAL_PRIORS_PATH", processed_dir / "priors.parquet")
    events = [{"id": "story-1", "event_type": "story", "created_at_i": 100}]
    prior = [{
        "niche": "dance",
        "era_year": 2022,
        "query": "street dance",
        "metric_name": "views",
        "metric_value": 12000,
        "unit": "views",
        "report_label": "2022 annual report",
    }]

    parquet_store.append_external_observations(events, "hacker_news", "dance", "hn-1", "dance")
    parquet_store.append_external_observations(events, "hacker_news", "dance", "hn-1", "dance")
    parquet_store.append_external_observations(events, "hacker_news", "dance", "hn-2", "dance")
    parquet_store.append_historical_priors(prior, "report-1")
    parquet_store.append_historical_priors(prior, "report-1")

    external = pd.read_parquet(processed_dir / "external.parquet")
    priors = pd.read_parquet(processed_dir / "priors.parquet")
    assert len(external) == 2
    assert set(external["ingestion_id"]) == {"hn-1", "hn-2"}
    assert len(priors) == 1
    assert priors.iloc[0]["report_label"] == "2022 annual report"
    assert (raw_dir / "hacker_news" / "hn-1.jsonl").exists()
    assert (raw_dir / "trend_reports" / "report-1.jsonl").exists()
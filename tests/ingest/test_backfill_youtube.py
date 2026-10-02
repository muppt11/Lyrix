import ingest.backfill_youtube as backfill_module
from ingest.backfill_youtube import backfill
from ingest.connectors.base import StatusReport


class _Connector:
    api_key = "test-key"

    def discover_window(self, query, published_after, published_before, max_results):
        return [{"id": query, "platform": "youtube", "metrics": {"views": 1}}], StatusReport("youtube", "live")


def test_backfill_uses_stable_ingestion_ids_on_retries(monkeypatch) -> None:
    ingestion_ids: list[str] = []
    monkeypatch.setattr(backfill_module, "YouTubeConnector", _Connector)
    monkeypatch.setattr(backfill_module, "time", type("NoSleep", (), {"sleep": staticmethod(lambda _: None)}))
    monkeypatch.setattr(
        backfill_module,
        "append_content_items",
        lambda items, niche, query, **kwargs: ingestion_ids.append(kwargs["ingestion_id"]),
    )

    backfill(["dance"], 2020, 2020, max_results=1)
    first_run_ids = ingestion_ids.copy()
    ingestion_ids.clear()
    backfill(["dance"], 2020, 2020, max_results=1)

    assert len(first_run_ids) == 3
    assert ingestion_ids == first_run_ids
from datetime import datetime, timedelta, timezone

from ingest.connectors.youtube import YouTubeConnector


class _FakeResponse:
    def __init__(self, payload: dict) -> None:
        self._payload = payload

    def raise_for_status(self) -> None:
        pass

    def json(self) -> dict:
        return self._payload


class _FakeClient:
    """Stands in for httpx.Client, routing by URL so no network call is made."""

    def __init__(self, search_payload: dict, videos_payload: dict) -> None:
        self.search_payload = search_payload
        self.videos_payload = videos_payload
        self.calls: list[str] = []

    def get(self, url: str, params: dict) -> _FakeResponse:
        self.calls.append(url)
        if "search" in url:
            return _FakeResponse(self.search_payload)
        return _FakeResponse(self.videos_payload)


def _iso(days_ago: float) -> str:
    return (datetime.now(timezone.utc) - timedelta(days=days_ago)).strftime("%Y-%m-%dT%H:%M:%SZ")


def test_discover_reports_mock_status_when_no_api_key() -> None:
    connector = YouTubeConnector(api_key=None)
    items, status = connector.discover("unused-query-no-key")
    assert items == []
    assert status.status == "mock"


def test_discover_parses_and_ranks_by_view_velocity() -> None:
    search_payload = {
        "items": [
            {"id": {"videoId": "old_viral"}},
            {"id": {"videoId": "new_spike"}},
        ]
    }
    videos_payload = {
        "items": [
            {
                "id": "old_viral",
                "snippet": {
                    "title": "Old but huge",
                    "publishedAt": _iso(100),
                    "channelTitle": "Channel A",
                    "thumbnails": {"medium": {"url": "http://example.com/a.jpg"}},
                },
                "statistics": {"viewCount": "1000000", "likeCount": "50000", "commentCount": "100"},
            },
            {
                "id": "new_spike",
                "snippet": {
                    "title": "New and spiking",
                    "publishedAt": _iso(1),
                    "channelTitle": "Channel B",
                    "thumbnails": {"medium": {"url": "http://example.com/b.jpg"}},
                },
                "statistics": {"viewCount": "50000", "likeCount": "2000", "commentCount": "10"},
            },
        ]
    }
    fake_client = _FakeClient(search_payload, videos_payload)
    connector = YouTubeConnector(api_key="test-key", client=fake_client)  # type: ignore[arg-type]

    items, status = connector.discover("distinct-velocity-ranking-query")

    assert status.status == "live"
    assert len(items) == 2
    # old_viral: 1,000,000 views / 100 days = 10,000/day
    # new_spike: 50,000 views / 1 day = 50,000/day -> should rank first
    assert items[0]["id"] == "new_spike"
    assert items[1]["id"] == "old_viral"
    assert items[0]["metrics"]["shares"] is None  # never invented


def test_discover_returns_empty_when_search_has_no_results() -> None:
    fake_client = _FakeClient({"items": []}, {"items": []})
    connector = YouTubeConnector(api_key="test-key", client=fake_client)  # type: ignore[arg-type]

    items, status = connector.discover("distinct-no-results-query")

    assert items == []
    assert status.status == "live"

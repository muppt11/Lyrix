from ingest.connectors.hacker_news import HackerNewsConnector
from ingest.connectors.wikimedia import WikimediaPageviewsConnector


class _Response:
    def __init__(self, payload: dict) -> None:
        self.payload = payload

    def raise_for_status(self) -> None:
        pass

    def json(self) -> dict:
        return self.payload


class _Client:
    def __init__(self, responses: list[dict]) -> None:
        self.responses = iter(responses)
        self.calls: list[tuple[str, dict]] = []

    def get(self, url: str, **kwargs) -> _Response:
        self.calls.append((url, kwargs))
        return _Response(next(self.responses))


def test_wikimedia_requires_contact_email_before_request() -> None:
    client = _Client([])
    connector = WikimediaPageviewsConnector(client=client)  # type: ignore[arg-type]

    records, status = connector.fetch_pageviews("Dance", "2025010100", "2025020100")

    assert records == []
    assert status.status == "degraded"
    assert not client.calls


def test_wikimedia_sends_contact_user_agent_and_normalizes_pageviews() -> None:
    client = _Client([{"items": [{"timestamp": "2025010100", "views": 17}]}])
    connector = WikimediaPageviewsConnector("data@example.org", client=client)  # type: ignore[arg-type]

    records, status = connector.fetch_pageviews("Dance", "2025010100", "2025020100")

    assert status.status == "live"
    assert records[0]["views"] == 17
    assert "mailto:data@example.org" in client.calls[0][1]["headers"]["User-Agent"]


def test_hacker_news_keeps_timestamped_story_and_comment_parentage() -> None:
    client = _Client([
        {"hits": [{"objectID": "story-1", "title": "Dance", "created_at": "2025-01-01T00:00:00Z", "created_at_i": 1735689600, "points": 8, "num_comments": 2}]},
        {"hits": [{"objectID": "comment-1", "story_id": "story-1", "parent_id": "story-1", "comment_text": "Nice", "created_at": "2025-01-01T00:01:00Z", "created_at_i": 1735689660}]},
    ])
    connector = HackerNewsConnector(client=client)  # type: ignore[arg-type]

    records, status = connector.search("dance", max_results=10, since_timestamp=1)

    assert status.status == "live"
    assert [record["event_type"] for record in records] == ["story", "comment"]
    assert records[1]["parent_id"] == "story-1"
    assert all(call[1]["params"]["numericFilters"] == "created_at_i>=1" for call in client.calls)
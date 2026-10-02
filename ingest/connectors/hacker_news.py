"""Public Hacker News Search API connector for timestamped stories/comments."""

from __future__ import annotations

import time

import httpx

from .base import StatusReport

_SEARCH_URL = "https://hn.algolia.com/api/v1/search_by_date"
_CACHE_TTL_SECONDS = 5 * 60


class HackerNewsConnector:
    name = "hacker_news"

    def __init__(self, client: httpx.Client | None = None) -> None:
        self._client = client or httpx.Client(timeout=15.0)
        self._cache: dict[str, tuple[float, list[dict]]] = {}

    def search(self, query: str, max_results: int = 50, since_timestamp: int | None = None) -> tuple[list[dict], StatusReport]:
        limit = min(max(int(max_results), 1), 100)
        cache_key = f"{query}:{limit}:{since_timestamp}"
        cached = self._cache.get(cache_key)
        if cached and time.time() - cached[0] < _CACHE_TTL_SECONDS:
            return cached[1], StatusReport(self.name, "live", "cached")

        observations: list[dict] = []
        for event_tag in ("story", "comment"):
            params: dict[str, str | int] = {"query": query, "tags": event_tag, "hitsPerPage": limit}
            if since_timestamp is not None:
                params["numericFilters"] = f"created_at_i>={int(since_timestamp)}"
            try:
                response = self._client.get(_SEARCH_URL, params=params)
                response.raise_for_status()
                hits = response.json().get("hits", [])
            except (httpx.HTTPError, ValueError, KeyError) as exc:
                return [], StatusReport(self.name, "degraded", str(exc))

            observations.extend(
                {
                    "source": self.name,
                    "event_type": event_tag,
                    "id": str(hit.get("objectID", "")),
                    "story_id": str(hit.get("story_id") or hit.get("objectID", "")),
                    "parent_id": str(hit["parent_id"]) if hit.get("parent_id") is not None else None,
                    "title": hit.get("title") or hit.get("story_title"),
                    "text": hit.get("story_text") or hit.get("comment_text"),
                    "created_at": hit.get("created_at"),
                    "created_at_i": hit.get("created_at_i"),
                    "score": hit.get("points"),
                    "comment_count": hit.get("num_comments"),
                    "url": hit.get("url"),
                    "query": query,
                }
                for hit in hits
                if hit.get("objectID") is not None
            )

        observations.sort(key=lambda item: item.get("created_at_i") or 0)
        self._cache[cache_key] = (time.time(), observations)
        return observations, StatusReport(self.name, "live")
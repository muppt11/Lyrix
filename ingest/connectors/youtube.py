"""Real YouTube Data API v3 connector.

Keyword discovery only (no fixed channel) — given a niche keyword, finds
videos and ranks them. Two modes share the same fetch/cache/quota machinery:
  - `discover`: recent videos, ranked by view velocity (views/day since
    publish) — "what's trending now".
  - `discover_window`: videos published in a fixed historical window, ranked
    by raw views — "what was popular in that era" (used for backfill).

Quota-aware: `search.list` costs 100 units, `videos.list` costs ~1 unit per
call regardless of id count. The free daily quota is 10,000 units. A
process-local budget and short-TTL cache keep repeated searches cheap.
"""

from __future__ import annotations

import os
import time
from datetime import datetime, timedelta, timezone

import httpx

from .base import StatusReport

_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"
_VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos"

_SEARCH_COST = 100
_VIDEOS_COST = 1
_DAILY_BUDGET = int(os.environ.get("YOUTUBE_QUOTA_DAILY_BUDGET", "9000"))
_CACHE_TTL_SECONDS = 15 * 60

# Process-local quota + response cache. Reset at UTC midnight.
_quota_used = 0
_quota_day = datetime.now(timezone.utc).date()
_cache: dict[str, tuple[float, list[dict], StatusReport]] = {}


def _reset_quota_if_new_day() -> None:
    global _quota_used, _quota_day
    today = datetime.now(timezone.utc).date()
    if today != _quota_day:
        _quota_used = 0
        _quota_day = today


def _spend(units: int) -> bool:
    """Returns False if spending would exceed the daily budget."""
    global _quota_used
    _reset_quota_if_new_day()
    if _quota_used + units > _DAILY_BUDGET:
        return False
    _quota_used += units
    return True


_UNSET = object()


class YouTubeConnector:
    name = "youtube"

    def __init__(self, api_key: str | None = _UNSET, client: httpx.Client | None = None) -> None:  # type: ignore[assignment]
        # A sentinel default (rather than None) so an explicit api_key=None
        # means "no key" instead of silently falling back to the env var.
        self.api_key = os.environ.get("YOUTUBE_API_KEY") if api_key is _UNSET else api_key
        self._client = client or httpx.Client(timeout=10.0)

    def discover(self, query: str, max_results: int = 12, lookback_days: int = 30) -> tuple[list[dict], StatusReport]:
        published_after = datetime.now(timezone.utc) - timedelta(days=lookback_days)
        items, report = self._search_and_enrich(
            cache_key=f"recent:{query}:{max_results}:{lookback_days}",
            query=query,
            published_after=published_after,
            published_before=None,
            max_results=max_results,
        )
        for item in items:
            item["metrics"]["view_velocity"] = self._view_velocity(item)
        items.sort(key=lambda it: it["metrics"]["view_velocity"], reverse=True)
        return items, report

    def discover_window(
        self,
        query: str,
        published_after: datetime,
        published_before: datetime,
        max_results: int = 50,
    ) -> tuple[list[dict], StatusReport]:
        """Historical backfill: videos published within a fixed [after, before)
        window, ranked by raw view count (velocity ranking doesn't make sense
        for an already-closed window — old content has had years to
        accumulate views, there's no "trending now" to measure)."""
        items, report = self._search_and_enrich(
            cache_key=f"window:{query}:{published_after.isoformat()}:{published_before.isoformat()}:{max_results}",
            query=query,
            published_after=published_after,
            published_before=published_before,
            max_results=max_results,
        )
        items.sort(key=lambda it: it["metrics"]["views"], reverse=True)
        return items, report

    def _search_and_enrich(
        self,
        cache_key: str,
        query: str,
        published_after: datetime,
        published_before: datetime | None,
        max_results: int,
    ) -> tuple[list[dict], StatusReport]:
        cached = _cache.get(cache_key)
        if cached and (time.time() - cached[0]) < _CACHE_TTL_SECONDS:
            items, status = cached[1], cached[2]
            return items, StatusReport(self.name, status.status, (status.detail or "") + " (cached)")

        if not self.api_key:
            return [], StatusReport(self.name, "mock", "YOUTUBE_API_KEY not set")

        if not _spend(_SEARCH_COST):
            if cached:
                return cached[1], StatusReport(self.name, "degraded", "daily quota budget exhausted, serving stale cache")
            return [], StatusReport(self.name, "degraded", "daily quota budget exhausted, no cache available")

        search_params: dict[str, str | int] = {
            "part": "snippet",
            "type": "video",
            "q": query,
            "order": "viewCount",
            "publishedAfter": published_after.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "maxResults": max_results,
            "key": self.api_key,
        }
        if published_before is not None:
            search_params["publishedBefore"] = published_before.strftime("%Y-%m-%dT%H:%M:%SZ")

        try:
            search_resp = self._client.get(_SEARCH_URL, params=search_params)
            search_resp.raise_for_status()
            search_items = search_resp.json().get("items", [])
            video_ids = [it["id"]["videoId"] for it in search_items if it.get("id", {}).get("videoId")]

            if not video_ids:
                report = StatusReport(self.name, "live", "no results")
                _cache[cache_key] = (time.time(), [], report)
                return [], report

            if not _spend(_VIDEOS_COST):
                return [], StatusReport(self.name, "degraded", "quota exhausted before stats lookup")

            videos_resp = self._client.get(
                _VIDEOS_URL,
                params={
                    "part": "snippet,statistics",
                    "id": ",".join(video_ids),
                    "key": self.api_key,
                },
            )
            videos_resp.raise_for_status()
            video_items = videos_resp.json().get("items", [])
        except httpx.HTTPError as exc:
            if cached:
                return cached[1], StatusReport(self.name, "degraded", f"{exc}; serving stale cache")
            return [], StatusReport(self.name, "degraded", str(exc))

        items = [self._to_content_item(v) for v in video_items]
        report = StatusReport(self.name, "live")
        _cache[cache_key] = (time.time(), items, report)
        return items, report

    @staticmethod
    def _view_velocity(item: dict) -> float:
        """Views per day since publish — what makes "trending" differ from
        just "popular" (an old viral video shouldn't outrank a fresh spike)."""
        published_at = datetime.fromisoformat(item["published_at"].replace("Z", "+00:00"))
        age_days = max((datetime.now(timezone.utc) - published_at).total_seconds() / 86400, 1.0)
        return item["metrics"]["views"] / age_days

    @staticmethod
    def _to_content_item(video: dict) -> dict:
        snippet = video.get("snippet", {})
        stats = video.get("statistics", {})
        return {
            "id": video["id"],
            "platform": "youtube",
            "type": "video",
            "title": snippet.get("title", ""),
            "published_at": snippet.get("publishedAt"),
            "thumbnail_url": (snippet.get("thumbnails", {}).get("medium") or {}).get("url"),
            "channel_title": snippet.get("channelTitle"),
            "url": f"https://www.youtube.com/watch?v={video['id']}",
            "metrics": {
                "views": int(stats.get("viewCount", 0)),
                "likes": int(stats.get("likeCount", 0)) if "likeCount" in stats else 0,
                "comments": int(stats.get("commentCount", 0)) if "commentCount" in stats else 0,
                "shares": None,
                "revenue_cents": None,
            },
        }

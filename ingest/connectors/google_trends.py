"""Google Trends connector via pytrends (unofficial, unauthenticated, rate-limited).

No API key required. Degrades gracefully: on failure (Google frequently
429s pytrends under bursty traffic) we serve a stale cache if we have one,
and otherwise report `degraded` with an empty signal rather than fabricating
a trend line.
"""

from __future__ import annotations

import time

from pytrends.request import TrendReq

from .base import StatusReport

_CACHE_TTL_SECONDS = 60 * 60  # Trends data moves slowly; cache for an hour.
_cache: dict[str, tuple[float, list[dict], StatusReport]] = {}


class GoogleTrendsConnector:
    name = "google_trends"

    def __init__(self, client: TrendReq | None = None) -> None:
        self._client = client

    def _get_client(self) -> TrendReq:
        if self._client is None:
            self._client = TrendReq(hl="en-US", tz=0)
        return self._client

    def interest_over_time(self, query: str, timeframe: str = "today 3-m") -> tuple[list[dict], StatusReport]:
        cache_key = f"{query}:{timeframe}"
        cached = _cache.get(cache_key)
        if cached and (time.time() - cached[0]) < _CACHE_TTL_SECONDS:
            return cached[1], cached[2]

        try:
            client = self._get_client()
            client.build_payload([query], timeframe=timeframe)
            df = client.interest_over_time()
        except Exception as exc:  # noqa: BLE001 - pytrends is unofficial and raises
            # assorted, undocumented exception types (requests, urllib, JSON
            # decode errors); a narrower catch risks an uncaught crash here.
            if cached:
                return cached[1], StatusReport(self.name, "degraded", f"{exc}; serving stale cache")
            return [], StatusReport(self.name, "degraded", str(exc))

        if df is None or df.empty or query not in df.columns:
            report = StatusReport(self.name, "live", "no trend data for query")
            _cache[cache_key] = (time.time(), [], report)
            return [], report

        points = [
            {"date": idx.strftime("%Y-%m-%d"), "interest": int(row[query])}
            for idx, row in df.iterrows()
        ]
        report = StatusReport(self.name, "live")
        _cache[cache_key] = (time.time(), points, report)
        return points, report

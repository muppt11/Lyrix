"""Wikimedia pageviews API connector with an identified User-Agent."""

from __future__ import annotations

import os
import time
from urllib.parse import quote

import httpx

from .base import StatusReport

_BASE_URL = "https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article"
_CACHE_TTL_SECONDS = 60 * 60


class WikimediaPageviewsConnector:
    name = "wikimedia_pageviews"

    def __init__(self, contact_email: str | None = None, client: httpx.Client | None = None) -> None:
        self.contact_email = contact_email or os.environ.get("WIKIMEDIA_CONTACT_EMAIL")
        self._client = client or httpx.Client(timeout=15.0)
        self._cache: dict[str, tuple[float, list[dict]]] = {}

    def fetch_pageviews(
        self,
        article: str,
        start: str,
        end: str,
        project: str = "en.wikipedia",
        access: str = "all-access",
        agent: str = "user",
        granularity: str = "daily",
    ) -> tuple[list[dict], StatusReport]:
        if not self.contact_email:
            return [], StatusReport(self.name, "degraded", "WIKIMEDIA_CONTACT_EMAIL not set")
        if start >= end:
            return [], StatusReport(self.name, "degraded", "start must precede end")

        cache_key = f"{project}:{article}:{access}:{agent}:{granularity}:{start}:{end}"
        cached = self._cache.get(cache_key)
        if cached and time.time() - cached[0] < _CACHE_TTL_SECONDS:
            return cached[1], StatusReport(self.name, "live", "cached")

        path = "/".join(
            quote(value.replace(" ", "_"), safe="")
            for value in (project, access, agent, article, granularity, start, end)
        )
        try:
            response = self._client.get(
                f"{_BASE_URL}/{path}",
                headers={"User-Agent": f"Lyrix/1.0 (mailto:{self.contact_email})"},
            )
            response.raise_for_status()
            records = response.json().get("items", [])
        except (httpx.HTTPError, ValueError, KeyError) as exc:
            return [], StatusReport(self.name, "degraded", str(exc))

        observations = [
            {
                "source": self.name,
                "article": article,
                "project": project,
                "granularity": granularity,
                "timestamp": record["timestamp"],
                "views": int(record["views"]),
            }
            for record in records
            if "timestamp" in record and "views" in record
        ]
        self._cache[cache_key] = (time.time(), observations)
        return observations, StatusReport(self.name, "live")
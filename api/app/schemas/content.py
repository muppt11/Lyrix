"""Pydantic contracts for discovered content.

Mirrors `frontend/src/types/creator-platform.ts` (`ContentItem`) field-for-field
so the frontend can deserialize API responses without translation, plus a
`source` field the mock types don't need.
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

CreatorPlatformId = Literal[
    "instagram", "youtube", "tiktok", "facebook", "x", "pinterest", "onlyfans", "patreon"
]

Niche = Literal["dance", "fashion"]

SourceStatus = Literal["live", "degraded", "csv", "mock"]


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class ContentMetrics(CamelModel):
    views: int
    likes: int
    comments: int
    # YouTube's public API does not expose share counts; left unset rather
    # than invented (see "never invent metrics" project principle).
    shares: int | None = None
    revenue_cents: int | None = None
    # Views/day since publish — the actual ranking key for live discovery.
    # Null for historical backfill, where "velocity" isn't a meaningful idea.
    view_velocity: float | None = None


class ContentItem(CamelModel):
    id: str
    platform: CreatorPlatformId
    type: Literal["photo", "video", "short", "reel", "post", "story", "audio", "text"]
    title: str
    published_at: datetime
    thumbnail_url: str | None = None
    channel_title: str | None = None
    url: str | None = None
    metrics: ContentMetrics


class TrendPoint(CamelModel):
    date: str
    interest: int  # Google Trends relative interest, 0-100


class DiscoverResult(CamelModel):
    query: str
    niche: Niche | None = None
    platform: CreatorPlatformId
    source: SourceStatus
    fetched_at: datetime
    items: list[ContentItem]
    trend_signal: list[TrendPoint] | None = None
    trend_source: SourceStatus | None = None
    baseline_note: str = (
        "Ranked by real view/engagement velocity since publish. This is a "
        "baseline heuristic, not the digital-twin model's recommendation "
        "— the twin forecaster has not been built yet."
    )

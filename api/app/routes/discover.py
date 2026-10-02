from datetime import datetime, timezone

from fastapi import APIRouter, Query

from ingest.connectors.google_trends import GoogleTrendsConnector
from ingest.connectors.youtube import YouTubeConnector
from ingest.storage.parquet_store import append_content_items

from ..schemas.content import ContentItem, DiscoverResult, Niche, TrendPoint

router = APIRouter()

_youtube = YouTubeConnector()
_trends = GoogleTrendsConnector()


@router.get("/discover", response_model=DiscoverResult)
def discover(
    query: str = Query(..., min_length=2, max_length=100),
    niche: Niche | None = None,
    max_results: int = Query(12, ge=1, le=50),
) -> DiscoverResult:
    raw_items, status = _youtube.discover(query, max_results=max_results)
    if raw_items:
        append_content_items(raw_items, niche, query)

    trend_points, trend_status = _trends.interest_over_time(query)

    return DiscoverResult(
        query=query,
        niche=niche,
        platform="youtube",
        source=status.status,
        fetched_at=datetime.now(timezone.utc),
        items=[ContentItem(**it) for it in raw_items],
        trend_signal=[TrendPoint(**p) for p in trend_points] or None,
        trend_source=trend_status.status,
    )

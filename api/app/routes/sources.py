import os

from fastapi import APIRouter

from ingest.connectors.youtube import YouTubeConnector

from ..schemas.sources import SourcesResponse, SourceStatusEntry

router = APIRouter()


@router.get("/sources", response_model=SourcesResponse)
def sources() -> SourcesResponse:
    """Lightweight status without spending API quota: reports whether each
    connector is configured, not a live probe call."""
    youtube = YouTubeConnector()
    wikimedia_configured = bool(os.environ.get("WIKIMEDIA_CONTACT_EMAIL"))
    entries = [
        SourceStatusEntry(
            name="youtube",
            status="live" if youtube.api_key else "mock",
            detail=None if youtube.api_key else "YOUTUBE_API_KEY not set",
        ),
        SourceStatusEntry(
            name="google_trends",
            status="live",
            detail="unofficial API, no key required; degrades on rate limit",
        ),
        SourceStatusEntry(name="hacker_news", status="live", detail="public Search API"),
        SourceStatusEntry(
            name="wikimedia_pageviews",
            status="live" if wikimedia_configured else "degraded",
            detail=None if wikimedia_configured else "WIKIMEDIA_CONTACT_EMAIL not set",
        ),
        SourceStatusEntry(name="instagram", status="csv", detail="CSV import only; live OAuth not configured"),
        SourceStatusEntry(name="tiktok", status="csv", detail="CSV import only; live OAuth not configured"),
        SourceStatusEntry(name="pinterest", status="csv", detail="CSV import only; live OAuth not configured"),
    ]
    return SourcesResponse(sources=entries)

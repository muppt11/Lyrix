from fastapi import APIRouter

from ingest.connectors.youtube import YouTubeConnector

from ..schemas.sources import SourcesResponse, SourceStatusEntry

router = APIRouter()


@router.get("/sources", response_model=SourcesResponse)
def sources() -> SourcesResponse:
    """Lightweight status without spending API quota: reports whether each
    connector is configured, not a live probe call."""
    youtube = YouTubeConnector()
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
    ]
    return SourcesResponse(sources=entries)

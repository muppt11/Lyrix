from fastapi import APIRouter, HTTPException

from ingest.backfill_youtube import NICHE_KEYWORDS, backfill
from ingest.storage.parquet_store import query_content_items

from ..schemas.content import CamelModel, Niche

router = APIRouter()


class IngestRequest(CamelModel):
    niche: Niche
    since_year: int = 2020
    until_year: int = 2026
    max_results: int = 50


class IngestResponse(CamelModel):
    niche: Niche
    since_year: int
    until_year: int
    items_persisted_total: int


@router.post("/ingest/{source}", response_model=IngestResponse)
def trigger_ingest(source: str, body: IngestRequest) -> IngestResponse:
    if source != "youtube":
        raise HTTPException(status_code=404, detail=f"No backfill connector for source '{source}'")

    before = len(query_content_items(niche=body.niche, limit=1_000_000))
    backfill([body.niche], body.since_year, body.until_year, body.max_results)
    after = len(query_content_items(niche=body.niche, limit=1_000_000))

    return IngestResponse(
        niche=body.niche,
        since_year=body.since_year,
        until_year=body.until_year,
        items_persisted_total=after - before if after >= before else after,
    )


@router.get("/ingest/{source}/niches")
def list_niches(source: str) -> dict[str, list[str]]:
    if source != "youtube":
        raise HTTPException(status_code=404, detail=f"No backfill connector for source '{source}'")
    return NICHE_KEYWORDS

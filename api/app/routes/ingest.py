from hashlib import sha256
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import Field

from ingest.backfill_youtube import NICHE_KEYWORDS, backfill
from ingest.connectors.csv_import import (
    SUPPORTED_CONTENT_SOURCES,
    CSVImportError,
    parse_content_csv,
    parse_historical_prior_csv,
)
from ingest.connectors.hacker_news import HackerNewsConnector
from ingest.connectors.wikimedia import WikimediaPageviewsConnector
from ingest.storage.parquet_store import (
    append_content_items,
    append_external_observations,
    append_historical_priors,
    write_raw_csv,
)

from ..schemas.content import CamelModel, Niche

router = APIRouter()


class IngestRequest(CamelModel):
    niche: Niche
    since_year: int = Field(default=2020, ge=2020, le=2026)
    until_year: int = Field(default=2026, ge=2020, le=2026)
    max_results: int = Field(default=50, ge=1, le=50)


class IngestResponse(CamelModel):
    source: str
    status: str
    records_ingested: int
    ingestion_id: str
    niche: Niche
    since_year: int
    until_year: int
    items_persisted_total: int


class CSVImportRequest(CamelModel):
    csv_text: str = Field(min_length=1, max_length=5_000_000)
    niche: Niche | None = None


class CSVImportResponse(CamelModel):
    source: str
    status: str
    records_imported: int
    ingestion_id: str


class HackerNewsIngestRequest(CamelModel):
    query: str = Field(min_length=2, max_length=100)
    niche: Niche
    max_results: int = Field(default=50, ge=1, le=100)
    since_timestamp: int | None = Field(default=None, ge=0)


class WikimediaIngestRequest(CamelModel):
    article: str = Field(min_length=1, max_length=200)
    start: str = Field(pattern=r"^\d{10}$")
    end: str = Field(pattern=r"^\d{10}$")
    niche: Niche


@router.post("/ingest/youtube", response_model=IngestResponse)
def trigger_ingest(body: IngestRequest) -> IngestResponse:
    if body.until_year < body.since_year:
        raise HTTPException(status_code=422, detail="until_year must be greater than or equal to since_year")

    ingestion_id = f"youtube-backfill-{body.niche}-{body.since_year}-{body.until_year}-{uuid4().hex}"
    records_ingested = backfill(
        [body.niche], body.since_year, body.until_year, body.max_results
    )

    return IngestResponse(
        source="youtube",
        status="live" if records_ingested else "degraded",
        records_ingested=records_ingested,
        ingestion_id=ingestion_id,
        niche=body.niche,
        since_year=body.since_year,
        until_year=body.until_year,
        items_persisted_total=records_ingested,
    )


@router.get("/ingest/{source}/niches")
def list_niches(source: str) -> dict[str, list[str]]:
    if source != "youtube":
        raise HTTPException(status_code=404, detail=f"No backfill connector for source '{source}'")
    return NICHE_KEYWORDS


@router.post("/ingest/hacker_news")
def ingest_hacker_news(body: HackerNewsIngestRequest) -> dict[str, str | int]:
    connector = HackerNewsConnector()
    observations, status = connector.search(body.query, body.max_results, body.since_timestamp)
    ingestion_id = f"hacker-news-{uuid4().hex}"
    if observations:
        append_external_observations(observations, "hacker_news", body.query, ingestion_id, body.niche)
    return {
        "source": status.name,
        "status": status.status,
        "records_ingested": len(observations),
        "ingestion_id": ingestion_id,
    }


@router.post("/ingest/wikimedia")
def ingest_wikimedia(body: WikimediaIngestRequest) -> dict[str, str | int]:
    connector = WikimediaPageviewsConnector()
    observations, status = connector.fetch_pageviews(body.article, body.start, body.end)
    ingestion_id = f"wikimedia-{uuid4().hex}"
    if observations:
        append_external_observations(observations, "wikimedia_pageviews", body.article, ingestion_id, body.niche)
    return {
        "source": status.name,
        "status": status.status,
        "records_ingested": len(observations),
        "ingestion_id": ingestion_id,
    }


@router.post("/import/{source}", response_model=CSVImportResponse)
def import_csv(source: str, body: CSVImportRequest) -> CSVImportResponse:
    ingestion_id = f"csv-{source}-{sha256(body.csv_text.encode('utf-8')).hexdigest()[:20]}"
    if source in SUPPORTED_CONTENT_SOURCES:
        try:
            records = parse_content_csv(body.csv_text, source)
        except CSVImportError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        for record in records:
            if body.niche is not None and record["niche"] not in (None, body.niche):
                raise HTTPException(status_code=422, detail="CSV row niche does not match request niche")
            record["niche"] = body.niche or record["niche"]
        write_raw_csv(source, ingestion_id, body.csv_text)
        append_content_items(
            records,
            body.niche,
            "csv_import",
            ingestion_mode="csv_import",
            ingestion_id=ingestion_id,
            raw_source=source,
        )
    elif source == "trend_reports":
        try:
            records = parse_historical_prior_csv(body.csv_text)
        except CSVImportError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        if body.niche is not None and any(record["niche"] != body.niche for record in records):
            raise HTTPException(status_code=422, detail="CSV row niche does not match request niche")
        write_raw_csv(source, ingestion_id, body.csv_text)
        append_historical_priors(records, ingestion_id)
    else:
        raise HTTPException(status_code=404, detail=f"Unsupported CSV import source: {source}")

    return CSVImportResponse(
        source=source,
        status="csv",
        records_imported=len(records),
        ingestion_id=ingestion_id,
    )

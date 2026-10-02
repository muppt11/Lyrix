"""Validated import contracts for normalized creator exports and trend priors."""

from __future__ import annotations

import csv
import hashlib
import json
import re
from datetime import datetime
from io import StringIO
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationError

SUPPORTED_CONTENT_SOURCES = {"youtube", "instagram", "tiktok", "pinterest"}
_HEADER_ALIASES = {
    "post_id": "id",
    "media_id": "id",
    "video_id": "id",
    "caption": "title",
    "description": "title",
    "publish_time": "published_at",
    "created_at": "published_at",
    "date": "published_at",
    "video_views": "views",
    "play_count": "views",
    "like_count": "likes",
    "comment_count": "comments",
    "share_count": "shares",
    "thumbnail_url": "thumbnail_url",
    "channel_title": "channel_title",
}


class ImportedMetrics(BaseModel):
    model_config = ConfigDict(extra="forbid")

    views: int = Field(ge=0)
    likes: int = Field(ge=0)
    comments: int = Field(ge=0)
    shares: int | None = Field(default=None, ge=0)
    revenue_cents: int | None = Field(default=None, ge=0)


class ImportedContentItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1)
    platform: Literal["youtube", "instagram", "tiktok", "pinterest"]
    type: Literal["photo", "video", "short", "reel", "post", "story"]
    title: str = Field(min_length=1)
    published_at: datetime
    thumbnail_url: str | None = None
    channel_title: str | None = None
    url: str | None = None
    niche: Literal["dance", "fashion"] | None = None
    query: str = "csv_import"
    metrics: ImportedMetrics


class HistoricalPrior(BaseModel):
    model_config = ConfigDict(extra="forbid")

    niche: Literal["dance", "fashion"]
    era_year: int = Field(ge=2020, le=2026)
    query: str = Field(min_length=1)
    metric_name: str = Field(min_length=1)
    metric_value: float
    unit: str = Field(min_length=1)
    report_label: str = Field(min_length=1)


class CSVImportError(ValueError):
    pass


def _normalize_headers(fieldnames: list[str | None] | None) -> dict[str, str]:
    if not fieldnames:
        raise CSVImportError("CSV has no header row")
    normalized: dict[str, str] = {}
    for fieldname in fieldnames:
        if fieldname is None:
            continue
        key = re.sub(r"[^a-z0-9]+", "_", fieldname.strip().lower()).strip("_")
        normalized[fieldname] = _HEADER_ALIASES.get(key, key)
    return normalized


def _rows(csv_text: str) -> tuple[dict[str, str], list[dict[str, str]]]:
    try:
        reader = csv.DictReader(StringIO(csv_text.lstrip("\ufeff")))
        headers = _normalize_headers(reader.fieldnames)
        rows = [
            {headers[key]: (value or "").strip() for key, value in row.items() if key in headers}
            for row in reader
            if any(value and value.strip() for value in row.values() if value is not None)
        ]
    except csv.Error as exc:
        raise CSVImportError(f"Invalid CSV: {exc}") from exc
    return headers, rows


def parse_content_csv(csv_text: str, source: str) -> list[dict]:
    if source not in SUPPORTED_CONTENT_SOURCES:
        raise CSVImportError(f"Unsupported content CSV source: {source}")
    headers, rows = _rows(csv_text)
    canonical_headers = set(headers.values())
    required = {"title", "published_at", "views", "likes", "comments"}
    missing = sorted(required - canonical_headers)
    if missing:
        raise CSVImportError(f"CSV is missing required columns: {', '.join(missing)}")
    if not rows:
        raise CSVImportError("CSV contains no content rows")

    default_type = "video" if source == "youtube" else "post"
    imported: list[dict] = []
    for row_number, row in enumerate(rows, start=2):
        row_id = row.get("id") or hashlib.sha256(
            json.dumps(row, sort_keys=True, ensure_ascii=True).encode()
        ).hexdigest()
        data = {
            "id": row_id,
            "platform": source,
            "type": row.get("type") or default_type,
            "title": row.get("title"),
            "published_at": row.get("published_at"),
            "thumbnail_url": row.get("thumbnail_url") or None,
            "channel_title": row.get("channel_title") or None,
            "url": row.get("url") or None,
            "niche": row.get("niche") or None,
            "query": row.get("query") or "csv_import",
            "metrics": {
                "views": row.get("views"),
                "likes": row.get("likes"),
                "comments": row.get("comments"),
                "shares": row.get("shares") or None,
                "revenue_cents": row.get("revenue_cents") or None,
            },
        }
        try:
            imported.append(ImportedContentItem.model_validate(data).model_dump(mode="json"))
        except ValidationError as exc:
            raise CSVImportError(f"Invalid content data on row {row_number}: {exc.errors()[0]['msg']}") from exc
    return imported


def parse_historical_prior_csv(csv_text: str) -> list[dict]:
    headers, rows = _rows(csv_text)
    canonical_headers = set(headers.values())
    required = {"niche", "era_year", "query", "metric_name", "metric_value", "unit", "report_label"}
    missing = sorted(required - canonical_headers)
    if missing:
        raise CSVImportError(f"CSV is missing required columns: {', '.join(missing)}")
    if not rows:
        raise CSVImportError("CSV contains no prior rows")

    imported: list[dict] = []
    for row_number, row in enumerate(rows, start=2):
        try:
            imported.append(HistoricalPrior.model_validate(row).model_dump())
        except ValidationError as exc:
            raise CSVImportError(f"Invalid prior data on row {row_number}: {exc.errors()[0]['msg']}") from exc
    return imported
"""Normalized event persistence: append discovered content items to a
Parquet file, queryable via DuckDB. Idempotent on (platform, id) — a
repeat fetch of the same video just updates its latest observed metrics
rather than duplicating rows.
"""

from __future__ import annotations

import json
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path

import duckdb
import pandas as pd

_REPO_ROOT = Path(__file__).resolve().parents[2]
_RAW_DIR = _REPO_ROOT / "data" / "raw"
_PROCESSED_DIR = _REPO_ROOT / "data" / "processed"
_CONTENT_ITEMS_PATH = _PROCESSED_DIR / "content_items.parquet"
_EXTERNAL_OBSERVATIONS_PATH = _PROCESSED_DIR / "external_observations.parquet"
_HISTORICAL_PRIORS_PATH = _PROCESSED_DIR / "historical_priors.parquet"


def _write_raw_batch(
    items: list[dict], source: str, ingestion_id: str, observed_at: str
) -> None:
    if not re.fullmatch(r"[a-z0-9_-]+", source) or not re.fullmatch(r"[A-Za-z0-9_.-]+", ingestion_id):
        raise ValueError("source and ingestion_id must contain only safe filename characters")

    source_dir = _RAW_DIR / source
    source_dir.mkdir(parents=True, exist_ok=True)
    raw_path = source_dir / f"{ingestion_id}.jsonl"
    temporary_path = source_dir / f".{ingestion_id}.{uuid.uuid4().hex}.tmp"
    with temporary_path.open("w", encoding="utf-8") as raw_file:
        for item in items:
            raw_file.write(json.dumps({"observed_at": observed_at, "payload": item}, sort_keys=True))
            raw_file.write("\n")
    temporary_path.replace(raw_path)


def write_raw_csv(source: str, ingestion_id: str, csv_text: str) -> None:
    if not re.fullmatch(r"[a-z0-9_-]+", source) or not re.fullmatch(r"[A-Za-z0-9_.-]+", ingestion_id):
        raise ValueError("source and ingestion_id must contain only safe filename characters")
    source_dir = _RAW_DIR / "csv_import" / source
    source_dir.mkdir(parents=True, exist_ok=True)
    raw_path = source_dir / f"{ingestion_id}.csv"
    temporary_path = source_dir / f".{ingestion_id}.{uuid.uuid4().hex}.tmp"
    temporary_path.write_text(csv_text, encoding="utf-8")
    temporary_path.replace(raw_path)


def append_content_items(
    items: list[dict],
    niche: str | None,
    query: str,
    ingestion_mode: str = "live_discovery",
    era_year: int | None = None,
    ingestion_id: str | None = None,
    raw_source: str = "youtube",
) -> None:
    if not items:
        return

    _PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    fetched_at = datetime.now(timezone.utc).isoformat()
    ingestion_id = ingestion_id or uuid.uuid4().hex
    _write_raw_batch(items, raw_source, ingestion_id, fetched_at)

    rows = [
        {
            "id": it["id"],
            "platform": it["platform"],
            "type": it["type"],
            "title": it["title"],
            "published_at": it["published_at"],
            "channel_title": it.get("channel_title"),
            "url": it.get("url"),
            "views": it["metrics"]["views"],
            "likes": it["metrics"]["likes"],
            "comments": it["metrics"]["comments"],
            "niche": niche,
            "query": query,
            # 'live_discovery' (interactive /discover search) or 'backfill'
            # (historical era ingestion); era_year is the target backfill
            # year, null for live_discovery.
            "ingestion_mode": ingestion_mode,
            "era_year": era_year,
            "ingestion_id": ingestion_id,
            "fetched_at": fetched_at,
        }
        for it in items
    ]
    new_df = pd.DataFrame(rows)

    if _CONTENT_ITEMS_PATH.exists():
        existing_df = pd.read_parquet(_CONTENT_ITEMS_PATH)
        combined = pd.concat([existing_df, new_df], ignore_index=True)
    else:
        combined = new_df

    combined = combined.sort_values("fetched_at").drop_duplicates(
        subset=["ingestion_id", "platform", "id"], keep="last"
    )
    combined.to_parquet(_CONTENT_ITEMS_PATH, index=False)


def append_external_observations(
    observations: list[dict],
    source: str,
    query: str,
    ingestion_id: str,
    niche: str | None = None,
) -> None:
    if not observations:
        return

    observed_at = datetime.now(timezone.utc).isoformat()
    _write_raw_batch(observations, source, ingestion_id, observed_at)
    _PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    rows = []
    for observation in observations:
        row = {
            **observation,
            "record_id": str(observation.get("id") or f"{observation.get('article')}:{observation.get('timestamp')}"),
            "source": source,
            "query": query,
            "niche": niche,
            "ingestion_id": ingestion_id,
            "observed_at": observed_at,
        }
        rows.append(row)
    new_df = pd.DataFrame(rows)
    combined = pd.concat(
        [pd.read_parquet(_EXTERNAL_OBSERVATIONS_PATH), new_df], ignore_index=True
    ) if _EXTERNAL_OBSERVATIONS_PATH.exists() else new_df
    combined = combined.sort_values("observed_at").drop_duplicates(
        subset=["source", "record_id", "ingestion_id"], keep="last"
    )
    combined.to_parquet(_EXTERNAL_OBSERVATIONS_PATH, index=False)


def append_historical_priors(records: list[dict], ingestion_id: str) -> None:
    if not records:
        return

    observed_at = datetime.now(timezone.utc).isoformat()
    _write_raw_batch(records, "trend_reports", ingestion_id, observed_at)
    _PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    rows = [
        {**record, "ingestion_id": ingestion_id, "observed_at": observed_at}
        for record in records
    ]
    new_df = pd.DataFrame(rows)
    combined = pd.concat(
        [pd.read_parquet(_HISTORICAL_PRIORS_PATH), new_df], ignore_index=True
    ) if _HISTORICAL_PRIORS_PATH.exists() else new_df
    combined = combined.drop_duplicates(
        subset=["ingestion_id", "niche", "era_year", "query", "metric_name", "unit", "report_label"], keep="last"
    )
    combined.to_parquet(_HISTORICAL_PRIORS_PATH, index=False)


def query_content_items(platform: str | None = None, niche: str | None = None, limit: int = 100) -> list[dict]:
    if not _CONTENT_ITEMS_PATH.exists():
        return []

    conditions = []
    params: list[str] = []
    if platform:
        conditions.append("platform = ?")
        params.append(platform)
    if niche:
        conditions.append("niche = ?")
        params.append(niche)
    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    sql = f"""
        SELECT * FROM read_parquet(?)
        {where_clause}
        ORDER BY fetched_at DESC
        LIMIT {int(limit)}
    """
    con = duckdb.connect()
    result = con.execute(sql, [str(_CONTENT_ITEMS_PATH), *params]).df()
    return result.to_dict(orient="records")

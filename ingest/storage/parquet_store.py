"""Normalized event persistence: append discovered content items to a
Parquet file, queryable via DuckDB. Idempotent on (platform, id) — a
repeat fetch of the same video just updates its latest observed metrics
rather than duplicating rows.
"""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

import duckdb
import pandas as pd

_REPO_ROOT = Path(__file__).resolve().parents[2]
_PROCESSED_DIR = _REPO_ROOT / "data" / "processed"
_CONTENT_ITEMS_PATH = _PROCESSED_DIR / "content_items.parquet"


def append_content_items(
    items: list[dict],
    niche: str | None,
    query: str,
    ingestion_mode: str = "live_discovery",
    era_year: int | None = None,
) -> None:
    if not items:
        return

    _PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    fetched_at = datetime.now(timezone.utc).isoformat()

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
        subset=["platform", "id"], keep="last"
    )
    combined.to_parquet(_CONTENT_ITEMS_PATH, index=False)


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

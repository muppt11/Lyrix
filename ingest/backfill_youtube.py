"""Historical backfill (2020-2026) for the dance/fashion niches.

Run directly: `python -m ingest.backfill_youtube`
Or scoped:     `python -m ingest.backfill_youtube --niche dance --since 2022 --until 2023`

One search.list call per (niche, keyword, year) — 100 quota units each,
plus ~1 for the stats lookup. Default keyword set x year range costs about
4,200 units; the daily free budget is 10,000 (see YOUTUBE_QUOTA_DAILY_BUDGET
in ingest/connectors/youtube.py). Re-running is safe: storage is idempotent
on (platform, id).
"""

from __future__ import annotations

import argparse
import hashlib
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv

from .connectors.youtube import YouTubeConnector
from .storage.parquet_store import append_content_items

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

NICHE_KEYWORDS: dict[str, list[str]] = {
    "dance": ["dance challenge", "street dance", "dance choreography"],
    "fashion": ["fashion trend", "streetwear outfit", "fashion haul"],
}


def backfill(niches: list[str], since_year: int, until_year: int, max_results: int = 50) -> int:
    connector = YouTubeConnector()
    if not connector.api_key:
        print("YOUTUBE_API_KEY not set — nothing to backfill.", file=sys.stderr)
        return 0

    total_items = 0
    for niche in niches:
        for keyword in NICHE_KEYWORDS[niche]:
            for year in range(since_year, until_year + 1):
                window_start = datetime(year, 1, 1, tzinfo=timezone.utc)
                window_end = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
                items, status = connector.discover_window(keyword, window_start, window_end, max_results=max_results)

                if status.status != "live":
                    print(f"[{niche}/{keyword}/{year}] {status.status}: {status.detail}")
                    if status.status == "degraded" and status.detail and "quota" in status.detail:
                        print("Daily quota budget exhausted — stopping early. Re-run tomorrow to continue.")
                        return total_items
                    continue

                batch_key = hashlib.sha256(f"{niche}\0{keyword}\0{year}".encode()).hexdigest()[:20]
                append_content_items(
                    items,
                    niche,
                    keyword,
                    ingestion_mode="backfill",
                    era_year=year,
                    ingestion_id=f"youtube-backfill-{niche}-{year}-{batch_key}",
                )
                total_items += len(items)
                print(f"[{niche}/{keyword}/{year}] {len(items)} videos")
                time.sleep(0.2)  # be a polite API citizen

    print(f"Backfill complete: {total_items} items persisted across {len(niches)} niche(s), "
          f"{since_year}-{until_year}.")
    return total_items


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--niche", choices=list(NICHE_KEYWORDS), action="append", dest="niches")
    parser.add_argument("--since", type=int, default=2020)
    parser.add_argument("--until", type=int, default=2026)
    parser.add_argument("--max-results", type=int, default=50)
    args = parser.parse_args()

    niches = args.niches or list(NICHE_KEYWORDS)
    backfill(niches, args.since, args.until, args.max_results)


if __name__ == "__main__":
    main()

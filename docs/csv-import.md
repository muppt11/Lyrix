# CSV Imports

CSV imports are available for Instagram, TikTok, and Pinterest creator exports, plus labeled historical trend reports. Imports are validated before storage; missing metrics are never filled with guesses.

## Creator exports

Send `POST /import/{source}` with JSON fields `csvText` and optional `niche`. Supported `source` values are `instagram`, `tiktok`, `pinterest`, and `youtube`.

Required columns are `title`, `published_at`, `views`, `likes`, and `comments`. Optional columns are `id`, `type`, `shares`, `revenue_cents`, `thumbnail_url`, `channel_title`, `url`, `niche`, and `query`. Common export names such as `caption`, `date`, `post_id`, `video_views`, `like_count`, and `comment_count` are normalized. If `id` is absent, a deterministic ID is derived from the row contents.

Example:

```csv
post_id,caption,date,views,likes,comments,shares,niche
post-123,Street dance,2025-03-01T12:00:00Z,1200,88,7,4,dance
```

The route returns an ingestion ID and imported row count. Exact reimports are idempotent. Original CSV bytes are kept under `data/raw/csv_import/{source}/`; normalized observations are stored under `data/processed/content_items.parquet`.

## Historical report priors

Send `POST /import/trend_reports` with `csvText`. Required columns are `niche`, `era_year`, `query`, `metric_name`, `metric_value`, `unit`, and `report_label`. Era years are limited to 2020-2026. Reports remain explicitly labeled priors and are stored separately in `data/processed/historical_priors.parquet`.

## Other sources

`POST /ingest/hacker_news` accepts `query`, `niche`, and optional `max_results` and `since_timestamp`. It stores timestamped stories and comments, including parent/story IDs for cascade analysis.

`POST /ingest/wikimedia` accepts `article`, Wikimedia-formatted `start` and `end` timestamps, and `niche`. Configure `WIKIMEDIA_CONTACT_EMAIL` so requests use an identified User-Agent; without it the source reports `degraded` and does not call Wikimedia.

Raw public-source batches are written under `data/raw/{source}/`; normalized event observations are stored separately in `data/processed/external_observations.parquet`. These data directories are gitignored.
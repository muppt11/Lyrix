import pytest

from ingest.connectors.csv_import import (
    CSVImportError,
    parse_content_csv,
    parse_historical_prior_csv,
)


def test_content_csv_normalizes_common_headers_without_inventing_metrics() -> None:
    csv_text = (
        "Post ID,Caption,Date,Video Views,Like Count,Comment Count,Share Count,Niche\n"
        "post-1,Street dance,2025-03-01T12:00:00Z,1200,88,7,4,dance\n"
    )

    records = parse_content_csv(csv_text, "instagram")

    assert records[0]["id"] == "post-1"
    assert records[0]["platform"] == "instagram"
    assert records[0]["title"] == "Street dance"
    assert records[0]["metrics"] == {"views": 1200, "likes": 88, "comments": 7, "shares": 4, "revenue_cents": None}


def test_content_csv_rejects_missing_metrics_instead_of_filling_zeros() -> None:
    with pytest.raises(CSVImportError, match="missing required columns: comments"):
        parse_content_csv(
            "id,title,published_at,views,likes\n1,Clip,2025-03-01T12:00:00Z,1200,88\n",
            "tiktok",
        )


def test_historical_prior_csv_requires_explicit_labels_and_era() -> None:
    csv_text = (
        "niche,era_year,query,metric_name,metric_value,unit,report_label\n"
        "fashion,2022,streetwear,reach,45000,views,Creator annual report\n"
    )

    records = parse_historical_prior_csv(csv_text)

    assert records == [{
        "niche": "fashion",
        "era_year": 2022,
        "query": "streetwear",
        "metric_name": "reach",
        "metric_value": 45000.0,
        "unit": "views",
        "report_label": "Creator annual report",
    }]
from __future__ import annotations

from .content import CamelModel, SourceStatus


class SourceStatusEntry(CamelModel):
    name: str
    status: SourceStatus
    detail: str | None = None


class SourcesResponse(CamelModel):
    sources: list[SourceStatusEntry]

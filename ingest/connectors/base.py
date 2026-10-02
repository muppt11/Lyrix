from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

ConnectorStatus = Literal["live", "degraded", "csv", "mock"]


@dataclass
class StatusReport:
    name: str
    status: ConnectorStatus
    detail: str | None = None

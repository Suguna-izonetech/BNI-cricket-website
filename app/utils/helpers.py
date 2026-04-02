"""
Shared utility helpers used across multiple modules.
"""
import uuid
import logging

logger = logging.getLogger(__name__)


def parse_uuid(value: str) -> uuid.UUID | None:
    """Safely parse a UUID string; returns None on failure."""
    try:
        return uuid.UUID(value)
    except (ValueError, AttributeError):
        return None


def clamp(value: int, min_val: int, max_val: int) -> int:
    """Clamp an integer between min and max (inclusive)."""
    return max(min_val, min(value, max_val))

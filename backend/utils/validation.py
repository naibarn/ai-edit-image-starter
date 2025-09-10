"""Validation utilities for the AI Image Studio backend."""

from typing import Literal


def normalize_fmt(fmt: str) -> Literal["png", "webp", "jpg"]:
    """Normalize image format string.

    Args:
        fmt: Input format string

    Returns:
        Normalized format: 'png', 'webp', or 'jpg'

    Raises:
        ValueError: If format is not supported
    """
    if not fmt:
        return "png"

    fmt_lower = fmt.lower().strip()

    # Handle common variations
    if fmt_lower in ["png"]:
        return "png"
    elif fmt_lower in ["webp", "web-p"]:
        return "webp"
    elif fmt_lower in ["jpg", "jpeg", "jpe"]:
        return "jpg"
    else:
        raise ValueError(f"Unsupported format: {fmt}. Use png, webp, or jpg")
"""Regression tests for Home Assistant translation completeness."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).parents[1]
TRANSLATIONS = ROOT / "custom_components" / "parqet" / "translations"
STRINGS = ROOT / "custom_components" / "parqet" / "strings.json"


def _load(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _leaf_paths(value: Any, prefix: tuple[str, ...] = ()) -> set[tuple[str, ...]]:
    if isinstance(value, dict):
        return {
            path
            for key, child in value.items()
            for path in _leaf_paths(child, (*prefix, key))
        }
    return {prefix}


def test_german_translation_matches_the_source_structure() -> None:
    """German must cover every Home Assistant translation key."""
    source = _load(STRINGS)
    german = _load(TRANSLATIONS / "de.json")

    assert _leaf_paths(german) == _leaf_paths(source)


def test_all_sensor_names_are_translated_to_german() -> None:
    """Every non-acronym sensor name must differ from its English source."""
    english = _load(TRANSLATIONS / "en.json")["entity"]["sensor"]
    german = _load(TRANSLATIONS / "de.json")["entity"]["sensor"]

    assert len(german) == 22
    assert german.keys() == english.keys()
    assert {
        key
        for key in german
        if german[key]["name"] == english[key]["name"]
    } == {"xirr", "ttwror"}
    assert german["total_value"]["name"] == "Gesamtwert"
    assert german["holdings_count"]["name"] == "Anzahl Positionen"

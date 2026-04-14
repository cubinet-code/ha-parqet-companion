"""Tests for frontend registration — Lovelace resource and add_extra_js_url."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from homeassistant.core import HomeAssistant

from custom_components.parqet.frontend import (
    CARD_JS_URL,
    _async_register_lovelace_resource,
    async_register_frontend,
)


def _make_resources(items: list[dict] | None = None) -> MagicMock:
    """Create a mock ResourceStorageCollection."""
    resources = MagicMock()
    resources.async_load = AsyncMock()
    resources.async_items = MagicMock(return_value=items or [])
    resources.async_create_item = AsyncMock(return_value={"id": "new-id", "url": ""})
    resources.async_update_item = AsyncMock(return_value={"id": "existing-id", "url": ""})
    return resources


def _make_hass(resources: MagicMock | None = None, mode: str = "storage") -> HomeAssistant:
    """Create a mock hass with Lovelace data."""
    hass = MagicMock(spec=HomeAssistant)
    if resources is not None:
        hass.data = {"lovelace": {"mode": mode, "resources": resources}}
    else:
        hass.data = {}
    return hass


VERSIONED_URL = f"{CARD_JS_URL}?v=0.3.3"


class TestAsyncRegisterLovelaceResource:
    """Tests for _async_register_lovelace_resource."""

    @pytest.mark.asyncio
    async def test_creates_resource_when_not_present(self) -> None:
        resources = _make_resources([])
        hass = _make_hass(resources)

        await _async_register_lovelace_resource(hass, VERSIONED_URL)

        resources.async_load.assert_called_once()
        resources.async_create_item.assert_called_once_with(
            {"res_type": "module", "url": VERSIONED_URL}
        )

    @pytest.mark.asyncio
    async def test_skips_when_url_already_current(self) -> None:
        existing = [{"id": "abc", "url": VERSIONED_URL}]
        resources = _make_resources(existing)
        hass = _make_hass(resources)

        await _async_register_lovelace_resource(hass, VERSIONED_URL)

        resources.async_load.assert_called_once()
        resources.async_create_item.assert_not_called()
        resources.async_update_item.assert_not_called()

    @pytest.mark.asyncio
    async def test_updates_when_version_changed(self) -> None:
        old_url = f"{CARD_JS_URL}?v=0.3.0"
        existing = [{"id": "abc", "url": old_url}]
        resources = _make_resources(existing)
        hass = _make_hass(resources)

        await _async_register_lovelace_resource(hass, VERSIONED_URL)

        resources.async_load.assert_called_once()
        resources.async_update_item.assert_called_once_with("abc", {"url": VERSIONED_URL})
        resources.async_create_item.assert_not_called()

    @pytest.mark.asyncio
    async def test_skips_when_lovelace_not_initialised(self) -> None:
        hass = _make_hass(resources=None)
        hass.data = {}  # no lovelace key

        await _async_register_lovelace_resource(hass, VERSIONED_URL)
        # Should not raise

    @pytest.mark.asyncio
    async def test_skips_in_yaml_mode(self) -> None:
        resources = _make_resources([])
        hass = _make_hass(resources, mode="yaml")

        await _async_register_lovelace_resource(hass, VERSIONED_URL)

        resources.async_load.assert_not_called()
        resources.async_create_item.assert_not_called()

    @pytest.mark.asyncio
    async def test_does_not_raise_on_exception(self) -> None:
        resources = _make_resources([])
        resources.async_load = AsyncMock(side_effect=RuntimeError("storage error"))
        hass = _make_hass(resources)

        # Should log and not raise
        await _async_register_lovelace_resource(hass, VERSIONED_URL)

    @pytest.mark.asyncio
    async def test_async_load_called_before_read(self) -> None:
        """async_load must be called before async_items to prevent lazy-load data loss."""
        call_order: list[str] = []
        resources = _make_resources([])
        resources.async_load = AsyncMock(side_effect=lambda: call_order.append("load"))
        resources.async_items = MagicMock(side_effect=lambda: call_order.append("items") or [])
        hass = _make_hass(resources)

        await _async_register_lovelace_resource(hass, VERSIONED_URL)

        assert call_order.index("load") < call_order.index("items")


class TestAsyncRegisterFrontend:
    """Tests for async_register_frontend — verifies coroutines are properly awaited."""

    @pytest.mark.asyncio
    async def test_lovelace_registration_is_scheduled_as_task(self) -> None:
        """async_at_started callback must schedule the coroutine via async_create_task.

        Regression test for: RuntimeWarning: coroutine '_async_register_lovelace_resource'
        was never awaited. The callback passed to async_at_started must be a sync function
        that schedules the coroutine — not a lambda that returns an unawaited coroutine.
        """
        scheduled_coros: list[str] = []
        at_start_callbacks: list = []

        hass = MagicMock(spec=HomeAssistant)
        hass.async_add_executor_job = AsyncMock(return_value="0.3.3")
        hass.http = MagicMock()
        hass.http.async_register_static_paths = AsyncMock()
        hass.is_running = True

        def capture_create_task(coro, **kwargs):
            scheduled_coros.append(type(coro).__name__)
            # Close the coroutine to avoid ResourceWarning
            coro.close()

        hass.async_create_task = MagicMock(side_effect=capture_create_task)

        def capture_at_started(h, cb):
            at_start_callbacks.append(cb)

        with (
            patch("custom_components.parqet.frontend.CARD_JS_PATH") as mock_path,
            patch("custom_components.parqet.frontend.add_extra_js_url"),
            patch("custom_components.parqet.frontend.async_at_started", side_effect=capture_at_started),
        ):
            mock_path.exists.return_value = True
            await async_register_frontend(hass)

        assert len(at_start_callbacks) == 1, "Expected exactly one async_at_started registration"

        # Call the registered callback — it must schedule a task, not return a coroutine
        at_start_callbacks[0](hass)

        assert len(scheduled_coros) == 1, (
            "Expected async_create_task to be called once — "
            "the callback must schedule the coroutine, not return it unawaited"
        )

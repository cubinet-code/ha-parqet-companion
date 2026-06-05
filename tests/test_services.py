"""Tests for parqet.dump_diagnostics service."""

from __future__ import annotations

from unittest.mock import patch

from homeassistant.core import HomeAssistant

from custom_components.parqet.const import DOMAIN
from custom_components.parqet.services import (
    SERVICE_DUMP_DIAGNOSTICS,
    async_register_services,
)


async def test_async_register_services_registers_dump_diagnostics(
    hass: HomeAssistant,
) -> None:
    """Calling async_register_services must expose parqet.dump_diagnostics."""
    async_register_services(hass)
    assert hass.services.has_service(DOMAIN, SERVICE_DUMP_DIAGNOSTICS)


async def test_async_register_services_is_idempotent(hass: HomeAssistant) -> None:
    """Calling twice must not raise — guards against repeated async_setup runs."""
    async_register_services(hass)
    async_register_services(hass)
    assert hass.services.has_service(DOMAIN, SERVICE_DUMP_DIAGNOSTICS)


async def test_dump_diagnostics_creates_persistent_notification(
    hass: HomeAssistant,
) -> None:
    """Calling the service must post a notification with diagnostics JSON."""
    async_register_services(hass)

    with patch(
        "custom_components.parqet.services.persistent_notification.async_create"
    ) as create:
        await hass.services.async_call(
            DOMAIN, SERVICE_DUMP_DIAGNOSTICS, {}, blocking=True
        )

    create.assert_called_once()
    kwargs = create.call_args.kwargs
    assert kwargs["title"] == "Parqet diagnostics"
    assert kwargs["notification_id"] == f"{DOMAIN}_diagnostics"
    message = kwargs["message"]
    assert '"version"' in message
    assert '"js_url"' in message
    assert '"config_entries"' in message

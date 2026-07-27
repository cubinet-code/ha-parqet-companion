"""WebSocket API for Parqet.

Commands accept either:
- `portfolio_id` + `entry_id` (preferred, unambiguous), or
- `entry_id` alone (back-compat: only works for accounts with one portfolio).
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant, callback

from .api import ParqetApiError, ParqetRateLimitError
from .const import (
    CONF_CURRENCY,
    CONF_ENTRY_TYPE,
    CONF_PORTFOLIO_META,
    CONF_SOURCE_ENTRY_IDS,
    DEFAULT_INTERVAL,
    DOMAIN,
    ENTRY_TYPE_COMBINED,
)
from .coordinator import ParqetDataUpdateCoordinator

if TYPE_CHECKING:
    from . import ParqetAccountRuntime

_LOGGER = logging.getLogger(__name__)


class CombinedUnavailableError(ValueError):
    """Raised when an explicit Combined entry cannot provide a complete result."""

    def __init__(self, code: str, message: str) -> None:
        """Initialize a structured Combined availability error."""
        super().__init__(message)
        self.code = code


def _combined_source_runtimes(
    hass: HomeAssistant,
    combined_entry_id: str,
) -> list[ParqetAccountRuntime]:
    """Resolve every selected loaded same-currency account runtime."""
    combined_entry = hass.config_entries.async_get_entry(combined_entry_id)
    if (
        combined_entry is None
        or combined_entry.domain != DOMAIN
        or combined_entry.data.get(CONF_ENTRY_TYPE) != ENTRY_TYPE_COMBINED
        or combined_entry.state is not ConfigEntryState.LOADED
    ):
        raise CombinedUnavailableError(
            "invalid_entry", "Combined config entry is not loaded"
        )

    options = getattr(combined_entry, "options", {})
    source_ids = list(
        options.get(
            CONF_SOURCE_ENTRY_IDS,
            combined_entry.data.get(CONF_SOURCE_ENTRY_IDS, []),
        )
    )
    expected_currency = options.get(
        CONF_CURRENCY,
        combined_entry.data.get(CONF_CURRENCY),
    )
    if len(source_ids) < 2 or not expected_currency:
        raise CombinedUnavailableError(
            "not_available", "Combined sources are not configured"
        )

    runtimes: list[ParqetAccountRuntime] = []
    source_currencies: set[str] = set()
    for source_id in source_ids:
        source = hass.config_entries.async_get_entry(source_id)
        if (
            source is None
            or source.domain != DOMAIN
            or source.state is not ConfigEntryState.LOADED
            or source.data.get(CONF_ENTRY_TYPE) == ENTRY_TYPE_COMBINED
        ):
            raise CombinedUnavailableError(
                "not_available", "A selected Parqet account is not loaded"
            )
        runtime = getattr(source, "runtime_data", None)
        coordinators = getattr(runtime, "coordinators", None)
        api = getattr(runtime, "api", None)
        if not isinstance(coordinators, dict) or api is None:
            raise CombinedUnavailableError(
                "not_available", "A selected Parqet account has no runtime data"
            )
        portfolio_meta: dict[str, dict[str, str]] = source.data.get(
            CONF_PORTFOLIO_META, {}
        )
        for portfolio_id in coordinators:
            currency = portfolio_meta.get(portfolio_id, {}).get("currency")
            if not currency:
                raise CombinedUnavailableError(
                    "mixed_currency", "A selected portfolio has no currency metadata"
                )
            source_currencies.add(currency)
        runtimes.append(runtime)

    if source_currencies != {expected_currency}:
        raise CombinedUnavailableError(
            "mixed_currency", "Selected portfolios do not share the Combined currency"
        )
    return runtimes


def _resolve_runtime(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> ParqetAccountRuntime | None:
    """Validate the config entry and return its runtime, or send error."""
    entry = hass.config_entries.async_get_entry(msg["entry_id"])
    if entry is None or entry.domain != DOMAIN:
        connection.send_error(msg["id"], "invalid_entry", "Invalid config entry")
        return None
    if entry.state is not ConfigEntryState.LOADED:
        connection.send_error(msg["id"], "not_loaded", "Config entry is not loaded")
        return None
    runtime = getattr(entry, "runtime_data", None)
    if (
        getattr(runtime, "coordinators", None) is None
        or getattr(runtime, "api", None) is None
    ):
        connection.send_error(msg["id"], "invalid_entry", "Not an account entry")
        return None
    return runtime


def pick_by_portfolio[T](
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
    mapping: dict[str, T],
    *,
    not_found_label: str,
) -> T | None:
    """Pick a value from `mapping` keyed by `msg["portfolio_id"]`.

    Falls back to the single-element value when `portfolio_id` is omitted and
    `mapping` has exactly one entry; sends a WS error and returns None
    otherwise. Used by both the API and snapshot WebSocket handlers — keeping
    the routing rule in one place avoids drift across modules.
    """
    requested = msg.get("portfolio_id")
    if requested is not None:
        value = mapping.get(requested)
        if value is None:
            connection.send_error(
                msg["id"],
                "invalid_portfolio",
                f"{not_found_label} for portfolio {requested!r}",
            )
            return None
        return value
    if len(mapping) == 1:
        return next(iter(mapping.values()))
    connection.send_error(
        msg["id"],
        "invalid_portfolio",
        "portfolio_id is required when the account has more than one portfolio",
    )
    return None


def _resolve_coordinator(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> ParqetDataUpdateCoordinator | None:
    """Resolve the coordinator for a specific portfolio under an account entry."""
    runtime = _resolve_runtime(hass, connection, msg)
    if runtime is None:
        return None
    return pick_by_portfolio(
        connection, msg, runtime.coordinators,
        not_found_label="No coordinator",
    )


def _send_rate_limit_error(
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
    err: ParqetRateLimitError,
) -> None:
    """Send a rate_limited error response."""
    connection.send_error(
        msg["id"],
        "rate_limited",
        f"Rate limit exceeded. Retry in {err.retry_after}s.",
    )


def _sum_number_values(*values: Any) -> float | int | None:
    """Sum numeric values, returning None when all inputs are missing."""
    numbers = [value for value in values if isinstance(value, int | float)]
    if not numbers:
        return None
    return sum(numbers)


def _get_nested(data: dict[str, Any], path: tuple[str, ...]) -> Any:
    """Return a nested dict value or None when the path is missing."""
    current: Any = data
    for key in path:
        if not isinstance(current, dict):
            return None
        current = current.get(key)
        if current is None:
            return None
    return current


def _set_nested(data: dict[str, Any], path: tuple[str, ...], value: Any) -> None:
    """Set a nested dict value, skipping None values."""
    if value is None:
        return
    current = data
    for key in path[:-1]:
        current = current.setdefault(key, {})
    current[path[-1]] = value


def aggregate_performance_payloads(payloads: list[dict[str, Any]]) -> dict[str, Any]:
    """Aggregate additive performance data returned by Parqet.

    Percentage KPIs such as XIRR/TTWROR are intentionally not produced here:
    independent Parqet accounts cannot be combined by summing percentages.
    """
    performances = [payload.get("performance") or {} for payload in payloads]
    performance: dict[str, Any] = {}
    additive_paths = [
        ("valuation", "atIntervalStart"),
        ("valuation", "atIntervalEnd"),
        ("fees", "inInterval", "fees"),
        ("taxes", "inInterval", "taxes"),
        ("unrealizedGains", "inInterval", "gainGross"),
        ("unrealizedGains", "inInterval", "gainNet"),
        ("realizedGains", "inInterval", "gainGross"),
        ("realizedGains", "inInterval", "gainNet"),
        ("dividends", "inInterval", "gainGross"),
        ("dividends", "inInterval", "gainNet"),
        ("dividends", "inInterval", "taxes"),
        ("dividends", "inInterval", "fees"),
    ]
    for path in additive_paths:
        _set_nested(
            performance,
            path,
            _sum_number_values(*(_get_nested(perf, path) for perf in performances)),
        )

    holdings = [
        holding
        for payload in payloads
        for holding in (payload.get("holdings") or [])
    ]
    return {"performance": performance, "holdings": holdings}


async def _async_get_combined_performance(
    hass: HomeAssistant,
    interval: str,
    combined_entry_id: str,
) -> dict[str, Any]:
    """Fetch and aggregate performance for the explicitly selected accounts."""
    payloads: list[dict[str, Any]] = []
    for runtime in _combined_source_runtimes(hass, combined_entry_id):
        portfolio_ids = list(runtime.coordinators)
        payloads.append(
            await runtime.api.async_get_performance(portfolio_ids, interval)
        )
    return aggregate_performance_payloads(payloads)


def async_register_websocket_api(hass: HomeAssistant) -> None:
    """Register the WebSocket API commands."""
    websocket_api.async_register_command(hass, ws_get_holdings)
    websocket_api.async_register_command(hass, ws_get_activities)
    websocket_api.async_register_command(hass, ws_get_performance)
    websocket_api.async_register_command(hass, ws_get_frontend_diagnostics)


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "parqet/get_holdings",
        vol.Required("entry_id"): str,
        vol.Optional("portfolio_id"): str,
    }
)
@callback
def ws_get_holdings(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Return holdings from coordinator cached data."""
    coordinator = _resolve_coordinator(hass, connection, msg)
    if coordinator is None:
        return

    holdings = (coordinator.data or {}).get("holdings", [])
    connection.send_result(msg["id"], {"holdings": holdings})


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "parqet/get_activities",
        vol.Required("entry_id"): str,
        vol.Optional("portfolio_id"): str,
        vol.Optional("activity_type"): [str],
        vol.Optional("limit", default=25): vol.All(
            vol.Coerce(int), vol.Range(min=1, max=500)
        ),
        vol.Optional("cursor"): str,
    }
)
@websocket_api.async_response
async def ws_get_activities(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Fetch activities on demand from the Parqet API."""
    coordinator = _resolve_coordinator(hass, connection, msg)
    if coordinator is None:
        return

    try:
        data = await coordinator.api.async_get_activities(
            coordinator.portfolio_id,
            activity_type=msg.get("activity_type"),
            limit=msg["limit"],
            cursor=msg.get("cursor"),
        )
    except ParqetRateLimitError as err:
        _send_rate_limit_error(connection, msg, err)
        return
    except ParqetApiError:
        connection.send_error(msg["id"], "api_error", "Failed to fetch activities")
        return

    connection.send_result(msg["id"], data)


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "parqet/get_performance",
        vol.Required("entry_id"): str,
        vol.Optional("portfolio_id"): str,
        vol.Optional("portfolio_ids"): [str],
        vol.Optional("interval", default=DEFAULT_INTERVAL): str,
    }
)
@websocket_api.async_response
async def ws_get_performance(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Fetch performance data on demand for one or more portfolios.

    Single portfolio: pass `entry_id` + `portfolio_id` (or just `entry_id`
    if the account only has one portfolio).
    Aggregated: pass `entry_id` + `portfolio_ids` (list).
    """
    if msg.get("portfolio_id") == "combined_accounts":
        try:
            data = await _async_get_combined_performance(
                hass, msg["interval"], msg["entry_id"]
            )
        except CombinedUnavailableError as err:
            connection.send_error(msg["id"], err.code, str(err))
            return
        except ParqetRateLimitError as err:
            _send_rate_limit_error(connection, msg, err)
            return
        except ParqetApiError:
            connection.send_error(
                msg["id"], "api_error", "Failed to fetch combined performance data"
            )
            return
        connection.send_result(msg["id"], data)
        return

    runtime = _resolve_runtime(hass, connection, msg)
    if runtime is None:
        return

    requested_ids: list[str] = msg.get("portfolio_ids") or []
    if not requested_ids:
        single = msg.get("portfolio_id")
        if single is not None:
            requested_ids = [single]
        elif len(runtime.coordinators) == 1:
            requested_ids = list(runtime.coordinators.keys())
        else:
            connection.send_error(
                msg["id"],
                "invalid_portfolio",
                "portfolio_id or portfolio_ids is required for accounts with "
                "more than one portfolio",
            )
            return

    unknown = [pid for pid in requested_ids if pid not in runtime.coordinators]
    if unknown:
        connection.send_error(
            msg["id"],
            "invalid_portfolio",
            f"Unknown portfolio_id(s): {unknown}",
        )
        return

    try:
        data = await runtime.api.async_get_performance(
            requested_ids, msg["interval"]
        )
    except ParqetRateLimitError as err:
        _send_rate_limit_error(connection, msg, err)
        return
    except ParqetApiError:
        connection.send_error(
            msg["id"], "api_error", "Failed to fetch performance data"
        )
        return

    connection.send_result(msg["id"], data)


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "parqet/frontend_diagnostics",
    }
)
@websocket_api.async_response
async def ws_get_frontend_diagnostics(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Return frontend registration diagnostics for debugging card loading."""
    from .frontend import CARD_JS_PATH, CARD_JS_URL, _read_manifest_version

    version = await hass.async_add_executor_job(_read_manifest_version)
    js_exists = await hass.async_add_executor_job(CARD_JS_PATH.exists)

    # hass.data["lovelace"] may be a dict or a dataclass depending on HA version.
    lovelace_info: dict[str, Any] = {"available": False}
    lovelace = hass.data.get("lovelace")
    if lovelace:
        lovelace_info["available"] = True
        if isinstance(lovelace, dict):
            lovelace_info["mode"] = lovelace.get("mode")
        else:
            lovelace_info["mode"] = getattr(lovelace, "resource_mode", None) or getattr(lovelace, "mode", None)
        resources = lovelace.get("resources") if isinstance(lovelace, dict) else getattr(lovelace, "resources", None)
        if resources and hasattr(resources, "async_items"):
            try:
                all_items = list(resources.async_items())
                parqet_resources = [
                    {
                        "id": i.get("id"),
                        "url": i.get("url"),
                        "type": i.get("res_type"),
                    }
                    for i in all_items
                    if CARD_JS_URL in i.get("url", "")
                ]
                lovelace_info["total_resources"] = len(all_items)
                lovelace_info["parqet_resources"] = parqet_resources
            except Exception as exc:
                lovelace_info["error"] = str(exc)

    entries = [
        {
            "entry_id": e.entry_id,
            "title": e.title,
            "state": str(e.state),
        }
        for e in hass.config_entries.async_entries(DOMAIN)
    ]

    result = {
        "version": version,
        "js_path": str(CARD_JS_PATH),
        "js_exists": js_exists,
        "js_url": CARD_JS_URL,
        "lovelace": lovelace_info,
        "config_entries": entries,
    }

    _LOGGER.debug("Frontend diagnostics: %s", result)
    connection.send_result(msg["id"], result)

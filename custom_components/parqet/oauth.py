"""OAuth2 implementation with PKCE for Parqet (public client, no secret)."""

from __future__ import annotations

import base64
import hashlib
import secrets
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.config_entry_oauth2_flow import (
    LocalOAuth2Implementation,
)

PKCE_DATA_KEY = "parqet_pkce"


class ParqetOAuth2Implementation(LocalOAuth2Implementation):
    """OAuth2 implementation with PKCE for Parqet's public client flow."""

    def __init__(
        self,
        hass: HomeAssistant,
        domain: str,
        client_id: str,
        authorize_url: str,
        token_url: str,
    ) -> None:
        """Initialize with no client_secret (public PKCE client)."""
        super().__init__(
            hass,
            domain,
            client_id,
            client_secret="",
            authorize_url=authorize_url,
            token_url=token_url,
        )
        # Public PKCE clients must not send client_secret in token requests.
        # Base class sends it when not None; override to None after init.
        self.client_secret = None  # type: ignore[assignment]

    async def async_generate_authorize_url(self, flow_id: str) -> str:
        """Generate authorize URL with PKCE code_challenge."""
        code_verifier = secrets.token_urlsafe(64)

        digest = hashlib.sha256(code_verifier.encode("ascii")).digest()
        code_challenge = (
            base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")
        )

        # Store verifier for token exchange.
        self.hass.data.setdefault(PKCE_DATA_KEY, {})[flow_id] = code_verifier

        url = await super().async_generate_authorize_url(flow_id)

        # Append PKCE parameters.
        separator = "&" if "?" in url else "?"
        return (
            f"{url}{separator}"
            f"code_challenge={code_challenge}"
            f"&code_challenge_method=S256"
        )

    async def async_resolve_external_data(self, external_data: Any) -> dict:
        """Resolve auth code to tokens, including PKCE code_verifier."""
        flow_id = external_data["state"]["flow_id"]
        code_verifier = self.hass.data.get(PKCE_DATA_KEY, {}).pop(flow_id, "")

        return await self._token_request(
            {
                "grant_type": "authorization_code",
                "code": external_data["code"],
                "redirect_uri": external_data["state"]["redirect_uri"],
                "code_verifier": code_verifier,
            }
        )

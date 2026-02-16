"""Global app state — module-level singleton for tenant config."""

from __future__ import annotations

from typing import Any

_tenant_config: dict[str, Any] | None = None
_tenant_id: str | None = None
_bot_id: str | None = None
_resolved_integrations: dict[str, dict[str, str]] | None = None


def init_tenant(config: dict[str, Any]) -> None:
    """Store loaded tenant config. Called once at startup."""
    global _tenant_config, _tenant_id, _bot_id
    _tenant_config = config
    _tenant_id = config["tenant_id"]
    _bot_id = config["bot_id"]


def set_integrations(integrations: dict[str, dict[str, str]]) -> None:
    """Store resolved integration credentials. Called once at startup."""
    global _resolved_integrations
    _resolved_integrations = integrations


def get_current_tenant() -> dict[str, Any]:
    """Return the tenant config loaded at startup.

    Raises RuntimeError if init_tenant() was never called.
    """
    if _tenant_config is None:
        raise RuntimeError("Tenant config not initialised — call init_tenant() first")
    return _tenant_config


def get_tenant_id() -> str:
    """Return the current tenant_id (e.g. 'vojd')."""
    if _tenant_id is None:
        raise RuntimeError("Tenant config not initialised — call init_tenant() first")
    return _tenant_id


def get_bot_id() -> str:
    """Return the bot identifier for this tenant (e.g. 'hound_vojd')."""
    if _bot_id is None:
        raise RuntimeError("Tenant config not initialised — call init_tenant() first")
    return _bot_id


def get_integrations() -> dict[str, dict[str, str]]:
    """Return resolved integration parameters.

    Returns an empty dict if set_integrations() was never called
    (e.g. all integrations are disabled).
    """
    if _resolved_integrations is None:
        return {}
    return _resolved_integrations


def get_catalog_items() -> list[dict]:
    """Return tenant catalog items or an empty list.

    If the tenant config has no ``catalog`` section or it is disabled,
    this returns an empty list.
    """
    cfg = get_current_tenant()
    catalog = cfg.get("catalog")
    if not isinstance(catalog, dict):
        return []
    if not catalog.get("enabled"):
        return []

    items = catalog.get("items") or []
    if not isinstance(items, list):
        return []

    return [item for item in items if isinstance(item, dict)]

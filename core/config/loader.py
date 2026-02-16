"""Tenant config loader.

Reads tenants/<TENANT_ID>.yaml relative to the project root
(resolved via __file__, not cwd) and validates required keys.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import yaml

# Project root = three levels up from this file (core/config/loader.py → root)
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
_TENANTS_DIR = _PROJECT_ROOT / "tenants"

_REQUIRED_KEYS: list[tuple[str, ...]] = [
    ("tenant_id",),
    ("bot_id",),
    ("brand", "name"),
    ("features",),
    ("integrations",),
]


def get_tenant_id() -> str:
    """Return current tenant id from env or default 'vojd'."""
    return os.getenv("TENANT_ID", "vojd")


def load_tenant_config(tenant_id: str) -> dict[str, Any]:
    """Load and validate tenant YAML config.

    Raises
    ------
    FileNotFoundError
        If the YAML file for the given tenant_id does not exist.
    ValueError
        If validation fails (id mismatch, missing keys, or bad integration structure).
    """
    config_path = _TENANTS_DIR / f"{tenant_id}.yaml"

    if not config_path.is_file():
        raise FileNotFoundError(
            f"Tenant config not found: {config_path}  "
            f"(TENANT_ID={tenant_id!r})"
        )

    with open(config_path, encoding="utf-8") as fh:
        data: dict[str, Any] = yaml.safe_load(fh)

    if not isinstance(data, dict):
        raise ValueError(f"Tenant config must be a YAML mapping, got {type(data)}")

    # --- validate tenant_id match ---
    if data.get("tenant_id") != tenant_id:
        raise ValueError(
            f"tenant_id inside YAML ({data.get('tenant_id')!r}) "
            f"does not match requested ({tenant_id!r})"
        )

    # --- validate required keys ---
    for key_path in _REQUIRED_KEYS:
        node: Any = data
        for part in key_path:
            if not isinstance(node, dict) or part not in node:
                dotted = ".".join(key_path)
                raise ValueError(
                    f"Missing required key '{dotted}' in {config_path}"
                )
            node = node[part]

    # --- validate integration structure ---
    for name, block in data.get("integrations", {}).items():
        if not isinstance(block, dict):
            raise ValueError(
                f"integrations.{name} must be a mapping in {config_path}"
            )
        if block.get("enabled") and not isinstance(block.get("env"), dict):
            raise ValueError(
                f"integrations.{name}.env must be a mapping when enabled=true "
                f"in {config_path}"
            )

    return data


def resolve_integration_env(cfg: dict[str, Any]) -> dict[str, dict[str, str]]:
    """Resolve integration env-variable references to actual values.

    For each integration in *cfg['integrations']*:
    - If ``enabled`` is falsy → return an empty dict for that integration.
    - If ``enabled`` is truthy → look up every value in ``env`` sub-dict
      from ``os.environ``.  A missing env variable raises ``ValueError``
      with a clear message.

    Returns
    -------
    dict[str, dict[str, str]]
        e.g. ``{"alfacrm": {"email": "val", "api_key": "val", "branch_id": "1"}}``
    """
    result: dict[str, dict[str, str]] = {}
    for name, block in cfg.get("integrations", {}).items():
        if not block.get("enabled"):
            result[name] = {}
            continue

        env_map: dict[str, str] = block.get("env", {})
        resolved: dict[str, str] = {}
        for param, env_var in env_map.items():
            value = os.environ.get(env_var)
            if value is None:
                raise ValueError(
                    f"Integration '{name}' is enabled but env variable "
                    f"'{env_var}' (for param '{param}') is not set"
                )
            resolved[param] = value
        result[name] = resolved

    return result


def get_tenant_config() -> dict[str, Any]:
    """Shortcut: load config for the current TENANT_ID."""
    return load_tenant_config(get_tenant_id())

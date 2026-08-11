"""Role -> model routing and cost accounting.

Nothing in `core/` names a model string. Code asks the router for a role — `judge_open`,
`chat`, `batch` — and gets back a `ModelSpec`. That indirection is what lets the cost
policy live in `config/models.yaml`, and what makes "which model produced this verdict"
a recorded fact rather than an inference from the date.
"""
from __future__ import annotations

import pathlib
from dataclasses import dataclass

import yaml

CONFIG = pathlib.Path(__file__).resolve().parents[4] / "config" / "models.yaml"


class RoutingError(RuntimeError):
    """Unknown role, unknown model, or a price missing from the table."""


@dataclass(frozen=True)
class ModelSpec:
    role: str
    model: str
    effort: str
    max_tokens: int
    usd_in_per_mtok: float
    usd_out_per_mtok: float
    #: Unset by default. "Temperature 0" is not what makes a grader reproducible, and
    #: the gpt-5 reasoning family rejects it outright. Set it per role only if you have
    #: a reason and the model accepts it.
    temperature: float | None = None

    def cost_usd(self, input_tokens: int, output_tokens: int,
                 cache_read_tokens: int = 0) -> float:
        """`input_tokens` is the UNCACHED remainder; cached reads are billed separately.

        The 0.1x multiplier is not an approximation: across the whole gpt-5 line the
        cached-input price is exactly a tenth of the input price. If a future model
        breaks that ratio, this is the line that has to grow a `usd_cached_per_mtok`
        field, and the symptom will be cost reports that are quietly wrong rather than
        anything failing.
        """
        usd = (input_tokens / 1e6) * self.usd_in_per_mtok
        usd += (output_tokens / 1e6) * self.usd_out_per_mtok
        usd += (cache_read_tokens / 1e6) * self.usd_in_per_mtok * 0.1
        return usd


class Router:
    def __init__(self, path: pathlib.Path | str | None = None) -> None:
        self.path = pathlib.Path(path) if path else CONFIG
        raw = yaml.safe_load(self.path.read_text(encoding="utf-8")) or {}
        self.version = raw.get("version", 0)
        self._roles: dict[str, dict] = raw.get("roles", {}) or {}
        self._prices: dict[str, dict] = raw.get("prices", {}) or {}

    def roles(self) -> list[str]:
        return sorted(self._roles)

    def spec(self, role: str, *, model: str | None = None) -> ModelSpec:
        """`model` overrides the configured choice — that is how the bake-off in the
        concordance harness runs the same gold set through two models without editing
        the config that production reads."""
        cfg = self._roles.get(role)
        if cfg is None:
            raise RoutingError(f"unknown role {role!r}; known: {', '.join(self.roles())}")
        name = model or cfg["model"]
        price = self._prices.get(name)
        if price is None:
            raise RoutingError(
                f"no price for model {name!r}: add it to {self.path.name} or cost "
                "reports will silently read as zero"
            )
        t = cfg.get("temperature")
        return ModelSpec(
            role=role,
            model=name,
            effort=cfg.get("effort", "medium"),
            max_tokens=int(cfg.get("max_tokens", 1024)),
            usd_in_per_mtok=float(price["input"]),
            usd_out_per_mtok=float(price["output"]),
            temperature=None if t is None else float(t),
        )

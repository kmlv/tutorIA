"""The gold set: student answers, what a human said about them, and what the judge said.

Three separate opinions live on each item and they are never merged:

- `intent` — what the answer was WRITTEN to display. Generated with the answer. It is a
  property of the fixture, not evidence about anything, and it is never shown to the
  human labeller. Showing it would anchor them, and then "the judge agrees with
  Kristian" would quietly mean "the judge agrees with whoever wrote the fixture".
- `human` — Kristian's label. **This is the ground truth and the only thing the M3 gate
  is measured against.**
- the judge's verdict, which lives in a run file under `evals/runs/`, keyed by item id,
  so the same gold set can be scored by several models without re-labelling anything.

Keeping `intent` around anyway is what lets the report say something the gate cannot:
where Kristian disagrees with the intent, the fixture is ambiguous, and disagreement
there is not the judge's fault.

JSONL because it is append-friendly, diffable in git, and readable when something goes
wrong at two in the morning.
"""
from __future__ import annotations

import json
import pathlib
from dataclasses import asdict, dataclass, field

GOLD_DIR = pathlib.Path(__file__).resolve().parent / "gold"
RUNS_DIR = pathlib.Path(__file__).resolve().parent / "runs"


@dataclass
class Human:
    """One human judgement. `key_points` maps rubric id -> present."""

    key_points: dict[str, bool]
    misconception: str  # a catalogue id, or NINGUNA / FUERA_DE_CATALOGO
    note: str = ""
    labelled_at: str = ""
    labeller: str = "kristian"

    @property
    def correcta(self) -> bool | None:
        """Left to the caller: correctness needs the pack to know which points are
        essential, and this module deliberately knows nothing about packs."""
        return None


@dataclass
class GoldItem:
    id: str
    question_id: str
    lang: str
    answer: str
    #: `synthetic` = written for this gold set. `student` = produced by a real student.
    #: The distinction is load-bearing and must survive into the report: a judge that
    #: agrees with Kristian on prose I wrote has not been shown to work on prose a
    #: nineteen-year-old wrote at midnight.
    source: str = "synthetic"
    intent: dict = field(default_factory=dict)
    human: dict | None = None

    @property
    def labelled(self) -> bool:
        return self.human is not None


def load(path: pathlib.Path | str) -> list[GoldItem]:
    p = pathlib.Path(path)
    if not p.is_file():
        return []
    out = []
    for line in p.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line:
            out.append(GoldItem(**json.loads(line)))
    return out


def save(items: list[GoldItem], path: pathlib.Path | str) -> None:
    """Rewrites the whole file. At gold-set scale that is cheaper than being clever,
    and it means a half-written append can never leave a corrupt line behind."""
    p = pathlib.Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    tmp = p.with_suffix(p.suffix + ".tmp")
    tmp.write_text(
        "".join(json.dumps(asdict(i), ensure_ascii=False) + "\n" for i in items),
        encoding="utf-8",
    )
    tmp.replace(p)


def default_path(pack_id: str) -> pathlib.Path:
    return GOLD_DIR / f"{pack_id}.jsonl"

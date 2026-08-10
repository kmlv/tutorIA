"""Acceso a SQLite. Es la única costura que toca el motor de base de datos.

Migrar a Postgres debe ser cambiar este archivo y nada de `core/`. Por eso aquí no hay
lógica pedagógica y el SQL es explícito, sin ORM.
"""
from __future__ import annotations

import json
import pathlib
import sqlite3
import uuid
from datetime import datetime, timezone

SCHEMA = pathlib.Path(__file__).with_name("schema.sql")
DEFAULT_DB = pathlib.Path(__file__).resolve().parents[3] / "data" / "tutoria.sqlite"

LOCAL_STUDENT = "local-default"


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def new_id() -> str:
    return uuid.uuid4().hex


class Repo:
    def __init__(self, path: pathlib.Path | str | None = None) -> None:
        self.path = pathlib.Path(path) if path else DEFAULT_DB
        if self.path != pathlib.Path(":memory:"):
            self.path.parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(str(self.path), check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self.migrate()

    def migrate(self) -> None:
        self.conn.executescript(SCHEMA.read_text(encoding="utf-8"))
        self.conn.commit()

    def close(self) -> None:
        self.conn.close()

    # ---- estudiantes -------------------------------------------------------
    def ensure_student(self, student_id: str = LOCAL_STUDENT, lang: str = "es") -> str:
        """El PoC usa un único estudiante local. Pasar a multi-estudiante es dejar de
        pasar el default: cero cambios de esquema (PLAN §7)."""
        self.conn.execute(
            "INSERT OR IGNORE INTO students (id, lang, created_at) VALUES (?, ?, ?)",
            (student_id, lang, now()),
        )
        self.conn.commit()
        return student_id

    # ---- sesiones ----------------------------------------------------------
    def create_session(self, *, concept_id: str, pack_version: str, lang: str,
                       student_id: str = LOCAL_STUDENT, media_variant: str = "A") -> str:
        self.ensure_student(student_id, lang)
        sid = new_id()
        self.conn.execute(
            "INSERT INTO sessions (id, student_id, concept_id, pack_version, "
            "media_variant, lang, phase, started_at) VALUES (?,?,?,?,?,?,?,?)",
            (sid, student_id, concept_id, pack_version, media_variant, lang,
             "delivery.playing", now()),
        )
        self.conn.commit()
        self.append_event(sid, "session.started",
                          {"concept_id": concept_id, "lang": lang,
                           "media_variant": media_variant})
        return sid

    def get_session(self, session_id: str) -> sqlite3.Row | None:
        return self.conn.execute(
            "SELECT * FROM sessions WHERE id = ?", (session_id,)
        ).fetchone()

    def set_phase(self, session_id: str, phase: str) -> None:
        self.conn.execute("UPDATE sessions SET phase = ? WHERE id = ?", (phase, session_id))
        self.conn.commit()
        self.append_event(session_id, "phase.changed", {"phase": phase})

    # ---- eventos (append-only) --------------------------------------------
    def append_event(self, session_id: str, type_: str, payload: dict | None = None) -> int:
        row = self.conn.execute(
            "SELECT COALESCE(MAX(seq), 0) + 1 AS n FROM events WHERE session_id = ?",
            (session_id,),
        ).fetchone()
        seq = row["n"]
        self.conn.execute(
            "INSERT INTO events (session_id, seq, ts, type, payload) VALUES (?,?,?,?,?)",
            (session_id, seq, now(), type_, json.dumps(payload or {}, ensure_ascii=False)),
        )
        self.conn.commit()
        return seq

    def events(self, session_id: str) -> list[sqlite3.Row]:
        return self.conn.execute(
            "SELECT * FROM events WHERE session_id = ? ORDER BY seq", (session_id,)
        ).fetchall()

    # ---- mastery -----------------------------------------------------------
    def get_mastery(self, student_id: str, concept_id: str) -> dict[str, sqlite3.Row]:
        rows = self.conn.execute(
            "SELECT * FROM mastery WHERE student_id = ? AND concept_id = ?",
            (student_id, concept_id),
        ).fetchall()
        return {r["subskill_id"]: r for r in rows}

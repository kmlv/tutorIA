"""Acceso a SQLite. Es la única costura que toca el motor de base de datos.

Migrar a Postgres debe ser cambiar este archivo y nada de `core/`. Por eso aquí no hay
lógica pedagógica y el SQL es explícito, sin ORM.

**CONCURRENCIA — el bug que costó tres bases de datos corruptas.**

`check_same_thread=False` desactiva la única red de seguridad que trae `sqlite3`: la
comprobación de que una conexión se usa desde el hilo que la creó. Sin nada que ocupe su
lugar, eso no es una relajación, es una invitación al desastre — y FastAPI la acepta,
porque un endpoint declarado con `def` (no `async def`) corre en el *thread pool* de
Starlette. O sea que dos peticiones simultáneas del navegador usan LA MISMA conexión
desde hilos distintos, a la vez.

El síntoma fue `database disk image is malformed`, tres veces, y me costó dos hipótesis
equivocadas: culpé a `/tmp` y después al reloader de uvicorn. Ninguna era. La pista que
lo delató: una tanda de `curl` secuenciales pasaba siempre, y el navegador —que dispara
varias peticiones a la vez— la rompía siempre.

La corrección es un `RLock` que serializa TODO acceso a la conexión. Reentrante porque
algunos métodos llaman a otros que también toman el lock. Para el PoC el costo es nulo:
un alumno, escrituras diminutas. Cuando haya concurrencia real, la salida es una
conexión por hilo (`threading.local`) o Postgres, y esta clase sigue siendo la única
que hay que tocar.
"""
from __future__ import annotations

import json
import pathlib
import sqlite3
import threading
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
        # Reentrante: `create_session` llama a `ensure_student` y a `append_event`, y
        # ambos vuelven a tomarlo. Con un `Lock` normal eso se autobloquea.
        self._lock = threading.RLock()
        self.conn = sqlite3.connect(str(self.path), check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self.migrate()

    def migrate(self) -> None:
        with self._lock:
            self.conn.executescript(SCHEMA.read_text(encoding="utf-8"))
            # `CREATE TABLE IF NOT EXISTS` no añade columnas a una tabla que ya existe, así
            # que una base creada antes de M3 se quedaría sin `shadow` y sin `cost_usd`, y
            # el INSERT fallaría en runtime con la BD local de Kristian y no en los tests.
            self._ensure_column("answers", "cost_usd", "REAL")
            self._ensure_column("answers", "shadow", "INTEGER NOT NULL DEFAULT 0")
            self.conn.commit()

    def _ensure_column(self, table: str, column: str, decl: str) -> None:
        cols = {r["name"] for r in self.conn.execute(f"PRAGMA table_info({table})")}
        if column not in cols:
            self.conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {decl}")

    def close(self) -> None:
        with self._lock:
            self.conn.close()

    # ---- estudiantes -------------------------------------------------------
    def ensure_student(self, student_id: str = LOCAL_STUDENT, lang: str = "es") -> str:
        """El PoC usa un único estudiante local. Pasar a multi-estudiante es dejar de
        pasar el default: cero cambios de esquema (PLAN §7)."""
        with self._lock:
            self.conn.execute(
                "INSERT OR IGNORE INTO students (id, lang, created_at) VALUES (?, ?, ?)",
                (student_id, lang, now()),
            )
            self.conn.commit()
            return student_id

    # ---- sesiones ----------------------------------------------------------
    def create_session(self, *, concept_id: str, pack_version: str, lang: str,
                       student_id: str = LOCAL_STUDENT, media_variant: str = "A") -> str:
        with self._lock:
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
        with self._lock:
            return self.conn.execute(
                "SELECT * FROM sessions WHERE id = ?", (session_id,)
            ).fetchone()

    def set_phase(self, session_id: str, phase: str) -> None:
        with self._lock:
            self.conn.execute("UPDATE sessions SET phase = ? WHERE id = ?", (phase, session_id))
            self.conn.commit()
            self.append_event(session_id, "phase.changed", {"phase": phase})

    # ---- eventos (append-only) --------------------------------------------
    def append_event(self, session_id: str, type_: str, payload: dict | None = None) -> int:
        with self._lock:
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
        with self._lock:
            return self.conn.execute(
                "SELECT * FROM events WHERE session_id = ? ORDER BY seq", (session_id,)
            ).fetchall()

    # ---- mastery -----------------------------------------------------------
    def get_mastery(self, student_id: str, concept_id: str) -> dict[str, sqlite3.Row]:
        with self._lock:
            rows = self.conn.execute(
                "SELECT * FROM mastery WHERE student_id = ? AND concept_id = ?",
                (student_id, concept_id),
            ).fetchall()
            return {r["subskill_id"]: r for r in rows}

    def save_mastery(self, student_id: str, concept_id: str, states: dict) -> None:
        """Cachea el estado calculado. La VERDAD sigue siendo `answers`: `core.mastery`
        recalcula desde cero cada vez, y esta tabla existe para que un panel de
        instructor no tenga que recorrer el log. Si las dos discrepan, manda `answers` —
        por eso el upsert nunca lee lo que ya había."""
        with self._lock:
            for sid, st in states.items():
                self.conn.execute(
                    "INSERT INTO mastery (student_id, concept_id, subskill_id, p_mastery, "
                    "evidence_count, modalities, streak_correct, sin_andamiaje, attempts, "
                    "status, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?) "
                    "ON CONFLICT(student_id, concept_id, subskill_id) DO UPDATE SET "
                    "p_mastery=excluded.p_mastery, evidence_count=excluded.evidence_count, "
                    "modalities=excluded.modalities, streak_correct=excluded.streak_correct, "
                    "sin_andamiaje=excluded.sin_andamiaje, attempts=excluded.attempts, "
                    "status=excluded.status, updated_at=excluded.updated_at",
                    (student_id, concept_id, sid, st.p_mastery, st.correct,
                     json.dumps(sorted(st.streak_modalities)), st.streak,
                     st.streak_unscaffolded, st.attempts, st.status, now()),
                )
            self.conn.commit()

    # ---- chat --------------------------------------------------------------
    def record_chat(self, *, session_id: str, role: str, content: str, phase: str,
                    model: str | None = None, tokens_in: int | None = None,
                    tokens_out: int | None = None) -> None:
        with self._lock:
            self.conn.execute(
                "INSERT INTO chat_messages (session_id, role, content, phase, model, "
                "tokens_in, tokens_out, created_at) VALUES (?,?,?,?,?,?,?,?)",
                (session_id, role, content, phase, model, tokens_in, tokens_out, now()),
            )
            self.conn.commit()

    def chat(self, session_id: str) -> list[sqlite3.Row]:
        with self._lock:
            return self.conn.execute(
                "SELECT * FROM chat_messages WHERE session_id = ? ORDER BY id", (session_id,)
            ).fetchall()

    def chat_turns(self, session_id: str) -> int:
        """Turnos del ALUMNO. El presupuesto de preguntas es suyo; contar tambien las
        respuestas del tutor lo reduciria a la mitad sin decirselo a nadie."""
        with self._lock:
            return self.conn.execute(
                "SELECT COUNT(*) AS n FROM chat_messages WHERE session_id = ? AND role = ?",
                (session_id, "user"),
            ).fetchone()["n"]

    # ---- remediaciones -----------------------------------------------------
    def record_remediation(self, *, session_id: str, subskill_id: str,
                           action_type: str, trigger_rule: str) -> None:
        """`trigger_rule` es una columna y no una nota: una política que no puede
        explicar por qué hizo algo no se puede depurar ni defender ante un instructor
        que no esté de acuerdo."""
        with self._lock:
            self.conn.execute(
                "INSERT INTO remediations (session_id, subskill_id, action_type, "
                "trigger_rule, created_at) VALUES (?,?,?,?,?)",
                (session_id, subskill_id, action_type, trigger_rule, now()),
            )
            self.conn.commit()

    def remediations(self, session_id: str) -> list[sqlite3.Row]:
        with self._lock:
            return self.conn.execute(
                "SELECT * FROM remediations WHERE session_id = ? ORDER BY id", (session_id,)
            ).fetchall()

    def flag(self, *, student_id: str, session_id: str, subskill_id: str, reason: str,
             misconception_id: str | None = None) -> None:
        """Sólo una vez por (alumno, sub-skill, motivo) mientras siga sin resolver: la
        bandeja del instructor pierde su valor si la misma señal aparece diez veces."""
        with self._lock:
            dup = self.conn.execute(
                "SELECT 1 FROM flags WHERE student_id=? AND subskill_id=? AND reason=? "
                "AND resolved=0", (student_id, subskill_id, reason),
            ).fetchone()
            if dup:
                return
            self.conn.execute(
                "INSERT INTO flags (student_id, session_id, subskill_id, reason, "
                "misconception_id, created_at) VALUES (?,?,?,?,?,?)",
                (student_id, session_id, subskill_id, reason, misconception_id, now()),
            )
            self.conn.commit()

    def flags(self, student_id: str) -> list[sqlite3.Row]:
        with self._lock:
            return self.conn.execute(
                "SELECT * FROM flags WHERE student_id = ? ORDER BY id", (student_id,)
            ).fetchall()

    # ---- respuestas --------------------------------------------------------
    def record_answer(self, *, session_id: str, question_id: str, modalidad: str,
                      raw_answer: object, grader: str, score: float,
                      misconception_id: str | None = None,
                      con_andamiaje: bool = False, judge_json: str | None = None,
                      model: str | None = None, prompt_version: str | None = None,
                      latency_ms: int | None = None, cost_usd: float | None = None,
                      shadow: bool = False) -> int:
        """`model` y `prompt_version` son COLUMNAS, no campos del blob: cuando se cambie
        de modelo hay que poder saber qué diagnósticos vinieron de cuál, o los datos
        históricos dejan de ser comparables."""
        with self._lock:
            row = self.conn.execute(
                "SELECT COALESCE(MAX(attempt), 0) + 1 AS n FROM answers "
                "WHERE session_id = ? AND question_id = ?", (session_id, question_id),
            ).fetchone()
            self.conn.execute(
                "INSERT INTO answers (session_id, question_id, attempt, modalidad, raw_answer, "
                "grader, score, misconception_id, con_andamiaje, judge_json, model, "
                "prompt_version, latency_ms, cost_usd, shadow, created_at) "
                "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                (session_id, question_id, row["n"], modalidad,
                 json.dumps(raw_answer, ensure_ascii=False), grader, score, misconception_id,
                 1 if con_andamiaje else 0, judge_json, model, prompt_version, latency_ms,
                 cost_usd, 1 if shadow else 0, now()),
            )
            self.conn.commit()
            return row["n"]

    def evidence(self, session_id: str) -> list[sqlite3.Row]:
        """Las respuestas que SÍ cuentan para dominio. En modo sombra el juez escribe en
        `answers` pero nunca aparece aquí; ese es todo el mecanismo."""
        with self._lock:
            return self.conn.execute(
                "SELECT * FROM answers WHERE session_id = ? AND shadow = 0 ORDER BY id",
                (session_id,),
            ).fetchall()

    def answers(self, session_id: str) -> list[sqlite3.Row]:
        with self._lock:
            return self.conn.execute(
                "SELECT * FROM answers WHERE session_id = ? ORDER BY id", (session_id,)
            ).fetchall()

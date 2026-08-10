-- Esquema del PoC (PLAN §7).
--
-- Tipos deliberadamente portables (TEXT/REAL/INTEGER, JSON como TEXT) para que la
-- migracion a Postgres sea un cambio de driver en repo.py y no una reescritura.
--
-- REGLA DURA (C15): tutorIA NUNCA almacena credenciales. `external_auth_id` reserva el
-- mapeo al sistema de identidad del destino (InteractiveEduHub es Django: auth_user.id).
-- Nada de hashes de password: seria deuda de seguridad y de migracion a la vez.

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS students (
  id                TEXT PRIMARY KEY,
  external_auth_id  TEXT UNIQUE,
  display_name      TEXT,
  lang              TEXT NOT NULL DEFAULT 'es',
  created_at        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id             TEXT PRIMARY KEY,
  student_id     TEXT NOT NULL REFERENCES students(id),
  concept_id     TEXT NOT NULL,
  pack_version   TEXT NOT NULL,
  media_variant  TEXT NOT NULL DEFAULT 'A',   -- habilita correr el bake-off con usuarios reales
  lang           TEXT NOT NULL,
  phase          TEXT NOT NULL,
  started_at     TEXT NOT NULL,
  ended_at       TEXT,
  outcome        TEXT                          -- provisional_mastery|budget_exhausted|indeterminate
);
CREATE INDEX IF NOT EXISTS idx_sessions_student ON sessions(student_id);

-- APPEND-ONLY. Es lo que permite reproducir una sesion y re-correr un juez distinto
-- sobre los mismos datos: da gratis el bake-off de jueces y permite mejorar el juez
-- sin volver a molestar a estudiantes reales (PLAN C13).
CREATE TABLE IF NOT EXISTS events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  TEXT NOT NULL REFERENCES sessions(id),
  seq         INTEGER NOT NULL,
  ts          TEXT NOT NULL,
  type        TEXT NOT NULL,
  payload     TEXT NOT NULL DEFAULT '{}',
  UNIQUE (session_id, seq)
);
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id, seq);

CREATE TABLE IF NOT EXISTS answers (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id        TEXT NOT NULL REFERENCES sessions(id),
  question_id       TEXT NOT NULL,
  attempt           INTEGER NOT NULL,
  modalidad         TEXT NOT NULL,
  raw_answer        TEXT NOT NULL,
  grader            TEXT NOT NULL,             -- deterministic | llm
  score             REAL NOT NULL,
  misconception_id  TEXT,
  con_andamiaje     INTEGER NOT NULL DEFAULT 0, -- 1 si hubo pista/feedback/ayuda en ese turno
  judge_json        TEXT,                       -- salida integra del LLM, para auditoria
  model             TEXT,                       -- columnas, NO enterradas en el blob:
  prompt_version    TEXT,                       -- sin esto los datos historicos no son comparables
  latency_ms        INTEGER,
  created_at        TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_answers_session ON answers(session_id);

CREATE TABLE IF NOT EXISTS mastery (
  student_id        TEXT NOT NULL REFERENCES students(id),
  concept_id        TEXT NOT NULL,
  subskill_id       TEXT NOT NULL,
  p_mastery         REAL NOT NULL DEFAULT 0,
  evidence_count    INTEGER NOT NULL DEFAULT 0,
  modalities        TEXT NOT NULL DEFAULT '[]',
  streak_correct    INTEGER NOT NULL DEFAULT 0,
  sin_andamiaje     INTEGER NOT NULL DEFAULT 0,
  attempts          INTEGER NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'unseen',
  updated_at        TEXT NOT NULL,
  PRIMARY KEY (student_id, concept_id, subskill_id)
);

CREATE TABLE IF NOT EXISTS flags (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id        TEXT NOT NULL REFERENCES students(id),
  session_id        TEXT NOT NULL REFERENCES sessions(id),
  subskill_id       TEXT NOT NULL,
  reason            TEXT NOT NULL,
  misconception_id  TEXT,
  resolved          INTEGER NOT NULL DEFAULT 0,
  created_at        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS remediations (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id     TEXT NOT NULL REFERENCES sessions(id),
  subskill_id    TEXT NOT NULL,
  action_type    TEXT NOT NULL,   -- socratica|otra_representacion|bajar_dificultad|revision_humana
  trigger_rule   TEXT NOT NULL,   -- R1..R4, para que la politica sea auditable
  created_at     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id   TEXT NOT NULL REFERENCES sessions(id),
  role         TEXT NOT NULL,
  content      TEXT NOT NULL,
  phase        TEXT NOT NULL,
  model        TEXT,
  tokens_in    INTEGER,
  tokens_out   INTEGER,           -- costo por rol auditable (decision 17)
  created_at   TEXT NOT NULL
);

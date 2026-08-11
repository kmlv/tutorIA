"""The regression test for the bug that corrupted three databases.

`Repo` opens SQLite with `check_same_thread=False`, and FastAPI runs every `def`
endpoint in Starlette's thread pool. So two simultaneous browser requests use the SAME
connection from different threads, at the same time — which is how you get
`database disk image is malformed`.

The reason it took three tries to find: a sequential run of `curl` never reproduces it.
Only a client that fires concurrent requests does, which is every real browser and no
test that existed before this file.

This test fails loudly on the unlocked version — the assertion that catches it is not
the error count but `PRAGMA integrity_check`, because corruption is silent at write time
and only surfaces on some later read, potentially in a different session.
"""
from __future__ import annotations

import threading

import pytest

from app.server.db.repo import Repo

THREADS = 8
ROUNDS = 60


@pytest.fixture
def repo(tmp_path):
    r = Repo(tmp_path / "conc.sqlite")
    yield r
    r.close()


def test_concurrent_writers_do_not_corrupt_the_database(repo):
    sid = repo.create_session(concept_id="budget-line", pack_version="0.1.0", lang="es")
    errors: list[str] = []

    def worker(n: int) -> None:
        try:
            for i in range(ROUNDS):
                # Interleaved reads and writes across several tables, which is what an
                # endpoint actually does: answer, then recompute mastery from the log.
                repo.append_event(sid, f"t{n}", {"i": i})
                repo.record_answer(
                    session_id=sid, question_id=f"q{n}", modalidad="mcq",
                    raw_answer=i, grader="deterministic", score=1.0,
                )
                repo.events(sid)
                repo.evidence(sid)
        except Exception as e:  # noqa: BLE001 - the point is to report anything at all
            errors.append(repr(e))

    threads = [threading.Thread(target=worker, args=(n,)) for n in range(THREADS)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert errors == []
    assert repo.conn.execute("PRAGMA integrity_check").fetchone()[0] == "ok"
    # Nothing lost and nothing duplicated: `append_event` computes the next `seq` with a
    # SELECT and then INSERTs it, which is a read-modify-write and would collide without
    # the lock — the UNIQUE(session_id, seq) constraint would start rejecting rows.
    assert len(repo.events(sid)) == THREADS * ROUNDS + 1   # +1 = session.started
    assert len(repo.answers(sid)) == THREADS * ROUNDS


def test_event_sequence_numbers_stay_dense_and_unique(repo):
    """`seq` is a per-session counter derived with MAX()+1, which is exactly the shape
    that produces duplicates under concurrency. If this ever fails, the append-only log
    — the thing the whole design leans on to replay a session — has holes in it."""
    sid = repo.create_session(concept_id="budget-line", pack_version="0.1.0", lang="es")

    def worker() -> None:
        for _ in range(ROUNDS):
            repo.append_event(sid, "tick", {})

    threads = [threading.Thread(target=worker) for _ in range(THREADS)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    seqs = [r["seq"] for r in repo.events(sid)]
    assert seqs == sorted(seqs)
    assert len(set(seqs)) == len(seqs), "duplicate seq: the log can no longer be replayed"
    assert seqs == list(range(1, len(seqs) + 1)), "gaps in the log"

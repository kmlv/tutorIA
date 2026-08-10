# Open Items For Kristian

Use this file only for decisions or information that agents cannot resolve
without the principal.

## Open

### H-001 — Wake de `fable` bloqueado por sandbox (ISSUE-004)

`coord-pulse.sh --agent fable` falla con exit 124: ningún byte de stdout/stderr en
300s. El hijo `claude -p --model claude-fable-5` hereda la jaula del agente que
lanza el pulse. `codex` y `agy` no se ven afectados: sus wakes funcionaron.

Nota diagnóstica: `claude -p` no hace streaming, así que un run lento pero sano es
indistinguible de uno bloqueado al llegar a los 300s. No está descartado que sea
solo timeout.

**Workaround aplicado en la ronda 1** (autorizado por Kristian): Opus 5 lanzó a
Fable-5 como subagente y posteará su propuesta al thread en nombre de `fable`.
Preserva la ceguera de la ronda 1 pero **no** es un agente CLI independiente.

**Decisión pendiente para rondas 2 y 3**: si `fable` debe participar como agente
CLI de verdad, Kristian tiene que correr el wake desde una Terminal sin sandbox:

    COORD_WAKE_TIMEOUT='600' '/Users/klopezva/.aistigmergy/kit/coord-pulse.sh' \
      '/Users/klopezva/GithubRepos/tutorIA' --agent 'fable' --force --log

Si no, se mantiene el workaround del subagente y se registra esa asimetría en la
decisión final: la voz de `fable` pasó filtrada por Opus 5, la de `codex` y `agy` no.

## Resolved

None.


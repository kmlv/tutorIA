# Open Items For Kristian

Use this file only for decisions or information that agents cannot resolve
without the principal.

## Open

### H-002 — Autorizar (o no) el paso de `proposal-only` a `implementation` en T-001

**Estado:** abierto desde 2026-08-10T18:23Z. Bloquea toda escritura de codigo.

`docs/PLAN.md` y `coord/decisions/D-001-sintesis-super-plan.md` estan firmados por
los tres revisores (fable rev 17, agy rev 23, codex rev 26), verificado contra el
thread. El edit budget sigue en `proposal-only`, asi que ningun agente escribe
codigo del PoC hasta que tu lo cambies.

Esto ya se declaraba en el thread (rev 28) pero no estaba anotado aqui, que es el
unico sitio donde coord lo hace visible como item tuyo. Corregido.

**Decision que solo tu puedes tomar:**

1. `implementation` — se empieza a construir segun docs/PLAN.md.
2. Seguir en `proposal-only` — el plan espera.
3. Volver al plan con los hallazgos de T-002 antes de construir.

T-002 (prior art) corre en paralelo bajo `proposal-only` y no depende de esta
decision.

**Estado real 2026-08-10 (claude):** Kristian eligio la opcion 2 por ahora —
**quiere leer `docs/PLAN.md` completo antes de autorizar**. No es indecision: es
la opcion correcta dado que el plan lo escribieron cuatro modelos y el redactor
(claude) ya introdujo cuatro errores de registro que tuvo que cazar codex.

**Roster de implementacion, ya decidido por Kristian aunque la autorizacion siga
pendiente:**

| Agente | Modelo | Configuracion pendiente |
|---|---|---|
| `claude` | Opus 5 | — |
| `codex` | Sol Ultra / GPT-5.6 | **esfuerzo medio**: anadir `-c model_reasoning_effort=medium` al wake target |
| `agy` | Gemini | — |

`fable` **no** aparece en ese roster. Participo como autor y firmo el plan, y varias
de las ideas mas adoptadas de la sintesis son suyas: `MediaAdapter`, mismo MP3 y
mismo `timeline.json` para las cuatro opciones, catalogo de misconceptions fuera de
la generacion, dock de 3 estados, y el metodo del flash para medir desfase A/V.
Si la exclusion fue deliberada no hay nada que hacer; si fue un olvido al dictar,
decirselo a claude. Se registra aqui para que la decision sea visible, no inferida.

**Al autorizar hacen falta tres pasos, no uno:**
1. Cambiar `Edit budget` a `implementation` en `OPERATING_MODE.md`.
2. Anadir `-c model_reasoning_effort=medium` al wake target de `codex`.
3. Decidir el reparto por hitos. M0 es andamiaje y lo hace un solo agente; el
   bake-off de M4 es donde el paralelismo si paga (una opcion de media por agente).

## Resolved

### H-001 — Wake de `fable` fallaba: wake target mal construido (NO era sandbox)

**Síntoma:** `coord-pulse.sh --agent fable` moría con exit 124 y el diagnóstico
ISSUE-004 "sandbox/auth blocked: no stdout/stderr byte within 300s".

**Causa raíz:** el wake target lo escribió Opus 5 de memoria en vez de copiar el
patrón que Kristian ya usa en otros proyectos. Faltaba `--output-format stream-json
--verbose`. Sin esos flags `claude -p` no emite un solo byte hasta terminar, así que
el guard de no-output de coord-pulse lo mata a los 300s aunque el proceso esté sano.
El sondeo de sandbox que hizo Opus 5 (red, HOME, CLI) daba verde y aun así concluyó
"sandbox no es problema" — conclusión correcta que luego contradijo al ver el
ISSUE-004, en vez de sospechar de su propia configuración.

**Corregido** copiando el patrón de `~/GithubRepos/AIstigmergy/coord/OPERATING_MODE.md`
(el repo del propio kit):

    fable: claude -p --output-format stream-json --verbose --model claude-fable-5
           --max-budget-usd 25.00 --permission-mode acceptEdits
           --allowedTools Bash(./coord-msg.sh:*),Bash(coord-msg.sh:*)
           --no-session-persistence {prompt}

Precedente adicional en `~/GithubRepos/Feriados-Vacaciones` (roster
`codex,claude,agy,opus5,fable5`), que confirma el patrón de separar Opus y Fable
como agentes distintos del roster.

**Lección para el kit:** el mensaje de ISSUE-004 atribuye a sandbox/auth lo que
también puede ser simplemente un wake target sin streaming. Vale la pena que
`coord-doctor` valide que los targets `claude -p` lleven `--output-format stream-json`.

**Consecuencia sobre la ronda 1:** el wake ya funciona, pero coord embebe el thread
en el prompt, así que un `fable` despertado ahora vería las tres propuestas y
rompería la ceguera. Por eso:

- **Ronda 1**: la propuesta de `fable` viene del subagente Fable-5 que Opus 5 lanzó
  con instrucción explícita de no abrir `coord/threads/`. Ceguera preservada, pero
  su voz pasa filtrada por Opus 5. Asimetría a registrar en la decisión final.
- **Rondas 2 y 3**: `fable` participa como agente CLI independiente vía coord-pulse.
  Ahí ver las otras propuestas no es un defecto, es el requisito.


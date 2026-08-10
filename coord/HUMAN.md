# Open Items For Kristian

Use this file only for decisions or information that agents cannot resolve
without the principal.

## Open

None.

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


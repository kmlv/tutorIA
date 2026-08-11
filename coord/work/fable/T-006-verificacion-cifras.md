# T-006 — Verificación adversarial de cifras del informe

- **Agente:** fable
- **Fecha:** 2026-08-10T23:50Z (UTC)
- **Acceso a web:** SÍ (WebSearch + WebFetch; PDFs primarios descargados y leídos)
- **Herramientas:** WebSearch, WebFetch, lectura directa de PDFs (Banco Mundial, AERA Open, EdWorkingPapers), API de documentos del Banco Mundial (texto completo del WP 11125)
- **Postura:** default NO-VERIFICABLE; [verificado] solo con fuente primaria u oficial vista, con URL de la página exacta.

## NOTA ARRIBA DEL TODO

**El informe aguanta la verificación.** Las nueve afirmaciones priorizadas existen en
fuentes primarias y las cifras coinciden, incluida la más contraintuitiva (GenAI no
demostrada superior al adaptativo pre-LLM: 0.022 DE, EE 0.075 — textual en el paper).
Única corrección numérica: el efecto en inglés de Nigeria es **0.23 DE**, no ≈0.24.
No hay ningún error de bulto que cambie la tesis. Un informe generado con ChatGPT que
sale limpio de una verificación adversarial es un resultado, y este salió limpio.

## Tabla de verificación

| # | Afirmación del informe | Veredicto | Cifra real | Fuente (URL de la página) |
|---|---|---|---|---|
| a | Burneo, Dinarte-Diaz, Lopez y Molina (2026), Banco Mundial: metaanálisis de 14 RCT en 10 economías, 191 tamaños de efecto, +0.125 DE vs instrucción tradicional; tutoría/instrucción IA +0.12 DE | **CONFIRMADA** | Textual en el abstract: "191 effect sizes from 14 studies conducted in ten economies… 0.125 sd relative to traditional instruction… Among interventions delivering AI-powered tutoring or instruction, the average effect is 0.12 sd". Es background paper del WDR 2026 (1 ago 2026), no peer-reviewed | [PDF del paper](https://thedocs.worldbank.org/en/doc/2fba81cd6cd60d2f54532fc7062395fb-0050062026/original/Can-EdTech-Close-Learning-Gaps.pdf); listado en [WDR 2026 background papers](https://www.worldbank.org/en/publication/wdr2026/brief/world-development-report-2026-background-papers) |
| b | GenAI NO demostrada superior a tecnología adaptativa pre-LLM: coeficiente 0.022 DE, EE 0.075, no significativo | **CONFIRMADA** | Textual (p. 3–4): "the estimated differential is 0.022 sd with a standard error of 0.075. That interval, spanning [−0.15, 0.19], is wide enough to accommodate an advantage as large as the pooled average effect, so it bounds the difference between generations rather than resolving it… the experimental record to date shows no advantage for the newer technology" | Mismo PDF que (a), sección 1 (Introduction) |
| c | Kestin et al. (2025), Harvard: 194 universitarios, crossover, ≈0.63 DE (ajustado por techo 0.73–1.3), 49 vs 60 min | **CONFIRMADA** | Textual: 194 elegibles de 233; crossover; "linear regression suggests an effect size of 0.63… quantile… 0.73 to 1.3 standard deviations"; mediana 49 min (IA) vs 60 min asumidos (clase) | [Scientific Reports 15:17458](https://www.nature.com/articles/s41598-025-97652-6) |
| d | De Simone et al. (2025), Nigeria, WP 11125: ≈1.328 alumnos, 6 semanas after-school, +0.31 DE compuesto, ≈+0.24 DE inglés | **CORREGIDA** (solo el inglés) | 657 tratamiento + 671 control = **1.328 aleatorizados** ✓; 9 escuelas (Benin City, Edo); 12 sesiones de 90 min en 6 semanas ✓; +0.31 DE compuesto ✓; inglés **+0.23 DE** (no 0.24). Ojo: solo 759 (422 T / 337 C) completaron el test final | [Texto completo WP 11125](https://documents1.worldbank.org/curated/en/099548105192529324/txt/IDU-c09f40d8-9ff8-42dc-b315-591157499be7.txt) (vía [ficha del documento](https://documents.worldbank.org/en/publication/documents-reports/documentdetail/099548105192529324)); abstract en [RePEc](https://ideas.repec.org/p/wbk/wbrwps/11125.html) |
| e | Sierra Leona (LearnLM/Google + Fab AI, 2026): 1.763 estudiantes, +0.258 DE ITT | **CONFIRMADA** | 1.763 estudiantes de secundaria básica (grados 7–8), 12 escuelas (Port Loko), 8 semanas, docente-dirigido, ITT +0.258 DE en matemática; preregistrado. El ≈0.380 ToT del informe completo no lo vi textual (queda sin verificar); el reporte es del proveedor, no peer-reviewed | [Blog oficial DeepMind](https://deepmind.google/blog/measuring-the-impact-of-learning-with-ai-in-sierra-leone-and-beyond/); [informe técnico PDF](https://storage.googleapis.com/deepmind-media/LearnLM/learnLM_sierraleone_may26.pdf) |
| f | Muralidharan, Singh y Ganimian (2019), Mindspark, AER 109(4): +0.37 DE matemática, +0.23 DE hindi en 4.5 meses | **CONFIRMADA** | Textual: "lottery winners scored 0.37σ higher in math and 0.23σ higher in Hindi over just 4.5 months"; AER 109(4), pp. 1426–60 | [AEA — artículo](https://www.aeaweb.org/articles?id=10.1257%2Faer.20171112) |
| g | Robinson et al. (2026) "Access is Not Enough": ≈350 alumnos, 2 RCT, uso +1 y +4.4 min/sem, sin mejora en lectura | **CONFIRMADA** (con matiz) | Abstract textual: 2 RCT en primaria; "increased average weekly platform usage by 1 to 4 minutes and engagement by 71-80%… the intervention did not improve reading achievement"; ≈350 alumnos según la ficha del estudio. El "4.4" exacto estará en el cuerpo; el abstract dice "1 to 4" | [PDF EdWorkingPaper 26-1451](https://nssa.stanford.edu/sites/default/files/ai26-1451.pdf); [ficha NSSA](https://nssa.stanford.edu/studies/access-not-enough-human-support-improves-engagement-ai-tutoring) |
| h | Rori (Ghana): ≈0.36–0.37 DE | **CONFIRMADA** (con matiz) | Cohen's d = 0.36 (0.37 en growth scores), ≈1.000 alumnos de grados 3–9, 11 escuelas, dos sesiones de 30 min/sem, 8 meses. Matiz: asignación a nivel de escuela, preprint (arXiv), carácter preliminar | [arXiv 2402.09809](https://arxiv.org/abs/2402.09809) |
| i | Roschelle et al. (2016) ASSISTments: 2.850 alumnos, ≈0.18 DE | **CONFIRMADA** | Textual (p. 7): "The difference of 8.84 points corresponds to an effect size of 0.18 standard deviation units (we used Hedges's g)"; 2.850 alumnos de 7º, 43 escuelas, Maine | [PDF AERA Open 2(4)](https://files.eric.ed.gov/fulltext/EJ1194398.pdf) |

No verificados aquí por instrucción del lead (ya verificados en T-002): Bastani et al., Tutor CoPilot, Eedi/LearnLM.

## 1. Lo que el talk PUEDE afirmar sin riesgo

- Todas las cifras de la tabla, tal cual: +0.125 DE (metaanálisis), +0.12 DE (subgrupo tutoría IA), 0.63 DE Kestin (49 vs 60 min), +0.31/+0.23 Nigeria, +0.258 ITT Sierra Leona, +0.37/+0.23 Mindspark, 0.36–0.37 Rori, 0.18 ASSISTments, "acceso sin apoyo no movió lectura" (Robinson).
- **El titular contraintuitivo es sólido y citable**: el registro experimental hasta la fecha no muestra ventaja de GenAI sobre la tecnología adaptativa que la precedió (0.022 DE, EE 0.075). Es la frase exacta del paper: "shows no advantage for the newer technology".
- Los datos de contexto del metaanálisis: ningún estudio incluido en países de bajos ingresos; solo 2 de 14 estudios reportan costos; investigadores implementaron 16 de 19 intervenciones.

## 2. Lo que el talk debe decir con matiz, y cuál es el matiz exacto

- **0.022 DE**: decir "no hay evidencia de ventaja", NUNCA "son iguales". El intervalo [−0.15, 0.19] acota la diferencia, no la resuelve — cabe dentro una ventaja tan grande como el efecto medio. El propio paper: "bounds… rather than resolving it".
- **Metaanálisis**: es un background paper del WDR 2026 (working paper, no peer-reviewed) y los autores tratan los subgrupos como "suggestive rather than conclusive". Base: 14 estudios.
- **Kestin 0.63 DE**: dos lecciones de física en Harvard con un tutor diseñado por expertos, test inmediato; el rango 0.73–1.3 es una regresión cuantílica por efecto techo, no el resultado principal. No generalizar a "un chatbot da 0.6 DE".
- **Nigeria**: decir 0.23 DE en inglés (el 0.31 mezcla inglés + conocimiento de IA + habilidades digitales). Y hubo atrición fuerte: 759 de 1.328 completaron el test final.
- **Sierra Leona**: reporte del proveedor (Google DeepMind + Fab AI), sin peer review; efecto mayor en alumnos con mejor línea base. No citar el 0.380 ToT (no lo verifiqué textualmente); el ITT 0.258 sí.
- **Robinson**: el abstract dice "+1 a 4 min/sem"; usar ese rango, no "4.4" (no lo vi textual).
- **Rori**: preprint con asignación a nivel de escuela; decir "≈0.36 DE, evidencia preliminar".

## 3. Lo que el talk NO debe decir

- "GenAI y el adaptativo clásico son equivalentes" (la evidencia solo acota, no resuelve).
- "0.24 DE en inglés en Nigeria" (es 0.23).
- El 0.380 DE de Sierra Leona como cifra establecida.
- "El metaanálisis cubre países de bajos ingresos" o cualquier extrapolación a esos contextos: cero estudios incluidos ahí.
- Que Kestin demuestra que "la IA duplica el aprendizaje" en general: son dos lecciones, contexto de élite, test inmediato.
- Cifras de costo por alumno como si fueran comparables entre estudios: solo 2 de 14 las reportan de forma comparable.

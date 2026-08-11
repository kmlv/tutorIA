# T-012c — Ronda correctiva: URLs de INTERACCIÓN (carril fable, rev 8)

- **Agente:** fable
- **Fecha:** 2026-08-10 (UTC 2026-08-11)
- **Sistemas (asignados en rev 8 del thread):** Khanmigo, NotebookLM, Guided Learning,
  Amira, SchoolAI, MagicSchool, Duolingo, Speak, SimConverse.
- **Método:** toda URL reportada fue cargada con WebFetch antes de entrar en la tabla.
  Los vídeos se verificaron por título y canal vía oEmbed (YouTube/Vimeo) — eso confirma
  que el vídeo existe y de quién es, NO su contenido cuadro a cuadro; por eso no doy
  minutos que no pude confirmar, antes que inventarlos. No creé cuentas ni inicié sesión.
- `no-existe` se usa según el encargo: el sistema no enseña esa interacción en público.

| Sistema | Tipo | URL exacta | Qué se ve | Requiere login |
|---|---|---|---|---|
| Khanmigo | no-existe (demo) | https://www.khanmigo.ai/ | Sin sandbox ni "try it": la página solo ofrece checkout/registro y un vídeo TED embebido | sí (de pago) |
| Khanmigo | video | https://www.youtube.com/watch?v=rnIgnS8Susg | "NEW! Khan Academy's AI Tutor, Khanmigo - In Depth Demo" (canal oficial Khan Academy): Sal Khan recorre en pantalla el chat de tutoría real | no |
| Khanmigo | video | https://www.ted.com/talks/sal_khan_how_ai_could_save_not_destroy_education | TED2023 de Sal Khan con demo en vivo de Khanmigo (la descripción oficial lo anuncia como demo); minuto exacto sin confirmar | no |
| NotebookLM | captura-en-soporte | https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-featured-notebooks/ | Post oficial con captura de un notebook de Shakespeare abierto en la UI + enlaces a 8 featured notebooks reales | no |
| NotebookLM | no-existe (demo) | https://notebooklm.google.com/notebook/780a38ee-d0a6-4fb1-b255-aa03c8d67dce | Featured notebook oficial, pero la cadena de redirects termina en accounts.google.com (verificado): no hay entrada sin cuenta Google | sí |
| Guided Learning | captura-en-soporte | https://blog.google/products-and-platforms/products/gemini/guided-learning-google-gemini/ | Captura real del chat: el usuario pide ayuda con conjugaciones en español y Guided Learning propone plan de estudio y pregunta "Ready to start with the regular -ar verbs?" | no |
| Guided Learning | captura-en-soporte | https://blog.google/products-and-platforms/products/education/guided-learning/ | Comparativa lado a lado de la misma pregunta de física: Gemini responde de golpe vs. Guided Learning desglosando paso a paso; incluye deep links de ejemplo | no |
| Guided Learning | demo-navegable (SIN VERIFICAR) | https://gemini.google.com/guided-learning?query=How%20do%20bees%20support%20our%20food%20systems? | Deep link oficial (publicado en blog.google) que abre una sesión con la pregunta precargada; WebFetch falló 2 veces y NO pude confirmar que cargue sin login | probablemente sí (cuenta Google) |
| Amira | demo-navegable | https://app.storylane.io/share/f2l1pa3tznic | Walkthrough Storylane oficial "How To: Listen To A Recording": UI real docente reproduciendo la grabación puntuada de un alumno leyendo en voz alta | no |
| Amira | demo-navegable | https://app.storylane.io/share/3qrkolwdmryo | Walkthrough Storylane "How To: Adjust Tutor Settings": dashboard docente configurando el tutor de un alumno | no |
| Amira | captura-en-soporte | https://amiralearning.com/teacher-resource-hub/implementation-and-support | Hub oficial de recursos docentes con ~20 walkthroughs Storylane de la UI real (tutor, evaluaciones, reportes), cada uno con URL propia | no |
| Amira | video | https://www.youtube.com/watch?v=5pGJXsavwL0 | "Meet Amira Learning \| Your AI Learning Agent for Reading Growth" (canal oficial): presentación del tutor | no |
| Amira | no-existe (vista alumno en vivo) | — | La pantalla del NIÑO leyendo con Amira escuchando no está publicada en forma navegable; lo público es el lado docente (Storylane de arriba) | — |
| SchoolAI | demo-navegable (con reserva) | https://app.schoolai.com/spaces/clq8rad0x0t1cptg12g4um63f | Space publicado "Welcome to SchoolAI!" (llegando por redirect desde schoolai.com/spaces/welcome-to-schoolai); carga SIN redirect a login, pero es SPA y no pude ejercitar la entrada de alumno sin cuenta | no según doc oficial (sin ejercitar) |
| SchoolAI | captura-en-soporte | https://help.schoolai.com/en/articles/10270211-getting-started-with-spaces | Help center con 3 capturas: modo Preview del docente interactuando con el Space "como alumno" y la librería Discover; no incluye el chat del alumno ni Mission Control | no |
| SchoolAI | video | https://www.youtube.com/watch?v=OmhK4Vv35KQ | Demo de Edutopia (tercero) del Video Explorer de SchoolAI en uso real con alumnos | no |
| MagicSchool | no-existe (demo) | — | Sin herramienta ni Student Room usable sin cuenta; el Tools Playground vive tras registro | — |
| MagicSchool | video | https://www.youtube.com/watch?v=WEfuXRv8P5M | "MagicSchool AI: MagicStudent Walkthrough" (canal OFICIAL): recorrido de la experiencia del alumno en Student Rooms | no |
| MagicSchool | captura-en-soporte | https://www.magicschool.ai/blog-posts/new-magicstudent-experience | Blog oficial con 3 capturas reales de UI: dashboard MagicStudent, Starter Rooms y Tools Playground (vista docente, no la pantalla del alumno chateando) | no |
| MagicSchool | video | https://www.youtube.com/watch?v=j-fApoXvTU4 | Demo de Edutopia: construir y usar un tutor/chatbot con la UI real de MagicSchool | no |
| Duolingo | no-existe (demo) | — | Sin deep link público de lección para invitados: la web es SPA y p.ej. /lesson/unit/1/level/1 devuelve solo el shell sin contenido (probado) | — |
| Duolingo | captura-en-soporte | https://blog.duolingo.com/covering-all-the-bases-duolingos-approach-to-speaking-skills | Capturas reales de ejercicios de habla EN CURSO: micrófono activo, diálogo con opciones habladas, y 3 pantallas del Video Call con Lily en llamada | no |
| Duolingo | captura-en-soporte | https://blog.duolingo.com/guide-to-duolingo-practice-hub/ | 7 capturas reales de la app en uso: repaso de errores ("You'll review 10 mistakes"), emparejamiento de vocabulario, "Repeat after Lily", ejercicio de escucha — es HLR/práctica personalizada en la interfaz | no |
| Speak | captura-en-soporte | https://www.speak.com/blog/live-roleplays | Post oficial de Live Roleplays con vídeo embebido de la experiencia de roleplay de voz + diagrama de arquitectura (Realtime API) | no |
| Speak | captura-en-soporte | https://www.speak.com/blog/winter-2025 | Pantallas de lección de voz, roleplay y Speak Score — OJO: son renders de marketing de la UI, no screenshots crudos | no |
| Speak | no-existe (demo) | — | Sin demo web pública; la app requiere cuenta/descarga | — |
| SimConverse | video | https://vimeo.com/668418847 | "SimConverse Showcase (2min)", del propio fabricante (cuenta Vimeo de SimConverse, 2022): recorrido de la plataforma | no |
| SimConverse | video | https://www.youtube.com/watch?v=emxyYTAktTc | Vendor showcase de SimConverse en IMSH 2026, canal de HealthySimulation (medio del sector, no fabricante) | no |
| SimConverse | no-existe (demo y soporte) | https://www.simconverse.com/ | El sitio del fabricante NO enseña la interacción: home y /product/* cargan pero son texto + logos + "Book a demo"; cero screenshots, cero vídeo embebido (verificado en 3 páginas) | — |

## Notas

- **Patrón del carril:** ninguno de los 9 sistemas tiene demo navegable sin login de la
  interacción del ALUMNO. Lo único genuinamente navegable sin cuenta son los walkthroughs
  Storylane de Amira (lado docente) y, con reserva, el Space publicado de SchoolAI. Los
  nativos genAI esconden el momento del aprendizaje tras login; SimConverse ni siquiera
  publica capturas — su `no-existe` es el más informativo del carril.
- Duolingo: el post de Birdbrain (learning-how-to-help-you-learn-introducing-birdbrain)
  tiene solo ilustraciones y diagramas, NO capturas de lección — no capturar de ahí. Los
  dos posts de la tabla sí tienen UI real.
- Khan Academy: support.khanacademy.org (Zendesk) devuelve 403 a fetch automatizado; puede
  tener capturas pero no pude verificarlas, por eso no está en la tabla.
- Amira: help.amiralearning.com/s/ (Salesforce) no renderiza sin JS; el hub de recursos
  docentes de la tabla es la vía buena.
- SimConverse (alternativa no verificada): el estudio JMIR Formative Research 2025 e71667
  (https://formative.jmir.org/2025/1/e71667) evalúa SimConverse y podría tener figuras de
  la UI, pero el fetch devolvió vacío — sin confirmar.

# Propuesta PoC tutorIA (agy)

**1. Arquitectura del PoC**
- **Módulos:** 
  - **Frontend (Vite/React):** Reproductor de medios sincronizado, estado local, y UI.
  - **Backend (Python/FastAPI):** Lógica de evaluación, estado, y enrutamiento hacia la API de LLM. Elegido por su afinidad con AudioExplainer y Manim.
  - **AI Gateway:** Abstracción para llamadas a Claude (con failovers futuros).
  - **Media Engine:** Servidor de archivos pre-producidos, con un "hook" de generación para el futuro.
- **Fronteras y Flujo:** Cliente solicita concepto -> Servidor entrega media y checkpoints -> Cliente reproduce -> Pausa en checkpoint -> Cliente responde -> Backend procesa mediante AI Judge -> Retorna acción de remediación -> Cliente actualiza UI.
- **Punto de extensión (Generación al vuelo):** El Media Engine servirá URLs estáticas por ahora, pero la interfaz pedirá `get_media(student_id, concept_id)`. En el futuro, si no hay caché, esta función invocará sincrónicamente la pipeline de AudioExplainer/Manim antes de retornar.

**2. Diseño del Juez y Remediación**
- **Esquema de sub-skills:**
  - *Línea presupuestaria:* `interceptos`, `pendiente_costo_oportunidad`, `efecto_renta`, `efecto_precio`.
  - *Curva de indiferencia:* `tms`, `convexidad`, `transitividad`.
- **Estado de Mastery (JSON):**
  `{ student_id, concept_id, sub_skills: { "efecto_precio": { level: 0.4, attempts: 2 } }, global: 0.7 }`
- **Rúbrica:** Prompts estructurados que evalúan la respuesta del usuario contra mecanismos causales predefinidos, retornando un score (0-1) y la etiqueta de la misconception detectada.
- **Política de Remediación (Decisión 7):**
  1. *Pregunta socrática:* Aplicada en el primer error (mastery < 0.8). Busca que el estudiante corrija su propio detalle faltante.
  2. *Re-explicar con otra representación:* Si hay un segundo error consecutivo en el mismo sub-skill, cambiando el enfoque visual o verbal.
  3. *Bajar dificultad (caso numérico):* Aplicado si el estudiante falla preguntas abstractas de estática comparativa.
  4. *Revisión humana:* Tras 3 intentos fallidos sin cruzar el umbral en un sub-skill, se marca el registro y se avanza para no frustrar.

**3. Catálogo de Misconceptions (Ejemplos clave)**
- **Línea Presupuestaria:**
  - *Nombre:* "Desplazamiento paralelo por precio"
  - *Señal:* Afirma que subir Px reduce el intercepto en Y.
  - *Distractor:* "Si Px sube, la línea se desplaza paralelamente hacia el origen."
  - *Remediación asoc:* Caso numérico (mostrar que $m/Py$ no ha cambiado).
- **Curva de Indiferencia:**
  - *Nombre:* "Cruce de preferencias"
  - *Señal:* Dibuja o acepta curvas que se cruzan.
  - *Distractor:* "Las curvas pueden cortarse si el consumidor cambia de opinión."
  - *Remediación asoc:* Pregunta socrática sobre la transitividad.

**4. UX del Chat**
- **Decisión:** Panel lateral derecho fijo (60% Media / 40% Chat).
- **Argumento:** Una burbuja flotante obstruye los gráficos y KaTeX, que son esenciales como referencia visual *mientras* el estudiante responde o lee la explicación. En escritorio (prioridad según decisión 15), el panel lateral es el estándar para aprendizaje (ej. Coursera, IDEs).

**5. Protocolo del Bake-off de Media**
- **Control:** Guion de 2 min ("m=100, Px=20, Py=10"), gráfico de línea presupuestaria básica.
- **Esfuerzo:** Timebox de 4 horas por prototipo.
- **Métricas por Criterio:**
  1. *Calidad visual:* Rating subjetivo (1-5) del Principal.
  2. *Personalización:* Líneas de código para cambiar "Pedro" por "Ana" y Px=20 por 15.
  3. *Costo:* Tiempo real invertido de las 4 horas + segundos de render.
  4. *Accesibilidad:* ¿Es modificable editando un .txt/.json o requiere recompilar código?
  5. *Versatilidad (Criterio 5 - Crítico):* **Profiling técnico.** Se medirá el tamaño del payload inicial en red (MB) y el consumo promedio de CPU (%) en Chrome con throttling de CPU (simulando un equipo viejo). Si A/D consumen >60% CPU por re-renders del DOM y pierden sincronía, se priorizará B/C.

**6. Modelo de Datos SQLite (Camino a multi-estudiante)**
- `Users` (id, email, hash)
- `Sessions` (id, user_id nullable para guests)
- `ConceptMastery` (user_id, concept_id, sub_skill, level, attempts)
- `Interactions` (timestamp, session_id, type [play, chat, answer], payload)
- *Evolución:* Ahora mismo `user_id` será null o "guest_1". Cuando se integre Auth, simplemente se vinculan las nuevas sesiones a un registro real en `Users`.

**7. Secuencia de Trabajo y Criterio de Éxito**
- *Paso 1:* Ejecutar y evaluar el Bake-off de media. Seleccionar stack ganador.
- *Paso 2:* Scaffold del backend SQLite y el layout del Frontend (Media/Chat).
- *Paso 3:* Motor de Juez AI con la política de remediación implementada.
- *Paso 4:* Ensamblaje del concepto "Línea Presupuestaria".
- *Criterio de Éxito PoC:* Un usuario anónimo reproduce el concepto, choca con un checkpoint, falla la respuesta, recibe una remediación de "caso numérico" correcta, acierta en el reintento, alcanza mastery, recibe resumen formativo final, y todo queda logueado en SQLite.

**8. Riesgos y Mitigaciones**
- *Riesgo:* Alucinaciones del LLM en explicaciones de microeconomía.
  - *Mitigación:* System prompt RAG estrictamente confinado a los apuntes de `intermediate_micro_notes`.
- *Riesgo:* Desincronización del DOM con el audio en equipos viejos (Web Speech / Opción A).
  - *Invalidación de supuesto:* Si en el bake-off el criterio 5 demuestra lag severo en equipos viejos, invalidaremos el supuesto de "sincronización precisa DOM-Audio en el cliente" y pivotaremos a un híbrido (Opción D) o video pre-renderizado (Opción B/C) como base, sacrificando dinamismo extremo por estabilidad.

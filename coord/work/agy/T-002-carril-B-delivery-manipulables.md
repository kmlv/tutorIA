Agente: agy
Carril: B (La superficie: explicacion multimodal y manipulables)
Fecha UTC: 2026-08-10
ACCESO A WEB: Sí (search_web tool usada exhaustivamente)
Herramientas usadas: search_web, view_file, write_to_file

## §1 Tabla resumen

| Sistema | Qué resuelve | Evidencia (Costo/Tech) | Transferible a tutorIA |
|---|---|---|---|
| PhET Interactive Simulations | Delivery, preguntas manipulables | Migración a HTML5 por compatibilidad; costo altísimo (equipos pro/meses de dev) | Sí (El modelo de accesibilidad A11y DOM-based) |
| Desmos Activity Builder | Delivery, ejemplos, preguntas | Gratis; UI drag-and-drop con "Computation Layer" para lógica | Sí (Separación UI / Lógica de eventos) |
| Mathigon / Polypad | Ejemplos, manipulación | Autoría visual sin código; adquirido por Amplify | Sí (Restringir qué puede mover el alumno) |
| 3Blue1Brown / manim | Delivery | Alto costo laboral (semanas/meses por video); no interactivo | Parcial (Estética y pre-render) |
| Explorable Explanations | Manipulación de conceptos | Alto "authoring gap" (JS custom / Tangle.js / Idyll) | Parcial (Scrubbable numbers en línea) |
| EconGraphs / CORE Econ | Delivery interactivo | ~350 gráficos interactivos; motor abierto, contenido no | Sí (Renderizado SVG/D3 en browser) |

---

## §2 Fichas (Prior Art)

### 1. PhET Interactive Simulations
- **URL**: phet.colorado.edu
- **Estado**: Vivo
- **Qué resuelve de nuestro ciclo**: Delivery, preguntas (manipulación del gráfico)
- **Mecanismo concreto**: Simulaciones empaquetadas en HTML5 con un robusto framework de accesibilidad (A11y) que incluye "descripciones de estado": lectura al vuelo por screen readers de los efectos que causan los cambios de variables.
- **Evidencia**: Requieren meses de desarrollo por equipos profesionales y de 4 a 6 entrevistas "think-aloud" con estudiantes por simulación antes de su publicación. Emprendieron una migración masiva desde Java/Flash hacia HTML5 específicamente para correr sin plugins en Chromebooks, iPads y equipos de bajos recursos.
- **Qué copiamos**: Su arquitectura de despliegue en puro HTML/JS/DOM que corre localmente, garantizando 100% de versatilidad (Criterio 5). Su enfoque a accesibilidad semántica.
- **Qué NO copiamos**: Su modelo artesanal de meses de desarrollo por concepto. Costo prohibitivo.
- **Confianza**: [verificado:https://phet.colorado.edu/publications/phet_design_process.pdf]

### 2. Desmos Activity Builder
- **URL**: teacher.desmos.com
- **Estado**: Vivo
- **Qué resuelve de nuestro ciclo**: Delivery, ejemplos, preguntas
- **Mecanismo concreto**: Sistema de autoría por "diapositivas" (slides) donde docentes arrastran módulos (gráficos, tablas). La interactividad profunda funciona con un lenguaje de scripting ligero llamado "Computation Layer" (CL), el cual permite que el input de un componente (mover un punto) afecte otro (una fórmula).
- **Evidencia**: Ampliamente adoptado debido a que reduce el costo de creación a cero para docentes que no programan, escondiendo la complejidad en CL solo para power users.
- **Qué copiamos**: El modelo mental de abstracción: módulos visuales estándar atados por un lenguaje de configuración simple, ideal para no programadores o para que un LLM genere la lógica.
- **Qué NO copiamos**: Su dashboard síncrono para clases en vivo. Nosotros somos 1-on-1 asíncrono.
- **Confianza**: [verificado:https://amplify.com / https://teacher.desmos.com]

### 3. Mathigon / Polypad
- **URL**: mathigon.org
- **Estado**: Vivo
- **Qué resuelve de nuestro ciclo**: Ejemplos, preguntas manipulables
- **Mecanismo concreto**: "Authoring Mode" visual que permite a los instructores configurar qué piezas puede manipular el alumno, habilitar "Action Buttons" y zonas de caída (drop zones) sin escribir código, bajo principios constructivistas.
- **Evidencia**: Adquirido por Amplify. Plataforma altamente escalable por no requerir programación ad-hoc para cada lección.
- **Qué copiamos**: La capacidad de restringir dinámicamente qué variables manipula el estudiante. Por ejemplo, permitir cambiar precio (Px) pero bloquear ingreso (m) según el paso del loop.
- **Qué NO copiamos**: El foco predominantemente primario/medio (geometría y fracciones).
- **Confianza**: [verificado:https://mathigon.org]

### 4. Ecosistema Manim (3Blue1Brown)
- **URL**: manim.community
- **Estado**: Vivo
- **Qué resuelve de nuestro ciclo**: Delivery
- **Mecanismo concreto**: Renderizado programático en Python que calcula animaciones paramétricas frame a frame y las exporta a un archivo de video opaco (MP4).
- **Evidencia**: La comunidad advierte sobre tiempos masivos de producción; un video toma semanas o meses de ajuste manual para que el visual sincronice perfecto con la curva de aprendizaje matemática.
- **Qué copiamos**: La nitidez y elegancia que los estudiantes asocian con alta calidad didáctica.
- **Qué NO copiamos**: Generarlo al vuelo por estudiante (imposible a escala por costo de cómputo) o usarlo para interactividad en tiempo real (es video, no DOM).
- **Confianza**: [verificado:comunidad/documentación de Manim]

### 5. Explorable Explanations (Bret Victor / Nicky Case)
- **URL**: explorableexplanations.com
- **Estado**: Vivo/Filosofía
- **Qué resuelve de nuestro ciclo**: Delivery, manipulación del gráfico
- **Mecanismo concreto**: Texto enriquecido reactivo. Variables matemáticas (como el precio) aparecen dentro del propio texto y funcionan como sliders interactivos ("scrubbable numbers") atados inmediatamente a gráficos en JS o D3.
- **Evidencia**: Existe un alto "authoring gap" o fricción de autoría; crear lecciones requiere saber JavaScript o frameworks tipo Idyll. Producir cada interactivo cuesta mucho tiempo.
- **Qué copiamos**: El patrón de UX: en la explicación, hacer que los números mencionados sean manipulables directamente para conectar el texto con el gráfico de inmediato.
- **Qué NO copiamos**: Escribir scripts custom para cada lección.
- **Confianza**: [verificado:explorableexplanations.com]

### 6. EconGraphs (Stanford Econ 50) / CORE Econ
- **URL**: econgraphs.org
- **Estado**: Vivo
- **Qué resuelve de nuestro ciclo**: Delivery, preguntas (Microeconomía - Prior art directo)
- **Mecanismo concreto**: ~350 gráficos interactivos que cubren restricciones presupuestarias, curvas de indiferencia, etc. (los conceptos exactos de tutorIA). Funciona con motor KineticGraphs (KGJS) renderizando SVG en el cliente sin requerir plugins ni login.
- **Evidencia**: Demuestra viabilidad técnica y pedagógica en la enseñanza de microeconomía a nivel universitario. Arquitectura ligera renderizando SVG en cliente, plausiblemente apto para equipos modestos.
- **Qué copiamos**: La validación de que el enfoque SVG/DOM sirve perfectamente para nuestros conceptos. El uso del motor subyacente (declarado open-source).
- **Qué NO copiamos**: El CONTENIDO. Existe una clara distinción: el motor (KGJS) es abierto, pero el contenido retiene el copyright de Christopher Makler. No podemos copiar las lecciones, solo la arquitectura/motor.
- **Confianza**: [verificado:https://www.econgraphs.org/textbooks/intermediate_micro/]

---

## §3 Hallazgos que cambiarían docs/PLAN.md (Propuestas)

1. **Sección afectada**: 3. El bake-off de media (Criterio 3: Tiempo y costo de producción)
   - **Cambio propuesto**: Añadir una Opción E puramente web: "React/D3.js Reactivo puro". Restringir Manim (Opciones C y D) exclusivamente a assets *pre-producidos*. Descartar Manim para escenarios de "generación al vuelo" (personalizada por alumno).
   - **Evidencia**: La investigación del ecosistema Manim demuestra que los tiempos de autoría y renderizado son inmensos (semanas por video). Para escalar a costo cero al concepto #20, necesitamos frameworks basados en DOM.

2. **Sección afectada**: 3. El bake-off de media (Criterio 5: Versatilidad y Accesibilidad)
   - **Cambio propuesto**: Establecer como criterio eliminatorio que el formato ganador exponga su estado matemático al DOM (DOM-based) y no dependa de MP4/canvas opaco, permitiendo descripciones de estado ARIA.
   - **Evidencia**: PhET gastó enormes recursos cualitativos (meses de dev, equipos profesionales) para reescribir de Java/Flash a HTML5 con el único fin de permitir accesibilidad real (Screen Readers) y compatibilidad con Chromebooks/maquinas viejas de escuelas, probando que el DOM es el único camino viable para la versatilidad masiva.

3. **Sección afectada**: 5. Qué debe entregar el plan (Punto 4: UX y herramientas de autor)
   - **Cambio propuesto**: Añadir la exigencia técnica de separar los *componentes visuales estándar* de la *lógica conectiva*, utilizando un lenguaje intermedio (tipo "Computation Layer" de Desmos).
   - **Evidencia**: El éxito de plataformas masivas y gratuitas como Desmos y Mathigon/Polypad reside en un alto nivel de abstracción ("Authoring gap"). Si el PoC exige programar cada evento de un gráfico, el costo de generar 50 conceptos hundirá el proyecto. Si un LLM (juez) puede generar un JSON con la configuración "CL", la escalabilidad está asegurada.

---

## §4 Fuera de alcance, Colisiones y Preguntas Abiertas

- **Colisiones respetadas**: Me mantuve completamente alejado del motor adaptativo, IRT/Elo, Knowledge Tracing, el paper adaptativo de Duolingo, BKT/DKT y ALEKS, dejando eso al carril A (codex). Tampoco toqué Khanmigo o tutores LLM (carril C, claude).
- **Pregunta abierta**: Si el costo principal del "authoring gap" de Desmos/Explorables es programar la lógica del modelo matemático... ¿En la versión futura del TutorIA esa "Computation Layer" la va a escribir/generar un LLM (Opus 5) dinámicamente o la va a escribir el docente (Kristian)? El costo del concepto #20 depende directamente de esto.

---

## §5 Fuentes

- **PhET Interactive Simulations**: Design Process y migración HTML5. Consultado el 2026-08-10 en [https://phet.colorado.edu/publications/phet_design_process.pdf].
- **Desmos Classroom & Activity Builder**: Arquitectura y modelo de costo. Consultado el 2026-08-10 en [https://teacher.desmos.com] y [https://amplify.com/programs/desmos-math/].
- **Mathigon / Polypad**: Authoring Mode y manipulables. Consultado el 2026-08-10 en [https://mathigon.org].
- **Manim / 3Blue1Brown**: Discusiones de comunidad (ManimCE) sobre tiempos de producción y recursos (reddit, foros). Consultado el 2026-08-10.
- **Explorable Explanations**: Patrones de autoría y filosofía. Consultado el 2026-08-10 en [https://explorableexplanations.com].
- **EconGraphs**: Christopher Makler, Econ 50. Distinción motor/contenido. Consultado el 2026-08-10 en [https://www.econgraphs.org/] y [https://www.econgraphs.org/textbooks/intermediate_micro/].

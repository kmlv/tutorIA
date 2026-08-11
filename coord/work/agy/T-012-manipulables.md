# T-012: Inventario de Sistemas — Manipulables, Simulaciones y Explorables
**Agente:** agy
**Acceso a web durante la investigación:** Sí (búsqueda y lectura de urls donde fue necesario, uso extensivo de conocimiento previo para extraer los mecanismos sin ruido de marketing).

## Fichas Profundas (Top 6)

### 1. Desmos Classroom & Computation Layer — Amplify (anteriormente Desmos)
- URL: https://teacher.desmos.com / https://teacher.desmos.com/computation-layer/documentation
- Familia y por qué entró en el top 20: Manipulables. Entra por la elegancia de su modelo de estado distribuido y su lenguaje de scripting reactivo (Computation Layer).
- Qué es, en una línea: Plataforma de actividades matemáticas interactivas basadas en graficación dinámica y sincronización de estado de la clase en tiempo real.
- **EL MECANISMO ROBABLE**: **Computation Layer (CL) y Dashboard Pacing**. CL es un lenguaje de scripting puramente funcional y reactivo. Cada componente en pantalla (gráfica, tabla, entrada de texto, botón) expone variables ("sinks" y "sources"). El autor conecta el output de un componente al input de otro (ej. el valor de una celda en una tabla actualiza el dominio de una gráfica). No hay bucles ni estado mutable directo. A nivel clase, el mecanismo de **Dashboard** para el profesor (sincronización de estado, "pacing" para bloquear el progreso a ciertas pantallas, "anonymize" para proyectar respuestas sin exponer al alumno) es estructuralmente perfecto.
- Uso de IA generativa: no. Puramente determinista y matemático.
- Sofisticación visible: Altísima. Transiciones fluidas, renderizado matemático ultra rápido, diseño sobrio sin distracciones visuales.
- Modelo de autoría: Híbrido y brillante. Tienen contenido propio oficial (muy caro de producir y testear), pero exponen el "Activity Builder" con CL a cualquier profesor de forma gratuita. Esto baja el costo de experimentación de la cola larga y permite a profesores crear actividades con el mismo nivel de interactividad que el equipo interno.
- Estado: vivo (adquirido por Amplify).
- CAPTURA: si. Pantalla del Activity Builder editando el Computation Layer de un componente, mostrando cómo se hace referencia a otro componente (ej. `graph1.number("x")`).
- Confianza: [verificado:https://teacher.desmos.com/computation-layer/documentation]

### 2. PhET Interactive Simulations — University of Colorado Boulder
- URL: https://phet.colorado.edu
- Familia y por qué entró en el top 20: Simulaciones. Es el estándar de oro global en simulaciones científicas con andamiaje implícito.
- Qué es, en una línea: Colección de simulaciones interactivas de ciencias y matemáticas fuertemente testeadas con investigación educativa.
- **EL MECANISMO ROBABLE**: **Andamiaje implícito (Implicit Scaffolding)** apoyado en su **arquitectura Scenery (MVC web)**. El mecanismo restringe los grados de libertad de interacción para que las acciones "correctas" o exploratorias sean obvias visualmente ("affordances"), sin dar instrucciones explícitas. Además, su mecanismo de **Accesibilidad y Sonificación**: mapean el grafo de objetos visuales a un árbol paralelo en el DOM (PDOM) que permite navegación y descripciones fluidas con lector de pantalla y sonidos espaciales generativos (Web Audio API) que representan valores físicos.
- Uso de IA generativa: no.
- Sofisticación visible: Altísima en comportamiento en tiempo real, colisiones y sobre todo en accesibilidad integral multiplataforma (es el líder indiscutido en simulaciones STEM accesibles).
- Modelo de autoría: Cerrado / De altísimo costo. Las simulaciones están codificadas en HTML5/TypeScript (sobre su motor Scenery), y son open source, pero crear una requiere un equipo de desarrolladores de software, un diseñador instruccional y semanas de testing con usuarios. No hay una herramienta de autoría visual para docentes (high barrier to entry).
- Estado: vivo.
- CAPTURA: si. Simulación "Energy Skate Park", mostrando la pestaña principal con los medidores de gráficos de barra o torta (pie chart) desplegados mientras el patinador está en movimiento.
- Confianza: [verificado:https://phet.colorado.edu/en/accessibility]

### 3. Polypad (Mathigon) — Amplify
- URL: https://mathigon.org/polypad
- Familia y por qué entró en el top 20: Manipulables. Por su motor de física 2D adaptado específicamente para restricciones didácticas (geometría y aritmética).
- Qué es, en una línea: Un lienzo universal y de forma libre ("canvas") para manipulables virtuales en matemáticas.
- **EL MECANISMO ROBABLE**: **Snapping & Constraint Engine**. Las piezas en el lienzo tienen "conciencia" semántica y topológica de las demás. Si acercas bloques de fracciones a un círculo, se acomodan como porciones. Si acercas un polígono a otro, se "pegan" (snap) por aristas compatibles. Si pones bloques de álgebra en una balanza virtual, la balanza se inclina según sus ecuaciones. Es un sistema de física de piezas virtuales que absorbe toda la fricción motriz para que el alumno se concentre en la relación matemática.
- Uso de IA generativa: no en la mecánica de los bloques (aunque la plataforma general usa a "Jack", un tutor LLM).
- Sofisticación visible: Muy alta. Las animaciones al dividir polígonos, fusionarlos o desenrollar prismas en redes 3D son fluidas e intuitivas.
- Modelo de autoría: Abierto para crear estados (lienzos), pero cerrado para crear primitivas. Un profesor puede poblar un lienzo con piezas, establecer un estado inicial, guardarlo y compartir el link. No puede definir comportamientos nuevos de piezas, la librería subyacente la provee el equipo interno.
- Estado: vivo (adquirido por Amplify).
- CAPTURA: si. Pantalla de Polypad donde se está utilizando la herramienta de corte para dividir un bloque de fracción de 1/2 en dos de 1/4.
- Confianza: [verificado:https://mathigon.org/polypad]

### 4. Observable (Notebooks) — Observable
- URL: https://observablehq.com
- Familia y por qué entró en el top 20: Explorables / Programación. Su modelo de ejecución reactivo es la mejor solución al problema de estado lineal en herramientas de datos computacionales.
- Qué es, en una línea: Cuadernos web (notebooks) en JavaScript donde código, datos y visualización se actualizan reactivamente.
- **EL MECANISMO ROBABLE**: **Flujo de datos reactivo (Reactive Dataflow DAG)**. A diferencia de un Jupyter Notebook tradicional (donde el estado depende del orden arbitrario en que el usuario corre las celdas, generando errores ocultos), Observable construye un grafo acíclico dirigido (DAG) oculto analizando las variables. Si un bloque define `x` y un bloque de UI actualiza `x`, todas las celdas (y gráficos D3.js) dependientes de `x` se re-evalúan instantáneamente al estilo Excel. Es el motor perfecto para crear "explorable explanations" con nula latencia.
- Uso de IA generativa: sí. Asistencia de código autocompletado en celdas (similar a Copilot) e integración de celdas AI para consultas a los datasets.
- Sofisticación visible: Alta. Es una herramienta prosumer. El motor en tiempo de ejecución en el navegador es espectacular.
- Modelo de autoría: Abierto y flexible, pero requiere JavaScript. Cualquiera puede "forkear" un notebook. Permite que autores de datos o profesores creen visualizaciones explorables complejas sin tener que hospedar un servidor ni gestionar frameworks de frontend.
- Estado: vivo (la empresa viró fuerte a "Observable Framework" para apps de datos en empresas, pero la comunidad web y los cuadernos originales siguen activos).
- CAPTURA: si. Un notebook mostrando un componente `Inputs.range` (un slider interactivo) y debajo un gráfico (plot) reactivo que se ajusta a esa variable.
- Confianza: [verificado:https://observablehq.com/@observablehq/how-observable-runs]

### 5. CODAP (Common Online Data Analysis Platform) — Concord Consortium
- URL: https://codap.concord.org
- Familia y por qué entró en el top 20: Explorables. Por el mecanismo de vinculación de selecciones (broadcasting) a través de componentes heterogéneos.
- Qué es, en una línea: Entorno web de exploración interactiva de datos pensado para estudiantes de nivel escolar.
- **EL MECANISMO ROBABLE**: **Linked Data Representations (Múltiples Representaciones Enlazadas)**. Dentro de un documento CODAP tienes una estructura de datos jerárquica. Si abres una tabla, un mapa y un gráfico de puntos, el mecanismo garantiza un estado de selección compartido. Al arrastrar un cuadro de selección sobre un clúster de puntos en el gráfico, los registros exactos se resaltan de color en la tabla y en el mapa. Este "broadcasting" de interacción facilita enormemente la inferencia causal y el descubrimiento de patrones sin saber programar SQL ni Pandas.
- Uso de IA generativa: no.
- Sofisticación visible: Media-alta en lógica, aunque su interfaz de usuario parezca el escritorio de un SO de los años 90 (múltiples ventanas flotantes dentro de una pestaña del navegador). 
- Modelo de autoría: Abierto y sin fricción técnica. Un docente sube un archivo CSV, arrastra un gráfico, configura la vista inicial que desea y le da a "Share > Get Link" para enviar ese workspace (como documento) a los alumnos. 
- Estado: vivo.
- CAPTURA: si. Un workspace con una tabla de datos y un gráfico de dispersión, con una región del gráfico resaltada en amarillo y las filas correspondientes en la tabla resaltadas a su vez.
- Confianza: [verificado:https://codap.concord.org/help/]

### 6. NetLogo Web — CCL (Northwestern University)
- URL: https://netlogoweb.org
- Familia y por qué entró en el top 20: Simulaciones. Por la arquitectura de modelado multi-agente que permite experimentar sistemas complejos emergentes de reglas locales simples.
- Qué es, en una línea: Versión para navegador del lenguaje de programación y entorno de modelado basado en agentes más popular.
- **EL MECANISMO ROBABLE**: **Evaluación y concurrencia de miles de agentes locales (Agent-based concurrency)**. El lenguaje provee una abstracción (derivada de Logo) donde el creador piensa de forma individual y distribuida: "si yo fuera un lobo y huelo ovejas cerca, me muevo ahí". El motor (escrito en Scala y compilado a JS para la web) se encarga del renderizado y el "tick" de reloj de miles de lobos y ovejas simultáneamente en una matriz (patches), graficando las macrodinámicas de población en tiempo real. Reduce la fricción entre la regla micro y el efecto macro.
- Uso de IA generativa: no (aunque la comunidad académica y algunos profesores están usando LLMs externos como copilotos para generar el script de NetLogo).
- Sofisticación visible: Estéticamente cruda (UI de Java de los 2000 portada a web), pero con un motor interno de simulación asombrosamente eficiente.
- Modelo de autoría: Abierto. Se requiere aprender el dialecto NetLogo. Una vez escrito, la versión web permite embeber toda la simulación en un iframe sin instalaciones.
- Estado: vivo (y muy activo en investigación académica de complejidad).
- CAPTURA: no.
- Confianza: [verificado:https://netlogoweb.org/]


## Tabla Larga (Cola)

| Sistema | Familia | Quién lo hace | Una línea | URL |
|---------|---------|---------------|-----------|-----|
| Brilliant | Explorables | Brilliant.org | Cursos STEM con micro-interacciones frecuentes basadas en física y lógica matemática. | https://brilliant.org |
| Scratch | Manipulables | MIT Media Lab | Programación visual por bloques, paradigma de actores y eventos. | https://scratch.mit.edu |
| Wolfram Demonstrations | Simulaciones | Wolfram | Simulaciones interactivas generadas dinámicamente mediante código de Wolfram Language. | https://demonstrations.wolfram.com |
| Snap! | Manipulables | UC Berkeley | Bloques visuales extendidos con funciones de primera clase, continuaciones y datos estructurados. | https://snap.berkeley.edu |
| Algodoo | Simulaciones | Algoryx Simulation | Simulador físico 2D (sandbox) con gravedad, dinámica de fluidos y óptica. | http://www.algodoo.com |
| EconGraphs / KGJS | Explorables | Chris Makler | Gráficos y animaciones interactivas de micro y macroeconomía definidos declarativamente. | https://www.econgraphs.org |
| Distill.pub | Explorables | Distill (Shan Carter et al) | Innovador journal web (hiatus) de machine learning construido sobre "explorable explanations". | https://distill.pub |
| Molecular Workbench | Simulaciones | Concord Consortium | Motor de física visual para simular termodinámica, química y mecánica molecular. | http://mw.concord.org |
| Primer | Explorables | Primer Learning | Lecciones estilo libro interactivo y video para chicos, con alta inversión gráfica e hiper-narrativa. | https://primer.com |

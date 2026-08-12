/**
 * La baraja de láminas: el esquema, y la única función que pinta una.
 *
 * El esquema es deliberadamente estrecho — la lección de D-3 es que un modelo emite bien
 * lo que tiene poco donde equivocarse. Una lámina NO puede: durar unos segundos concretos
 * (las ventanas se compilan, nadie las escribe), heredar nada de la anterior, ni describir
 * un cambio. Solo puede decir CÓMO SE VE LA PANTALLA cuando ella manda.
 *
 * Esa última frase es toda la arquitectura. `pintar()` no recibe de dónde viene el alumno,
 * así que no hay forma de escribir el fallo que Kristian encontró: una tarjeta con el
 * precio viejo del café junto a una ecuación con el nuevo. No está arreglado — es
 * irrepresentable.
 */
import type { Ejemplo, GraphState } from "../types";
import type { LedgerOp, LedgerLike } from "../graph/script";
import { aplicarLedger } from "../graph/script";
import type { BudgetGraph } from "../graph/budget_graph";

/** El ledger, más las dos cosas que exige el estado total: volver a cero, y saber aplicar
 *  sin animar. `setFoco` lo pone el armazón, que es quien tiene el nodo del escenario. */
export interface LedgerTotal extends LedgerLike {
  resetear(): void;
  silencioso: boolean;
}

/** Una ventana sobre el MP3 de la lección. Contigua con la de la lámina vecina, de modo
 *  que avanzar no busca: el audio sigue sonando y solo cambia quién manda en la pantalla. */
export interface Ventana {
  desde: number;
  hasta: number;
}

export interface Lamina {
  id: string;
  tipo: "explica" | "pregunta";
  audio: Ventana;
  /**
   * Lo que se oye mientras esta lámina manda, frase a frase, y cada frase partida en
   * tramos: `{t}` es texto y `{m}` es matemática ya compuesta.
   *
   * Va partida porque la transcripción del audio está escrita PARA EL OÍDO: donde el
   * guion dice `(x₁, x₂)`, la grabación dice —y el subtítulo mostraba— "x sub 1, x sub 2".
   * El compilador de audio había guardado las dos formas, así que la escrita se recupera
   * sin reescribir contenido ni adivinar nada.
   *
   * El HTML de `{m}` lo produce KaTeX en tiempo de compilación, con `trust:false`. Es la
   * única cosa de esta baraja que se inyecta como HTML, y por eso el intérprete no acepta
   * marcado de ninguna otra procedencia: el resto es texto y entra como texto.
   */
  dice: Array<Array<{ t?: string; m?: string }>>;
  escena: GraphState;
  ledger: LedgerOp[];
  /** Dónde empiezan las operaciones propias de esta lámina dentro de `ledger`. El prefijo
   *  se aplica sin animar. Se deriva del total; no se arrastra entre láminas. */
  desde_op: number;
  /** Identificador del ítem, para las láminas de pregunta. NUNCA su respuesta: el
   *  veredicto lo da el servidor y la baraja viaja al navegador. */
  item?: string;
  clase?: "prediction" | "checkpoint";
  /**
   * De qué lado de la pregunta cae la voz — y no es el mismo en los dos casos. Salió al
   * leer lo que dicen de verdad las cinco ventanas, no del debate:
   *
   *   `antes`   (checkpoint): la ventana CONTIENE el enunciado hablado. Suena, y al
   *             terminar aparece la pregunta.
   *   `despues` (prediction): la ventana contiene la REVELACIÓN. Se pregunta primero y
   *             la voz explica después.
   *
   * Elegir un solo orden para las dos no es un detalle de ritmo: la ventana de
   * `price_effect` dice "la línea no se desplaza: gira", que es su respuesta. Reproducir
   * antes de preguntar regalaría la respuesta en tres de los cinco ítems.
   */
  momento?: "antes" | "despues";
}

export interface Baraja {
  version: number;
  pack: string;
  lang: "es" | "en";
  audio: string;
  duracion_s: number;
  ejemplo: { p1: number; p2: number; m: number };
  bien1: string;
  bien2: string;
  titulo: string;
  laminas: Lamina[];
}

/** Comprueba la baraja antes de pintarla. Un archivo compilado también puede llegar roto,
 *  y una lección que se reproduce en silencio sobre una pantalla mal montada es peor que
 *  una que se niega a empezar. */
export function revisarBaraja(b: Baraja): string[] {
  const p: string[] = [];
  if (!b.laminas.length) p.push("la baraja no tiene láminas");
  b.laminas.forEach((l, i) => {
    if (l.audio.hasta <= l.audio.desde) p.push(`${l.id}: ventana vacía o invertida`);
    if (l.desde_op > l.ledger.length) p.push(`${l.id}: desde_op fuera de rango`);
    if (l.tipo === "pregunta" && !l.item) p.push(`${l.id}: lámina de pregunta sin ítem`);
    const sig = b.laminas[i + 1];
    if (sig && Math.abs(sig.audio.desde - l.audio.hasta) > 1e-3) {
      // Un hueco significa que alguien tocó las ventanas a mano. Avanzar dejaría de ser
      // continuo y el audio chasquearía en la unión.
      p.push(`${l.id}→${sig.id}: hueco de ${(sig.audio.desde - l.audio.hasta).toFixed(3)}s`);
    }
  });
  if (b.laminas.length) {
    const fin = b.laminas[b.laminas.length - 1].audio.hasta;
    if (Math.abs(fin - b.duracion_s) > 0.05) p.push("la última ventana no llega al final");
    if (Math.abs(b.laminas[0].audio.desde) > 1e-6) p.push("la primera ventana no empieza en 0");
  }
  return p;
}

/**
 * Pone la pantalla en el estado de esta lámina. Idempotente por construcción: llamarla
 * dos veces seguidas con la misma lámina deja lo mismo, y llamarla con la lámina 3 da el
 * mismo resultado se venga de la 2 o de la 11.
 */
export function pintar(l: Lamina, graph: BudgetGraph, ledger: LedgerTotal,
                       base: Ejemplo): void {
  graph.render(l.escena);

  ledger.resetear();
  // El prefijo, mudo: reconstruye lo que ya estaba encendido sin afirmar que acaba de
  // cambiar. Solo lo propio de esta lámina se anima.
  ledger.silencioso = true;
  aplicarLedger(l.ledger.slice(0, l.desde_op), ledger, base);
  ledger.silencioso = false;
  aplicarLedger(l.ledger.slice(l.desde_op), ledger, base);
}

/**
 * El guion del gráfico como DATOS (decisión D-3).
 *
 * Hasta ahora, qué hace la imagen en cada cue vivía en un `switch` dentro de
 * `state.ts`: para añadir un concepto había que escribir TypeScript. D-3 dice que ese
 * documento lo emite un modelo contra un esquema que Kristian define una vez, porque eso
 * es lo que hace barato el concepto número veinte. Este archivo es el esquema y su
 * intérprete.
 *
 * ## Por qué la gramática es tan pequeña
 *
 * Un modelo que emite Python arbitrario —la opción C del bake-off— falla en silencio:
 * una llamada mal escrita es un no-op y un signo cambiado renderiza precioso. Aquí el
 * vocabulario es cerrado y las expresiones son de una operación. Todo lo que un modelo
 * pueda escribir está en el esquema o es un error ruidoso; no hay tercera opción.
 *
 * Esa estrechez no es una limitación que arrastramos: es la hipótesis. Si un formato lo
 * bastante restringido para que un modelo lo emita sin peligro alcanza para dar la
 * lección, entonces el motor de render sofisticado sobra — y el criterio 2 del bake-off
 * pasa a ser el que decide.
 *
 * ## Las expresiones
 *
 * Se evalúan contra el EJEMPLO BASE del pack (`p1`, `p2`, `m` de `pack.yaml`), nunca
 * contra el estado corriente. Es exactamente lo que hacía el `switch` y además quita una
 * clase entera de errores: dos `set` en distinto orden dan el mismo resultado, así que un
 * modelo no puede romper una lección reordenando operaciones que se ven independientes.
 *
 * La gramática es `termino (op termino)?` con `op` en `+ - * /` y `termino` una variable
 * o un número. Sin paréntesis, sin funciones, sin `eval`, sin `Function`. Cubre todo lo
 * que la lección de línea presupuestaria necesita hoy (`m * 1.5`, `p1 + 1`, `m`), y
 * ensancharla debe ser una decisión deliberada y no un descuido.
 */
import type { Ejemplo, GraphState } from "../types";

export const CAPAS = ["ejes", "linea", "interceptos", "conjunto", "pendiente"] as const;
export const DESTACADOS = ["ninguno", "intercepto_x1", "intercepto_x2", "pendiente"] as const;
export const FANTASMAS = ["base", "ninguno"] as const;
export const VARIABLES = ["p1", "p2", "m"] as const;
export const OPERADORES = ["+", "-", "*", "/"] as const;

export type Capa = (typeof CAPAS)[number];
export type Destacado = (typeof DESTACADOS)[number];

/** Una operación. Exactamente una clave por objeto: dos claves es un error, no una
 *  abreviatura, porque el orden entre ellas no estaría definido en el documento. */
export type Op =
  | { mostrar: Capa | Capa[] }
  | { ocultar: Capa | Capa[] }
  | { destacar: Destacado }
  | { fantasma: (typeof FANTASMAS)[number] }
  //: `null` significa "esta variable no cambia". Existe porque el modo estricto de
  //: OpenAI exige que TODAS las propiedades estén en `required`, así que un modelo no
  //: puede expresar "cambia solo p1" omitiendo p2 y m: los manda en null. El intérprete
  //: los ignora, y por eso `{set: {p1: null, p2: null, m: null}}` es un no-op legal y no
  //: un error — de lo contrario el esquema y el intérprete se contradirían.
  | { set: Partial<Record<(typeof VARIABLES)[number], string | number | null>> };

export interface GraphScript {
  version: 1;
  /** cue id -> operaciones, en orden. Un cue sin entrada no cambia nada. */
  cues: Record<string, Op[]>;
}

export class ScriptError extends Error {}

/**
 * Evalúa una expresión contra el ejemplo base.
 *
 * A mano y no con `Function`: estos documentos van a venir de un modelo, y `Function` con
 * texto generado es ejecución arbitraria en el navegador del estudiante. El tamaño de
 * este parser —veinte líneas— es el precio de que eso no pueda pasar nunca.
 */
export function evaluar(expr: string | number, base: Ejemplo): number {
  if (typeof expr === "number") {
    if (!Number.isFinite(expr)) throw new ScriptError(`número no finito: ${expr}`);
    return expr;
  }
  const t = String(expr).trim();
  const m = /^([A-Za-z_][A-Za-z0-9_]*|-?\d+(?:\.\d+)?)(?:\s*([+\-*/])\s*([A-Za-z_][A-Za-z0-9_]*|-?\d+(?:\.\d+)?))?$/.exec(t);
  if (!m) throw new ScriptError(`expresión fuera de la gramática: "${t}"`);

  const term = (s: string): number => {
    if (/^-?\d/.test(s)) return Number(s);
    if (!(VARIABLES as readonly string[]).includes(s)) {
      throw new ScriptError(`variable desconocida "${s}"; solo ${VARIABLES.join(", ")}`);
    }
    return base[s as (typeof VARIABLES)[number]];
  };

  const a = term(m[1]);
  if (!m[2]) return a;
  const b = term(m[3]);
  switch (m[2]) {
    case "+": return a + b;
    case "-": return a - b;
    case "*": return a * b;
    case "/":
      // Un modelo que emite `m / 0` produce Infinity, que dibuja una recta sin
      // interceptos y ninguna excepción. Ruidoso, entonces.
      if (b === 0) throw new ScriptError(`división por cero en "${t}"`);
      return a / b;
    default: throw new ScriptError(`operador desconocido "${m[2]}"`);
  }
}

function comoLista(v: Capa | Capa[]): Capa[] {
  return Array.isArray(v) ? v : [v];
}

/** Aplica las operaciones de un cue. Estado nuevo; el de entrada no se toca. */
export function aplicarOps(s: GraphState, ops: Op[], base: Ejemplo): GraphState {
  const n: GraphState = { ...s, mostrar: { ...s.mostrar } };
  for (const op of ops) {
    const claves = Object.keys(op);
    if (claves.length !== 1) {
      throw new ScriptError(
        `una operación lleva exactamente una clave, esta lleva ${claves.length}: ` +
        `${claves.join(", ")}`,
      );
    }
    if ("mostrar" in op) {
      for (const c of comoLista(op.mostrar)) n.mostrar[c] = true;
    } else if ("ocultar" in op) {
      for (const c of comoLista(op.ocultar)) n.mostrar[c] = false;
    } else if ("destacar" in op) {
      n.destacar = op.destacar;
    } else if ("fantasma" in op) {
      n.fantasma = op.fantasma === "base"
        ? { p1: base.p1, p2: base.p2, m: base.m }
        : null;
    } else if ("set" in op) {
      for (const [k, v] of Object.entries(op.set)) {
        if (v === null || v === undefined) continue;
        n[k as (typeof VARIABLES)[number]] = evaluar(v as string | number, base);
      }
    } else {
      throw new ScriptError(`operación desconocida: ${claves[0]}`);
    }
  }
  return n;
}

/**
 * Comprueba un documento entero SIN ejecutarlo, y devuelve todos los errores.
 *
 * Todos y no el primero: quien lo va a leer es un bucle que le devuelve los fallos a un
 * modelo para que reescriba, y darle uno por vuelta convierte una corrección en diez
 * llamadas.
 */
export function revisar(script: GraphScript, base: Ejemplo,
                        cuesConocidos?: Set<string>): string[] {
  const errs: string[] = [];
  if (script.version !== 1) errs.push(`version debe ser 1, es ${script.version}`);
  if (!script.cues || typeof script.cues !== "object") {
    errs.push("falta el objeto `cues`");
    return errs;
  }
  for (const [cue, ops] of Object.entries(script.cues)) {
    if (cuesConocidos && !cuesConocidos.has(cue)) {
      errs.push(`${cue}: no existe ningún cue con ese id en la timeline`);
    }
    if (!Array.isArray(ops)) {
      errs.push(`${cue}: las operaciones deben ser una lista`);
      continue;
    }
    ops.forEach((op, i) => {
      const donde = `${cue}[${i}]`;
      const claves = Object.keys(op ?? {});
      if (claves.length !== 1) {
        errs.push(`${donde}: una operación lleva exactamente una clave, lleva ${claves.length}`);
        return;
      }
      const k = claves[0];
      if (k === "mostrar" || k === "ocultar") {
        for (const c of comoLista((op as Record<string, Capa | Capa[]>)[k])) {
          if (!(CAPAS as readonly string[]).includes(c)) {
            errs.push(`${donde}: capa desconocida "${c}"; solo ${CAPAS.join(", ")}`);
          }
        }
      } else if (k === "destacar") {
        const v = (op as { destacar: string }).destacar;
        if (!(DESTACADOS as readonly string[]).includes(v)) {
          errs.push(`${donde}: destacar "${v}"; solo ${DESTACADOS.join(", ")}`);
        }
      } else if (k === "fantasma") {
        const v = (op as { fantasma: string }).fantasma;
        if (!(FANTASMAS as readonly string[]).includes(v)) {
          errs.push(`${donde}: fantasma "${v}"; solo ${FANTASMAS.join(", ")}`);
        }
      } else if (k === "set") {
        const v = (op as { set: Record<string, unknown> }).set;
        if (!v || typeof v !== "object" || !Object.keys(v).length) {
          errs.push(`${donde}: set vacío`);
          return;
        }
        if (Object.values(v).every((x) => x === null || x === undefined)) {
          errs.push(`${donde}: set con las tres variables a null; no hace nada`);
          return;
        }
        for (const [nombre, expr] of Object.entries(v)) {
          if (!(VARIABLES as readonly string[]).includes(nombre)) {
            errs.push(`${donde}: set a "${nombre}"; solo ${VARIABLES.join(", ")}`);
          }
          if (expr === null || expr === undefined) continue;   // "no cambia"
          try {
            evaluar(expr as string | number, base);
          } catch (e) {
            errs.push(`${donde}: ${(e as Error).message}`);
          }
        }
      } else {
        errs.push(`${donde}: operación desconocida "${k}"`);
      }
    });
  }
  return errs;
}

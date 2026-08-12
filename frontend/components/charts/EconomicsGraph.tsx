"use client";

import { useEffect, useRef } from "react";

export type GraphSpec =
  | { type: "budget_line"; m: number; p1: number; p2: number; interactive?: boolean }
  | { type: "budget_line_shift"; m1: number; m2: number; p1: number; p2: number }
  | { type: "budget_line_pivot"; m: number; p1_old: number; p1_new: number; p2: number };

type Props = { spec: GraphSpec; height?: number };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyJXG = any;

type BBox = [number, number, number, number]; // [xMin, yMax, xMax, yMin]

function getBBox(spec: GraphSpec): BBox {
  switch (spec.type) {
    case "budget_line": {
      const xInt = spec.m / spec.p1;
      const yInt = spec.m / spec.p2;
      const topPad = spec.interactive ? 1.55 : 1.28;
      return [-xInt * 0.09, yInt * topPad, xInt * 1.3, -yInt * 0.09];
    }
    case "budget_line_shift": {
      const xInt = Math.max(spec.m1, spec.m2) / spec.p1;
      const yInt = Math.max(spec.m1, spec.m2) / spec.p2;
      return [-xInt * 0.09, yInt * 1.55, xInt * 1.32, -yInt * 0.09];
    }
    case "budget_line_pivot": {
      const xInt = Math.max(spec.m / spec.p1_old, spec.m / spec.p1_new);
      const yInt = spec.m / spec.p2;
      return [-xInt * 0.09, yInt * 1.55, xInt * 1.32, -yInt * 0.09];
    }
  }
}

const POLY_STYLE = {
  fillOpacity: 0.12,
  strokeColor: "transparent",
  strokeWidth: 0,
  borders: { strokeColor: "transparent", strokeWidth: 0 },
  vertices: { visible: false },
} as const;

const POINT_STYLE = {
  size: 4,
  fixed: true,
  label: { visible: false },
  highlightFillColor: "none",
  highlightStrokeColor: "none",
} as const;

function axisLabels(board: AnyJXG, bbox: BBox) {
  const [xMin, yTop, xMax, yBot] = bbox;
  const xRange = xMax - xMin;
  const yRange = yTop - yBot;
  board.create("text", [xMax - xRange * 0.02, yBot + yRange * 0.02, "x₁"], {
    fontSize: 12, color: "#374151", fixed: true, anchorX: "right",
  });
  board.create("text", [xMin + xRange * 0.01, yTop - yRange * 0.01, "x₂"], {
    fontSize: 12, color: "#374151", fixed: true, anchorY: "top",
  });
}

function drawBudgetLine(
  board: AnyJXG,
  spec: Extract<GraphSpec, { type: "budget_line" }>,
  bbox: BBox,
) {
  const { m, p1, p2, interactive } = spec;
  const [xMin, yTop, xMax, yBot] = bbox;
  const xRange = xMax - xMin;
  const yRange = yTop - yBot;
  const origin = board.create("point", [0, 0], { visible: false, fixed: true });

  if (interactive) {
    const yS = yTop - yRange * 0.055;
    const sw = xRange * 0.22;

    const sliderBase = {
      size: 3,
      label: { fontSize: 11, color: "#374151", offset: [0, -14] },
      point1: { visible: false },
      point2: { visible: false },
      baseline: { strokeColor: "#d1d5db", strokeWidth: 3 },
      highline: { strokeColor: "#3b82f6", strokeWidth: 3 },
      fillColor: "#3b82f6",
      strokeColor: "#3b82f6",
    };

    const slM = board.create("slider", [
      [xMin + xRange * 0.02, yS], [xMin + xRange * 0.02 + sw, yS],
      [10, m, 300],
    ], { ...sliderBase, name: "m", snapWidth: 5 });

    const slP1 = board.create("slider", [
      [xMin + xRange * 0.38, yS], [xMin + xRange * 0.38 + sw, yS],
      [1, p1, 30],
    ], { ...sliderBase, name: "p₁", snapWidth: 1 });

    const slP2 = board.create("slider", [
      [xMin + xRange * 0.74, yS], [xMin + xRange * 0.74 + sw, yS],
      [1, p2, 30],
    ], { ...sliderBase, name: "p₂", snapWidth: 1 });

    const ptX = board.create("point",
      [() => slM.Value() / slP1.Value(), 0],
      { ...POINT_STYLE, name: "", color: "#3b82f6" },
    );
    const ptY = board.create("point",
      [0, () => slM.Value() / slP2.Value()],
      { ...POINT_STYLE, name: "", color: "#3b82f6" },
    );

    board.create("polygon", [origin, ptY, ptX], { ...POLY_STYLE, fillColor: "#3b82f6" });
    board.create("segment", [ptY, ptX], { strokeColor: "#3b82f6", strokeWidth: 2.5 });

    // Intercept labels
    board.create("text",
      [() => slM.Value() / slP1.Value() + xRange * 0.015, yBot + yRange * 0.03,
        () => (slM.Value() / slP1.Value()).toFixed(1)],
      { fontSize: 11, color: "#3b82f6", fixed: true },
    );
    board.create("text",
      [xMin + xRange * 0.015, () => slM.Value() / slP2.Value(),
        () => (slM.Value() / slP2.Value()).toFixed(1)],
      { fontSize: 11, color: "#3b82f6", fixed: true },
    );

    // Equation text
    board.create("text",
      [xMin + xRange * 0.02, yTop - yRange * 0.145,
        () => {
          const mV = Math.round(slM.Value());
          const p1V = Math.round(slP1.Value());
          const p2V = Math.round(slP2.Value());
          return `${p1V}x₁ + ${p2V}x₂ = ${mV}   |   pendiente = −${(p1V / p2V).toFixed(2)}`;
        }],
      { fontSize: 11, color: "#374151", fixed: true },
    );

  } else {
    const xInt = m / p1;
    const yInt = m / p2;

    const ptX = board.create("point", [xInt, 0], { ...POINT_STYLE, name: "", color: "#3b82f6" });
    const ptY = board.create("point", [0, yInt], { ...POINT_STYLE, name: "", color: "#3b82f6" });

    board.create("polygon", [origin, ptY, ptX], { ...POLY_STYLE, fillColor: "#3b82f6" });
    board.create("segment", [ptY, ptX], { strokeColor: "#3b82f6", strokeWidth: 2.5 });

    board.create("text", [xInt + xRange * 0.015, yBot + yRange * 0.035, `m/p₁ = ${xInt}`],
      { fontSize: 11, color: "#3b82f6", fixed: true });
    board.create("text", [xMin + xRange * 0.015, yInt, `m/p₂ = ${yInt}`],
      { fontSize: 11, color: "#3b82f6", fixed: true });
    board.create("text",
      [xMin + xRange * 0.02, yTop - yRange * 0.07,
        `${p1}x₁ + ${p2}x₂ = ${m}   |   pendiente = −${(p1 / p2).toFixed(2)}`],
      { fontSize: 11, color: "#374151", fixed: true });
  }

  axisLabels(board, bbox);
}

function drawBudgetLineShift(
  board: AnyJXG,
  spec: Extract<GraphSpec, { type: "budget_line_shift" }>,
  bbox: BBox,
) {
  const { m1, m2, p1, p2 } = spec;
  const [xMin, yTop, xMax, yBot] = bbox;
  const xRange = xMax - xMin;
  const yRange = yTop - yBot;
  const origin = board.create("point", [0, 0], { visible: false, fixed: true });

  // Fixed reference line at m1 (dashed gray)
  const ptY1 = board.create("point", [0, m1 / p2], { visible: false, fixed: true });
  const ptX1 = board.create("point", [m1 / p1, 0], { visible: false, fixed: true });
  board.create("polygon", [origin, ptY1, ptX1], { ...POLY_STYLE, fillColor: "#9ca3af" });
  board.create("segment", [ptY1, ptX1], { strokeColor: "#9ca3af", strokeWidth: 2, dash: 2 });
  board.create("point", [m1 / p1, 0], { ...POINT_STYLE, name: "", color: "#9ca3af" });
  board.create("point", [0, m1 / p2], { ...POINT_STYLE, name: "", color: "#9ca3af" });
  board.create("text", [m1 / p1 + xRange * 0.015, yBot + yRange * 0.035, `${Math.round(m1 / p1)}`],
    { fontSize: 11, color: "#9ca3af", fixed: true });
  board.create("text", [xMin + xRange * 0.015, m1 / p2, `${Math.round(m1 / p2)}`],
    { fontSize: 11, color: "#9ca3af", fixed: true });

  // Slider for income
  const yS = yTop - yRange * 0.055;
  const sw = xRange * 0.5;
  const slM = board.create("slider", [
    [xMin + xRange * 0.2, yS], [xMin + xRange * 0.2 + sw, yS],
    [m1, m1, m2],
  ], {
    name: "m", snapWidth: 5, size: 3,
    label: { fontSize: 11, color: "#374151", offset: [0, -14] },
    point1: { visible: false }, point2: { visible: false },
    baseline: { strokeColor: "#d1d5db", strokeWidth: 3 },
    highline: { strokeColor: "#3b82f6", strokeWidth: 3 },
    fillColor: "#3b82f6", strokeColor: "#3b82f6",
  });

  // Reactive line controlled by slider
  const ptX2 = board.create("point", [() => slM.Value() / p1, 0], { ...POINT_STYLE, name: "", color: "#3b82f6" });
  const ptY2 = board.create("point", [0, () => slM.Value() / p2], { ...POINT_STYLE, name: "", color: "#3b82f6" });
  board.create("polygon", [origin, ptY2, ptX2], { ...POLY_STYLE, fillColor: "#3b82f6" });
  board.create("segment", [ptY2, ptX2], { strokeColor: "#3b82f6", strokeWidth: 2.5 });

  board.create("text",
    [() => slM.Value() / p1 + xRange * 0.015, yBot + yRange * 0.035,
      () => `${(slM.Value() / p1).toFixed(1)}`],
    { fontSize: 11, color: "#3b82f6", fixed: true });
  board.create("text",
    [xMin + xRange * 0.015, () => slM.Value() / p2,
      () => `${(slM.Value() / p2).toFixed(1)}`],
    { fontSize: 11, color: "#3b82f6", fixed: true });

  board.create("text",
    [xMin + xRange * 0.02, yTop - yRange * 0.145,
      () => `m = ${Math.round(slM.Value())}   →   desplazamiento paralelo`],
    { fontSize: 11, color: "#374151", fixed: true });

  axisLabels(board, bbox);
}

function drawBudgetLinePivot(
  board: AnyJXG,
  spec: Extract<GraphSpec, { type: "budget_line_pivot" }>,
  bbox: BBox,
) {
  const { m, p1_old, p1_new, p2 } = spec;
  const [xMin, yTop, xMax, yBot] = bbox;
  const xRange = xMax - xMin;
  const yRange = yTop - yBot;
  const origin = board.create("point", [0, 0], { visible: false, fixed: true });
  const yInt = m / p2;

  // Shared y-intercept point (pivot point — stays fixed as p1 changes)
  const ptShared = board.create("point", [0, yInt], { ...POINT_STYLE, name: "", color: "#6b7280" });
  board.create("text", [xMin + xRange * 0.015, yInt, `${Math.round(yInt)}`],
    { fontSize: 11, color: "#6b7280", fixed: true });

  // Fixed reference line at p1_old (dashed gray)
  const ptX1 = board.create("point", [m / p1_old, 0], { visible: false, fixed: true });
  board.create("polygon", [origin, ptShared, ptX1], { ...POLY_STYLE, fillColor: "#9ca3af" });
  board.create("segment", [ptShared, ptX1], { strokeColor: "#9ca3af", strokeWidth: 2, dash: 2 });
  board.create("point", [m / p1_old, 0], { ...POINT_STYLE, name: "", color: "#9ca3af" });
  board.create("text", [m / p1_old + xRange * 0.015, yBot + yRange * 0.035, `${Math.round(m / p1_old)}`],
    { fontSize: 11, color: "#9ca3af", fixed: true });

  // Slider for p1 (from p1_old down to p1_new — price falling rotates line outward)
  const yS = yTop - yRange * 0.055;
  const sw = xRange * 0.5;
  const slP1 = board.create("slider", [
    [xMin + xRange * 0.2, yS], [xMin + xRange * 0.2 + sw, yS],
    [p1_new, p1_old, p1_old],
  ], {
    name: "p₁", snapWidth: 1, size: 3,
    label: { fontSize: 11, color: "#374151", offset: [0, -14] },
    point1: { visible: false }, point2: { visible: false },
    baseline: { strokeColor: "#d1d5db", strokeWidth: 3 },
    highline: { strokeColor: "#10b981", strokeWidth: 3 },
    fillColor: "#10b981", strokeColor: "#10b981",
  });

  // Reactive pivot line
  const ptX2 = board.create("point", [() => m / slP1.Value(), 0], { ...POINT_STYLE, name: "", color: "#10b981" });
  board.create("polygon", [origin, ptShared, ptX2], { ...POLY_STYLE, fillColor: "#10b981" });
  board.create("segment", [ptShared, ptX2], { strokeColor: "#10b981", strokeWidth: 2.5 });

  board.create("text",
    [() => m / slP1.Value() + xRange * 0.015, yBot + yRange * 0.035,
      () => `${(m / slP1.Value()).toFixed(1)}`],
    { fontSize: 11, color: "#10b981", fixed: true });

  board.create("text",
    [xMin + xRange * 0.02, yTop - yRange * 0.145,
      () => {
        const p1V = slP1.Value().toFixed(1);
        const slope = (slP1.Value() / p2).toFixed(2);
        return `p₁ = ${p1V}   →   pendiente = −${slope}`;
      }],
    { fontSize: 11, color: "#374151", fixed: true });

  axisLabels(board, bbox);
}

export default function EconomicsGraph({ spec, height = 380 }: Props) {
  const boardId = useRef(`jxg-${Math.random().toString(36).slice(2)}`);
  const boardRef = useRef<AnyJXG>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const id = boardId.current;
    let rafId: number;

    function tryInit() {
      const JXG: AnyJXG = (window as AnyJXG).JXG;
      if (!JXG?.JSXGraph) {
        rafId = requestAnimationFrame(tryInit);
        return;
      }
      doInit(JXG);
    }

    function doInit(JXG: AnyJXG) {
      if (boardRef.current) {
        JXG.JSXGraph.freeBoard(boardRef.current);
        boardRef.current = null;
      }

      const bbox = getBBox(spec);
      let board: AnyJXG;
      try {
        board = JXG.JSXGraph.initBoard(id, {
          boundingbox: bbox,
          axis: true,
          showCopyright: false,
          showNavigation: false,
          pan: { enabled: false },
          zoom: { enabled: false },
          defaultAxes: {
            x: {
              strokeColor: "#9ca3af", strokeWidth: 1,
              ticks: { strokeColor: "#e5e7eb", label: { color: "#9ca3af", fontSize: 10 } },
            },
            y: {
              strokeColor: "#9ca3af", strokeWidth: 1,
              ticks: { strokeColor: "#e5e7eb", label: { color: "#9ca3af", fontSize: 10 } },
            },
          },
        });
      } catch {
        return;
      }
      boardRef.current = board;

      switch (spec.type) {
        case "budget_line":      drawBudgetLine(board, spec, bbox);      break;
        case "budget_line_shift": drawBudgetLineShift(board, spec, bbox); break;
        case "budget_line_pivot": drawBudgetLinePivot(board, spec, bbox); break;
      }
    }

    tryInit();

    return () => {
      cancelAnimationFrame(rafId);
      const JXG: AnyJXG = (window as AnyJXG).JXG;
      if (boardRef.current && JXG?.JSXGraph) {
        JXG.JSXGraph.freeBoard(boardRef.current);
        boardRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(spec)]);

  return (
    <div
      id={boardId.current}
      style={{ width: "100%", height: `${height}px` }}
      className="rounded-xl overflow-hidden border border-gray-100 bg-white"
    />
  );
}

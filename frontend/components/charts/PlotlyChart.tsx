"use client";

import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

type Props = {
  data: Plotly.Data[];
  layout: Partial<Plotly.Layout>;
};

export default function PlotlyChart({ data, layout }: Props) {
  return (
    <Plot
      data={data}
      layout={{ ...layout, autosize: true, margin: { l: 50, r: 20, t: 40, b: 50 } }}
      style={{ width: "100%", maxWidth: 520 }}
      config={{ displayModeBar: false, responsive: true }}
    />
  );
}

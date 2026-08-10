"use client";

import dynamic from "next/dynamic";

const PlotlyChart = dynamic(() => import("@/components/charts/PlotlyChart"), { ssr: false });

type Props = {
  role: "user" | "assistant";
  content: string;
};

function parseContent(content: string) {
  const parts: { type: "text" | "graph"; value: string }[] = [];
  // Strip MASTERY_UPDATE blocks — invisible to the student
  const clean = content.replace(/\[MASTERY_UPDATE\][\s\S]*?\[\/MASTERY_UPDATE\]/g, "").trim();
  const regex = /\[GRAPH\]([\s\S]*?)\[\/GRAPH\]/g;
  let last = 0;
  let match;

  while ((match = regex.exec(clean)) !== null) {
    if (match.index > last) parts.push({ type: "text", value: clean.slice(last, match.index) });
    parts.push({ type: "graph", value: match[1] });
    last = match.index + match[0].length;
  }
  if (last < clean.length) parts.push({ type: "text", value: clean.slice(last) });
  return parts;
}

export default function MessageBubble({ role, content }: Props) {
  const isUser = role === "user";
  const parts = parseContent(content);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isUser ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-800"}`}>
        {parts.map((part, i) => {
          if (part.type === "graph") {
            try {
              const parsed = JSON.parse(part.value);
              return (
                <div key={i} className="my-3 bg-white rounded-xl overflow-hidden">
                  <PlotlyChart data={parsed.data} layout={parsed.layout} />
                </div>
              );
            } catch {
              return null;
            }
          }
          return (
            <p key={i} className="text-sm whitespace-pre-wrap leading-relaxed">
              {part.value}
            </p>
          );
        })}
      </div>
    </div>
  );
}

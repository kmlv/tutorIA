"use client";

import dynamic from "next/dynamic";
import type { GraphSpec } from "@/components/charts/EconomicsGraph";
import katex from "katex";

const EconomicsGraph = dynamic(() => import("@/components/charts/EconomicsGraph"), { ssr: false });

type Props = {
  role: "user" | "assistant";
  content: string;
};

function renderMath(tex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(tex, { displayMode, throwOnError: false });
  } catch {
    return tex;
  }
}

function extractTex(token: string): { tex: string; display: boolean } {
  if (token.startsWith("\\[")) return { tex: token.slice(2, -2).trim(), display: true };
  if (token.startsWith("\\(")) return { tex: token.slice(2, -2).trim(), display: false };
  if (token.startsWith("$$"))  return { tex: token.slice(2, -2).trim(), display: true };
  return { tex: token.slice(1, -1), display: false }; // $...$
}

function parseInline(text: string): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  // Handles \[...\]  \(...\)  $$...$$  $...$  **...**  in that priority order
  const re = /(\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$\$[\s\S]+?\$\$|\$[^$\n]+\$|\*\*[^*]+\*\*)/g;
  let last = 0;
  let key = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) result.push(text.slice(last, m.index));
    const token = m[0];
    if (token.startsWith("**")) {
      result.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
    } else {
      const { tex, display } = extractTex(token);
      result.push(
        <span key={key++}
          className={display ? "block text-center py-1 overflow-x-auto" : undefined}
          dangerouslySetInnerHTML={{ __html: renderMath(tex, display) }} />
      );
    }
    last = m.index + token.length;
  }
  if (last < text.length) result.push(text.slice(last));
  return result;
}

function renderLines(text: string) {
  const nodes: React.ReactNode[] = [];
  let key = 0;

  // Pull out multi-line \[...\] and $$...$$ blocks before splitting by newline
  const blockRe = /\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$/g;
  let last = 0;
  let m;

  const addLines = (chunk: string) => {
    chunk.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed === "") {
        nodes.push(<div key={key++} className="h-1" />);
      } else {
        nodes.push(<p key={key++} className="text-sm leading-relaxed">{parseInline(line)}</p>);
      }
    });
  };

  while ((m = blockRe.exec(text)) !== null) {
    if (m.index > last) addLines(text.slice(last, m.index));
    const tex = m[0].startsWith("\\[") ? m[0].slice(2, -2).trim() : m[0].slice(2, -2).trim();
    nodes.push(
      <div key={key++} className="py-2 flex justify-center overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: renderMath(tex, true) }} />
    );
    last = m.index + m[0].length;
  }

  if (last < text.length) addLines(text.slice(last));
  return nodes;
}

function parseContent(content: string) {
  const parts: { type: "text" | "graph"; value: string }[] = [];
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
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-800"
        }`}
      >
        {parts.map((part, i) => {
          if (part.type === "graph") {
            try {
              const spec = JSON.parse(part.value.trim()) as GraphSpec;
              return (
                <div key={i} className="my-3 w-72 rounded-xl overflow-hidden">
                  <EconomicsGraph spec={spec} height={260} />
                </div>
              );
            } catch {
              return null;
            }
          }
          return (
            <div key={i}>
              {isUser
                ? <p className="text-sm whitespace-pre-wrap leading-relaxed">{part.value}</p>
                : renderLines(part.value)
              }
            </div>
          );
        })}
      </div>
    </div>
  );
}

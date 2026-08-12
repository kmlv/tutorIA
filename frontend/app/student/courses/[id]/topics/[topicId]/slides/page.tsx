"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import dynamic from "next/dynamic";
import type { GraphSpec } from "@/components/charts/EconomicsGraph";
import katex from "katex";
import MessageBubble from "@/components/chat/MessageBubble";

const EconomicsGraph = dynamic(() => import("@/components/charts/EconomicsGraph"), { ssr: false });
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Slide = { id: number; type: "text" | "graph"; content: string; order: number };
type Message = { role: "user" | "assistant"; content: string };

// ── Markdown + KaTeX renderer ──────────────────────────────────────────────

function renderMath(tex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(tex, { displayMode, throwOnError: false });
  } catch {
    return tex;
  }
}

function parseInline(text: string): React.ReactNode[] {
  const result: React.ReactNode[] = [];
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
      const display = token.startsWith("\\[") || token.startsWith("$$");
      const tex = (token.startsWith("\\[") || token.startsWith("$$"))
        ? token.slice(2, -2).trim()
        : token.startsWith("\\(") ? token.slice(2, -2).trim() : token.slice(1, -1);
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

function TextSlide({ content }: { content: string }) {
  const nodes: React.ReactNode[] = [];
  let key = 0;

  const blockRe = /\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$/g;
  let last = 0;
  let m;

  const addLines = (chunk: string) => {
    chunk.split("\n").forEach((line) => {
      if (line.startsWith("# ")) { nodes.push(<h2 key={key++} className="text-xl font-bold text-gray-900">{line.slice(2)}</h2>); return; }
      if (line.startsWith("## ")) { nodes.push(<h3 key={key++} className="text-lg font-semibold text-gray-800">{line.slice(3)}</h3>); return; }
      if (line.trim() === "") { nodes.push(<div key={key++} className="h-2" />); return; }
      nodes.push(<p key={key++} className="text-gray-700 leading-relaxed text-[15px]">{parseInline(line)}</p>);
    });
  };

  while ((m = blockRe.exec(content)) !== null) {
    if (m.index > last) addLines(content.slice(last, m.index));
    const tex = m[0].startsWith("\\[") ? m[0].slice(2, -2).trim() : m[0].slice(2, -2).trim();
    nodes.push(
      <div key={key++} className="py-3 flex justify-center overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: renderMath(tex, true) }} />
    );
    last = m.index + m[0].length;
  }

  if (last < content.length) addLines(content.slice(last));

  return <div className="space-y-3">{nodes}</div>;
}

function GraphSlide({ content }: { content: string }) {
  try {
    return <EconomicsGraph spec={JSON.parse(content) as GraphSpec} height={380} />;
  } catch {
    return <p className="text-red-500 text-sm">Error al cargar la gráfica.</p>;
  }
}

// ── Quick-reply chips shown during evaluation ───────────────────────────────

const CHIPS = [
  { label: "Otro ejemplo", message: "Dame un ejemplo diferente con otros números" },
  { label: "No entendí", message: "No entendí, ¿puedes explicarlo de otra forma?" },
  { label: "Más simple", message: "Puedes simplificarlo, ¿con números más fáciles?" },
];

// ── Main page ───────────────────────────────────────────────────────────────

export default function SlidesPage() {
  const router = useRouter();
  const { id, topicId } = useParams<{ id: string; topicId: string }>();

  // null = not yet loaded (prevents flash to wrong slide)
  const [slides, setSlides] = useState<Slide[]>([]);
  const [current, setCurrent] = useState<number | null>(null);
  const [topicTitle, setTopicTitle] = useState("");

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [chatReady, setChatReady] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Derived
  const isChatSlide = current !== null && slides.length > 0 && current === slides.length;
  const totalSteps = slides.length + 1;
  const progress = current === null || slides.length === 0
    ? 0
    : ((current + 1) / totalSteps) * 100;

  // ── Load slides + completion status ───────────────────────────────────────

  useEffect(() => {
    Promise.all([
      apiFetch(`/slides/topic/${topicId}`),
      apiFetch(`/courses/enrolled`),
      apiFetch(`/slides/topic/${topicId}/completed`).catch(() => ({ completed: false })),
    ]).then(([slidesData, enrollments, completedData]: [
      Slide[],
      { course: { id: number; topics: { id: number; title: string }[] } }[],
      { completed: boolean },
    ]) => {
      setSlides(slidesData);
      for (const e of enrollments) {
        if (e.course.id === Number(id)) {
          const t = e.course.topics.find((t) => t.id === Number(topicId));
          if (t) setTopicTitle(t.title);
        }
      }
      // If already completed, start at the chat slide
      setCurrent(completedData?.completed && slidesData.length > 0 ? slidesData.length : 0);
    }).catch(() => router.replace("/login"));
  }, [topicId, id, router]);

  // ── Init chat when entering evaluation slide ───────────────────────────────

  useEffect(() => {
    if (!isChatSlide || chatReady) return;

    async function initChat() {
      // Mark slides as complete (idempotent)
      await apiFetch(`/slides/topic/${topicId}/complete`, { method: "POST" }).catch(() => {});

      // Restore existing history if any (student chose "Continuar")
      const history: Message[] = await apiFetch(`/chat/topic/${topicId}/history`).catch(() => []);
      if (history.length > 0) {
        setMessages(history);
        setChatReady(true);
        return;
      }

      // No history → stream first question via /begin
      setStreaming(true);
      setMessages([{ role: "assistant", content: "" }]);

      try {
        const { getToken } = await import("@/lib/auth");
        const token = getToken();
        const res = await fetch(`${API_URL}/chat/topic/${topicId}/begin`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 204 || !res.body) {
          const retryHistory: Message[] = await apiFetch(`/chat/topic/${topicId}/history`).catch(() => []);
          setMessages(retryHistory);
        } else {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                role: "assistant",
                content: updated[updated.length - 1].content + chunk,
              };
              return updated;
            });
          }
        }
      } finally {
        setStreaming(false);
        setChatReady(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }

    initChat();
  }, [isChatSlide, chatReady, topicId]);

  // ── Auto-scroll on new messages ────────────────────────────────────────────

  useEffect(() => {
    if (isChatSlide) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isChatSlide]);

  // ── Send a message (used by input and chips) ───────────────────────────────

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || streaming || !chatReady) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setStreaming(true);

    try {
      const { getToken } = await import("@/lib/auth");
      const token = getToken();
      const res = await fetch(`${API_URL}/chat/topic/${topicId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: text }),
      });

      if (!res.ok || !res.body) return;

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: updated[updated.length - 1].content + chunk,
          };
          return updated;
        });
      }
    } finally {
      setStreaming(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [streaming, chatReady, topicId]);

  const handleSend = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    await sendMessage(text);
  }, [input, sendMessage]);

  // ── Loading state ──────────────────────────────────────────────────────────

  if (current === null || slides.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Cargando...</div>
      </div>
    );
  }

  const slide = slides[current];
  const isLastContentSlide = current === slides.length - 1;

  return (
    <div className="flex flex-col h-screen bg-gray-50">

      {/* ── Nav bar ── */}
      <nav className="bg-white border-b px-6 py-4 flex items-center justify-between shrink-0">
        <button
          onClick={() => router.push(`/student/courses/${id}/topics/${topicId}`)}
          className="text-gray-500 hover:text-gray-800 text-sm shrink-0"
        >
          ← Volver
        </button>
        <span className="font-semibold text-gray-800 text-sm truncate mx-4">{topicTitle}</span>
        <span className="text-xs text-gray-400 shrink-0">
          {isChatSlide ? "Evaluación" : `${current + 1} / ${slides.length}`}
        </span>
      </nav>

      {/* ── Progress bar ── */}
      <div className="h-0.5 bg-gray-100 shrink-0">
        <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* ── Content area ── */}
      {isChatSlide ? (
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-2xl mx-auto">
            {messages.map((msg, i) => (
              <MessageBubble key={i} role={msg.role} content={msg.content} />
            ))}
            {streaming && messages[messages.length - 1]?.role === "assistant" && messages[messages.length - 1]?.content === "" && (
              <div className="flex justify-start mb-4">
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                  <span className="text-gray-400 text-sm">···</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto flex items-start justify-center px-6 py-10">
          <div className="w-full max-w-2xl">
            {slide.type === "text" && <TextSlide content={slide.content} />}
            {slide.type === "graph" && <GraphSlide content={slide.content} />}
          </div>
        </div>
      )}

      {/* ── Bottom bar ── */}
      <div className="bg-white border-t px-6 py-4 shrink-0">
        <div className="max-w-2xl mx-auto">

          {isChatSlide ? (
            <>
              {/* Quick-reply chips */}
              {!streaming && chatReady && (
                <div className="flex gap-2 mb-3 flex-wrap">
                  {CHIPS.map((chip) => (
                    <button
                      key={chip.label}
                      onClick={() => sendMessage(chip.message)}
                      className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Chat input row */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrent(slides.length - 1)}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 shrink-0"
                >
                  ←
                </button>
                <form onSubmit={handleSend} className="flex flex-1 gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={streaming || !chatReady}
                    placeholder={chatReady ? "Escribe tu respuesta..." : "Cargando..."}
                    className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={streaming || !input.trim() || !chatReady}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 shrink-0"
                  >
                    Enviar
                  </button>
                </form>
              </div>
            </>
          ) : (
            /* Content slide navigation */
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrent((c) => Math.max(0, (c ?? 1) - 1))}
                disabled={current === 0}
                className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30 shrink-0"
              >
                ←
              </button>

              {/* Dot navigation */}
              <div className="flex flex-1 justify-center gap-1.5">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={`h-2 rounded-full transition-all ${
                      i === current ? "bg-blue-600 w-4" : i < current ? "bg-blue-300 w-2" : "bg-gray-200 w-2"
                    }`}
                  />
                ))}
                {/* Evaluation dot */}
                <button
                  onClick={() => setCurrent(slides.length)}
                  className="h-2 w-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                  title="Ir a evaluación"
                />
              </div>

              <button
                onClick={() => setCurrent((c) => Math.min(slides.length, (c ?? 0) + 1))}
                className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shrink-0"
              >
                {isLastContentSlide ? "Evaluación →" : "Siguiente →"}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import MessageBubble from "@/components/chat/MessageBubble";

type Message = { role: "user" | "assistant"; content: string };
type SubSkillMastery = {
  code: string;
  title: string;
  p_mastery: number;
  status: "not_started" | "developing" | "mastered";
  evidence_count: number;
  streak_correct: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const CHIPS = [
  { label: "Otro ejemplo", message: "Dame un ejemplo diferente con otros números" },
  { label: "No entendí", message: "No entendí, ¿puedes explicarlo de otra forma?" },
  { label: "Más simple", message: "Puedes simplificarlo, ¿con números más fáciles?" },
];

function MasteryPanel({ mastery }: { mastery: SubSkillMastery[] }) {
  return (
    <aside className="w-72 border-l bg-white overflow-y-auto p-4 shrink-0 hidden lg:block">
      <h2 className="font-semibold text-gray-800 text-sm mb-1">Progreso</h2>
      <p className="text-xs text-gray-400 mb-4">Se actualiza tras cada respuesta</p>
      {mastery.map((ss) => {
        const pct = ss.evidence_count === 0 ? 0 : Math.round(ss.p_mastery * 100);
        const barColor = ss.status === "mastered" ? "bg-green-500" : ss.status === "developing" ? "bg-blue-500" : "bg-gray-200";
        const labelColor = ss.status === "mastered" ? "text-green-600" : ss.status === "developing" ? "text-blue-600" : "text-gray-400";
        return (
          <div key={ss.code} className="mb-5">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[11px] font-mono text-gray-400">{ss.code}</span>
              <span className={`text-[11px] font-medium ${labelColor}`}>
                {ss.status === "mastered" ? "✓ dominada" : ss.evidence_count === 0 ? "—" : `${pct}%`}
              </span>
            </div>
            <p className="text-xs text-gray-700 leading-tight mb-1">{ss.title}</p>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
            </div>
            {ss.streak_correct > 0 && ss.status !== "mastered" && (
              <p className="text-[10px] text-gray-400 mt-0.5">{ss.streak_correct} seguidas ✓</p>
            )}
          </div>
        );
      })}
    </aside>
  );
}

export default function TopicChatPage() {
  const router = useRouter();
  const { id, topicId } = useParams<{ id: string; topicId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [chatReady, setChatReady] = useState(false);
  const [topicTitle, setTopicTitle] = useState("");
  const [mastery, setMastery] = useState<SubSkillMastery[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchMastery = useCallback(async () => {
    try {
      const data = await apiFetch(`/chat/topic/${topicId}/mastery`);
      if (Array.isArray(data)) setMastery(data);
    } catch { /* no sub-skills */ }
  }, [topicId]);

  // Load topic title
  useEffect(() => {
    apiFetch(`/courses/enrolled`).then((enrollments: { course: { id: number; topics: { id: number; title: string }[] } }[]) => {
      for (const e of enrollments) {
        if (e.course.id === Number(id)) {
          const topic = e.course.topics.find((t) => t.id === Number(topicId));
          if (topic) setTopicTitle(topic.title);
        }
      }
    });
    fetchMastery();
  }, [topicId, id, fetchMastery]);

  // Init chat: restore history or start fresh
  useEffect(() => {
    async function initChat() {
      try {
        const history: Message[] = await apiFetch(`/chat/topic/${topicId}/history`).catch(() => []);
        if (history.length > 0) {
          setMessages(history);
          setChatReady(true);
          return;
        }

        setStreaming(true);
        setMessages([{ role: "assistant", content: "" }]);

        const { getToken } = await import("@/lib/auth");
        const token = getToken();
        const res = await fetch(`${API_URL}/chat/topic/${topicId}/begin`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 204 || !res.body) {
          const retry: Message[] = await apiFetch(`/chat/topic/${topicId}/history`).catch(() => []);
          setMessages(retry);
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
      } catch {
        router.replace("/login");
      } finally {
        setStreaming(false);
        setChatReady(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }

    initChat();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      fetchMastery();
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [streaming, chatReady, topicId, fetchMastery]);

  const handleSend = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    await sendMessage(text);
  }, [input, sendMessage]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center gap-4 shrink-0">
        <button
          onClick={() => router.push(`/student/courses/${id}/topics/${topicId}`)}
          className="text-gray-500 hover:text-gray-800 text-sm"
        >
          ← Volver
        </button>
        <span className="font-semibold text-gray-900 text-sm truncate">{topicTitle}</span>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col flex-1 overflow-hidden">
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

          <div className="bg-white border-t px-4 py-4 shrink-0">
            <div className="max-w-2xl mx-auto">
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
              <form onSubmit={handleSend} className="flex gap-3">
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
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  Enviar
                </button>
              </form>
            </div>
          </div>
        </div>

        {mastery.length > 0 && <MasteryPanel mastery={mastery} />}
      </div>
    </div>
  );
}

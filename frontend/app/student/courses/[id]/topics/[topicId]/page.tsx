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

function MasteryPanel({ mastery }: { mastery: SubSkillMastery[] }) {
  return (
    <aside className="w-72 border-l bg-white overflow-y-auto p-4 shrink-0 hidden lg:block">
      <h2 className="font-semibold text-gray-800 text-sm mb-1">Progreso del tema</h2>
      <p className="text-xs text-gray-400 mb-4">Actualizado tras cada respuesta</p>
      {mastery.map((ss) => {
        const pct = ss.evidence_count === 0 ? 0 : Math.round(ss.p_mastery * 100);
        const barColor =
          ss.status === "mastered" ? "bg-green-500" :
          ss.status === "developing" ? "bg-blue-500" : "bg-gray-200";
        const labelColor =
          ss.status === "mastered" ? "text-green-600" :
          ss.status === "developing" ? "text-blue-600" : "text-gray-400";

        return (
          <div key={ss.code} className="mb-5">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[11px] font-mono text-gray-400">{ss.code}</span>
              <span className={`text-[11px] font-medium ${labelColor}`}>
                {ss.status === "mastered" ? "✓ dominada" :
                 ss.evidence_count === 0 ? "—" : `${pct}%`}
              </span>
            </div>
            <p className="text-xs text-gray-700 leading-tight mb-1">{ss.title}</p>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${pct}%` }}
              />
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
  const [topicTitle, setTopicTitle] = useState("");
  const [mastery, setMastery] = useState<SubSkillMastery[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMastery = useCallback(async () => {
    try {
      const data = await apiFetch(`/chat/topic/${topicId}/mastery`);
      if (Array.isArray(data)) setMastery(data);
    } catch {
      // topic has no sub-skills — mastery panel stays hidden
    }
  }, [topicId]);

  useEffect(() => {
    apiFetch(`/chat/topic/${topicId}/history`).then((history: Message[]) => {
      if (history.length === 0) {
        setMessages([{
          role: "assistant",
          content: "Hola! Estoy listo para ayudarte con este tema. ¿Por dónde quieres empezar?",
        }]);
      } else {
        setMessages(history);
      }
    }).catch(() => router.replace("/login"));

    apiFetch(`/courses/enrolled`).then((enrollments: { course: { id: number; title: string; topics: { id: number; title: string }[] } }[]) => {
      for (const e of enrollments) {
        if (e.course.id === Number(id)) {
          const topic = e.course.topics.find((t) => t.id === Number(topicId));
          if (topic) setTopicTitle(topic.title);
        }
      }
    });

    fetchMastery();
  }, [topicId, id, router, fetchMastery]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || streaming) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setStreaming(true);

    const { getToken } = await import("@/lib/auth");
    const token = getToken();

    const res = await fetch(`${API_URL}/chat/topic/${topicId}/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content: userMessage }),
    });

    if (!res.ok || !res.body) {
      setStreaming(false);
      return;
    }

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

    setStreaming(false);
    fetchMastery();
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center gap-4 shrink-0">
        <button onClick={() => router.push(`/student/courses/${id}`)} className="text-gray-500 hover:text-gray-800">
          ← Temario
        </button>
        <span className="font-bold text-gray-900">{topicTitle || "Cargando..."}</span>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Chat column */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-6 max-w-3xl w-full mx-auto">
            {messages.map((msg, i) => (
              <MessageBubble key={i} role={msg.role} content={msg.content} />
            ))}
            {streaming && messages[messages.length - 1]?.role === "assistant" && messages[messages.length - 1]?.content === "" && (
              <div className="flex justify-start mb-4">
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                  <span className="text-gray-400 text-sm animate-pulse">Escribiendo...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSend} className="bg-white border-t px-4 py-4 shrink-0">
            <div className="max-w-3xl mx-auto flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={streaming}
                placeholder="Escribe tu pregunta..."
                className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={streaming || !input.trim()}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Enviar
              </button>
            </div>
          </form>
        </div>

        {/* Mastery sidebar — only renders if topic has sub-skills */}
        {mastery.length > 0 && <MasteryPanel mastery={mastery} />}
      </div>
    </div>
  );
}

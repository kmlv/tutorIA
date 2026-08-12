"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

type SubSkillMastery = {
  code: string;
  title: string;
  p_mastery: number;
  status: "not_started" | "developing" | "mastered";
  evidence_count: number;
};

type Topic = {
  id: number;
  title: string;
  description?: string;
  objectives?: string;
};

export default function TopicEntryPage() {
  const router = useRouter();
  const { id, topicId } = useParams<{ id: string; topicId: string }>();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [mastery, setMastery] = useState<SubSkillMastery[]>([]);
  const [hasSlides, setHasSlides] = useState(false);
  const [slidesCompleted, setSlidesCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [enrollments, slides, masteryData, completedData] = await Promise.all([
          apiFetch(`/courses/enrolled`),
          apiFetch(`/slides/topic/${topicId}`),
          apiFetch(`/chat/topic/${topicId}/mastery`),
          apiFetch(`/slides/topic/${topicId}/completed`),
        ]);

        // Find topic info from enrollments
        for (const e of enrollments) {
          if (e.course.id === Number(id)) {
            const t = e.course.topics.find((t: Topic) => t.id === Number(topicId));
            if (t) setTopic(t);
          }
        }

        setHasSlides(Array.isArray(slides) && slides.length > 0);
        setMastery(Array.isArray(masteryData) ? masteryData : []);
        setSlidesCompleted(completedData?.completed ?? false);
      } catch {
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [topicId, id, router]);

  if (loading || !topic) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Cargando...</div>
      </div>
    );
  }

  const masteredCount = mastery.filter((s) => s.status === "mastered").length;
  const hasProgress = mastery.some((s) => s.evidence_count > 0);
  const hasEvaluationStarted = slidesCompleted || hasProgress;

  async function handleStartFresh() {
    setResetting(true);
    try {
      await apiFetch(`/chat/topic/${topicId}/reset`, { method: "POST" });
      router.push(`/student/courses/${id}/topics/${topicId}/slides`);
    } finally {
      setResetting(false);
    }
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => router.push(`/student/courses/${id}`)}
          className="text-gray-500 hover:text-gray-800 text-sm"
        >
          ← Temario
        </button>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{topic.title}</h1>
          {topic.description && (
            <p className="text-gray-500 text-sm leading-relaxed">{topic.description}</p>
          )}
        </div>

        <div className="h-px bg-gray-200 mb-8" />

        {/* Sub-skills */}
        {mastery.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Habilidades del tema
              </h2>
              {hasProgress && (
                <span className="text-xs text-gray-400">{masteredCount} de {mastery.length} dominadas</span>
              )}
            </div>
            <div className="space-y-2">
              {mastery.map((s) => (
                <div key={s.code} className="flex items-start gap-3">
                  <span className={`text-sm mt-0.5 font-medium ${s.status === "mastered" ? "text-green-600" : "text-gray-300"}`}>
                    {s.status === "mastered" ? "✓" : "○"}
                  </span>
                  <span className="text-sm text-gray-700">{s.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          {hasSlides && (
            <button
              onClick={() => router.push(`/student/courses/${id}/topics/${topicId}/slides`)}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 text-center"
            >
              {!slidesCompleted ? "Ver contenido →" : "Continuar evaluación →"}
            </button>
          )}

          {!hasSlides && (
            <button
              onClick={() => router.push(`/student/courses/${id}/topics/${topicId}/chat`)}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 text-center"
            >
              {hasProgress ? "Continuar evaluación →" : "Ir a evaluación →"}
            </button>
          )}

          {hasEvaluationStarted && (
            <button
              onClick={handleStartFresh}
              disabled={resetting}
              className="w-full py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300 disabled:opacity-50 transition-colors"
            >
              {resetting ? "Reiniciando..." : "Empezar de nuevo"}
            </button>
          )}

        </div>
      </main>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

type Slide = { id: number; type: "text" | "graph"; content: string; order: number };

const GRAPH_PLACEHOLDER = `{
  "data": [{"x": [0, 10], "y": [20, 0], "mode": "lines", "name": "Restricción"}],
  "layout": {"title": "Título", "xaxis": {"title": "Bien 1"}, "yaxis": {"title": "Bien 2"}}
}`;

export default function ProfessorTopicPage() {
  const router = useRouter();
  const { id, topicId } = useParams<{ id: string; topicId: string }>();
  const [topicTitle, setTopicTitle] = useState("");
  const [slides, setSlides] = useState<Slide[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "text", content: "", order: 0 });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch(`/courses/mine`).then((courses: { id: number; topics: { id: number; title: string }[] }[]) => {
      const course = courses.find((c) => c.id === Number(id));
      if (!course) { router.replace("/professor/courses"); return; }
      const topic = course.topics.find((t) => t.id === Number(topicId));
      if (topic) setTopicTitle(topic.title);
    }).catch(() => router.replace("/login"));

    apiFetch(`/slides/topic/${topicId}`)
      .then((data: Slide[]) => setSlides(data))
      .catch(() => {});
  }, [id, topicId, router]);

  async function handleAddSlide(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const slide = await apiFetch(`/slides/topic/${topicId}`, {
        method: "POST",
        body: JSON.stringify({ ...form, order: slides.length + 1 }),
      });
      setSlides((prev) => [...prev, slide]);
      setForm({ type: "text", content: "", order: 0 });
      setShowForm(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(slide: Slide) {
    if (!confirm("¿Eliminar este slide?")) return;
    try {
      await apiFetch(`/slides/${slide.id}`, { method: "DELETE" });
      setSlides((prev) => prev.filter((s) => s.id !== slide.id));
    } catch { alert("Error al eliminar"); }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push(`/professor/courses/${id}`)} className="text-gray-500 hover:text-gray-800 text-sm">
          ← {topicTitle || "Temario"}
        </button>
        <span className="font-bold text-gray-900">{topicTitle}</span>
      </nav>

      <main className="max-w-3xl mx-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Slides del tema</h2>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            + Agregar slide
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAddSlide} className="bg-white rounded-xl shadow p-6 mb-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Nuevo slide</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value, content: e.target.value === "graph" ? GRAPH_PLACEHOLDER : "" })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="text">Texto</option>
                <option value="graph">Gráfica (Plotly JSON)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {form.type === "text" ? "Contenido (usa # para títulos, **texto** para negritas)" : "Plotly JSON"}
              </label>
              <textarea
                required
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={form.type === "graph" ? 10 : 6}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={form.type === "text" ? "# Título del slide\n\nContenido del slide..." : GRAPH_PLACEHOLDER}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {loading ? "Guardando..." : "Guardar slide"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {slides.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-xl shadow">
            <p>Este tema no tiene slides todavía</p>
            <p className="text-sm mt-1">Agrega el primer slide para que los alumnos vean el contenido</p>
          </div>
        ) : (
          <div className="space-y-3">
            {slides.map((slide, i) => (
              <div key={slide.id} className="bg-white rounded-xl shadow p-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-medium shrink-0">{i + 1}</span>
                  <div className="min-w-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full mr-2 ${slide.type === "graph" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                      {slide.type === "graph" ? "Gráfica" : "Texto"}
                    </span>
                    <p className="text-sm text-gray-600 mt-1 truncate">{slide.content.slice(0, 100)}{slide.content.length > 100 ? "..." : ""}</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(slide)} className="text-red-400 hover:text-red-600 text-sm shrink-0">
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

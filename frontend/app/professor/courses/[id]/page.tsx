"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { coursesApi, type Course, type Topic } from "@/lib/courses";

export default function CourseDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", objectives: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    coursesApi.mine().then((courses) => {
      const found = courses.find((c) => c.id === Number(id));
      if (found) setCourse(found);
      else router.replace("/professor/courses");
    }).catch(() => router.replace("/login"));
  }, [id, router]);

  async function handleAddTopic(e: React.FormEvent) {
    e.preventDefault();
    if (!course) return;
    setError("");
    setLoading(true);
    try {
      const order = course.topics.length + 1;
      const topic = await coursesApi.addTopic(course.id, { ...form, order });
      setCourse((prev) => prev ? { ...prev, topics: [...prev.topics, topic] } : prev);
      setForm({ title: "", description: "", objectives: "" });
      setShowForm(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al agregar tema");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteTopic(topic: Topic) {
    if (!confirm(`¿Eliminar el tema "${topic.title}"?`)) return;
    try {
      await coursesApi.deleteTopic(topic.id);
      setCourse((prev) => prev ? { ...prev, topics: prev.topics.filter((t) => t.id !== topic.id) } : prev);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error al eliminar");
    }
  }

  if (!course) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/professor/courses")} className="text-gray-500 hover:text-gray-800">
            ← Mis cursos
          </button>
          <span className="font-bold text-lg text-blue-600">{course.title}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Código de invitación:</span>
          <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg font-mono font-bold tracking-wider">
            {course.invite_code}
          </span>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto p-8">
        {course.description && (
          <p className="text-gray-500 mb-6">{course.description}</p>
        )}

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Temario</h2>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            + Agregar tema
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAddTopic} className="bg-white rounded-xl shadow p-6 mb-4 space-y-4">
            <h3 className="font-semibold text-gray-900">Nuevo tema</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Restricción Presupuestaria"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Breve descripción del tema..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Objetivos de aprendizaje</label>
              <textarea
                value={form.objectives}
                onChange={(e) => setForm({ ...form, objectives: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="¿Qué debe saber el alumno al terminar este tema?"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Guardando..." : "Guardar tema"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {course.topics.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-xl shadow">
            <p className="mb-1">El curso no tiene temas todavía</p>
            <p className="text-sm">Agrega el primer tema del temario</p>
          </div>
        ) : (
          <div className="space-y-3">
            {course.topics.map((topic, i) => (
              <div key={topic.id} className="bg-white rounded-xl shadow p-5 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
                      Tema {i + 1}
                    </span>
                    <h3 className="font-semibold text-gray-900">{topic.title}</h3>
                  </div>
                  {topic.description && <p className="text-sm text-gray-500 mb-1">{topic.description}</p>}
                  {topic.objectives && (
                    <p className="text-xs text-gray-400">
                      <span className="font-medium">Objetivos:</span> {topic.objectives}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteTopic(topic)}
                  className="text-red-400 hover:text-red-600 text-sm ml-4 shrink-0"
                >
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

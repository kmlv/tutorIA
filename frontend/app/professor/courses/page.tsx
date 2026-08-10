"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { coursesApi, type Course } from "@/lib/courses";
import { logout } from "@/lib/auth";

export default function ProfessorCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    coursesApi.mine().then(setCourses).catch(() => router.replace("/login"));
  }, [router]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const course = await coursesApi.create(form);
      setCourses((prev) => [...prev, course]);
      setForm({ title: "", description: "" });
      setShowForm(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al crear el curso");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/professor/dashboard")} className="text-gray-500 hover:text-gray-800">
            ← Dashboard
          </button>
          <span className="font-bold text-lg text-blue-600">Mis cursos</span>
        </div>
        <button onClick={logout} className="text-sm text-red-500 hover:underline">Cerrar sesión</button>
      </nav>

      <main className="max-w-4xl mx-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Cursos</h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            + Nuevo curso
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-xl shadow p-6 mb-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Nuevo curso</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Microeconomía I"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Descripción del curso..."
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Creando..." : "Crear curso"}
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

        {courses.length === 0 && !showForm ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg mb-2">Aún no tienes cursos</p>
            <p className="text-sm">Crea tu primer curso para comenzar</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {courses.map((course) => (
              <button
                key={course.id}
                onClick={() => router.push(`/professor/courses/${course.id}`)}
                className="bg-white rounded-xl shadow p-6 text-left hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900 mb-1">{course.title}</h2>
                    {course.description && <p className="text-sm text-gray-500 mb-3">{course.description}</p>}
                    <p className="text-xs text-gray-400">{course.topics.length} tema(s)</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded font-mono">
                      {course.invite_code}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

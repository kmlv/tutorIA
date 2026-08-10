"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { coursesApi, type Enrollment } from "@/lib/courses";
import { logout } from "@/lib/auth";

export default function StudentCoursesPage() {
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [showJoin, setShowJoin] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    coursesApi.enrolled().then(setEnrollments).catch(() => router.replace("/login"));
  }, [router]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const enrollment = await coursesApi.join(code.trim().toUpperCase());
      setEnrollments((prev) => [...prev, enrollment]);
      setCode("");
      setShowJoin(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Código inválido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/student/dashboard")} className="text-gray-500 hover:text-gray-800">
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
            onClick={() => setShowJoin(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            + Unirme a un curso
          </button>
        </div>

        {showJoin && (
          <form onSubmit={handleJoin} className="bg-white rounded-xl shadow p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">Ingresa el código del curso</h2>
            <div className="flex gap-3">
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={8}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 font-mono uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: AB12CD34"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Uniéndome..." : "Unirme"}
              </button>
              <button
                type="button"
                onClick={() => { setShowJoin(false); setError(""); }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </button>
            </div>
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          </form>
        )}

        {enrollments.length === 0 && !showJoin ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg mb-2">Aún no estás inscrito en ningún curso</p>
            <p className="text-sm">Usa el código que te dio tu profesor para unirte</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {enrollments.map(({ course, enrolled_at }) => (
              <button
                key={course.id}
                onClick={() => router.push(`/student/courses/${course.id}`)}
                className="bg-white rounded-xl shadow p-6 text-left hover:shadow-md transition"
              >
                <h2 className="font-semibold text-gray-900 mb-1">{course.title}</h2>
                {course.description && <p className="text-sm text-gray-500 mb-3">{course.description}</p>}
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>{course.topics.length} tema(s)</span>
                  <span>Inscrito: {new Date(enrolled_at).toLocaleDateString("es")}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

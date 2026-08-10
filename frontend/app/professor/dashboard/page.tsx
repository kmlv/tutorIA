"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchMe, logout, setActiveRole, type User } from "@/lib/auth";

export default function ProfessorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetchMe()
      .then(setUser)
      .catch(() => router.replace("/login"));
  }, [router]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <span className="font-bold text-lg text-blue-600">tutorIA — Profesor</span>
        <div className="flex items-center gap-4">
          {user.is_student && (
            <button
              onClick={() => { setActiveRole("student"); router.push("/dashboard"); }}
              className="text-sm text-gray-600 hover:text-blue-600"
            >
              Cambiar a alumno
            </button>
          )}
          <button onClick={logout} className="text-sm text-red-500 hover:underline">
            Cerrar sesión
          </button>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Hola, {user.name}</h1>
        <p className="text-gray-500 mb-8">Gestiona tus planes de estudio</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => router.push("/professor/courses")}
            className="bg-white rounded-xl shadow p-6 text-left hover:shadow-md transition"
          >
            <h2 className="font-semibold text-gray-900 mb-1">Mis cursos</h2>
            <p className="text-sm text-gray-500">Crea y administra cursos con su temario</p>
          </button>
        </div>
      </main>
    </div>
  );
}

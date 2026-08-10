"use client";

import { useRouter } from "next/navigation";
import { setActiveRole } from "@/lib/auth";

export default function SelectRolePage() {
  const router = useRouter();

  function choose(role: "professor" | "student") {
    setActiveRole(role);
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">¿Cómo quieres entrar?</h1>
        <p className="text-gray-500 mb-8">Puedes cambiar de modo en cualquier momento</p>
        <div className="flex flex-col gap-4">
          <button
            onClick={() => choose("professor")}
            className="w-full border-2 border-blue-600 text-blue-600 rounded-xl py-4 font-semibold text-lg hover:bg-blue-50 transition"
          >
            Soy Profesor
          </button>
          <button
            onClick={() => choose("student")}
            className="w-full bg-blue-600 text-white rounded-xl py-4 font-semibold text-lg hover:bg-blue-700 transition"
          >
            Soy Alumno
          </button>
        </div>
      </div>
    </div>
  );
}

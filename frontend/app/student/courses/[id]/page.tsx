"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { coursesApi, type Course } from "@/lib/courses";

export default function StudentCourseDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);

  useEffect(() => {
    coursesApi.enrolled().then((enrollments) => {
      const found = enrollments.find((e) => e.course.id === Number(id));
      if (found) setCourse(found.course);
      else router.replace("/student/courses");
    }).catch(() => router.replace("/login"));
  }, [id, router]);

  if (!course) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push("/student/courses")} className="text-gray-500 hover:text-gray-800">
          ← Mis cursos
        </button>
        <span className="font-bold text-lg text-blue-600">{course.title}</span>
      </nav>

      <main className="max-w-3xl mx-auto p-8">
        {course.description && <p className="text-gray-500 mb-8">{course.description}</p>}

        <h2 className="text-xl font-bold text-gray-900 mb-4">Temario</h2>

        {course.topics.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-xl shadow">
            <p>El profesor aún no ha agregado temas a este curso</p>
          </div>
        ) : (
          <div className="space-y-3">
            {course.topics.map((topic, i) => (
              <button
                key={topic.id}
                onClick={() => router.push(`/student/courses/${course.id}/topics/${topic.id}`)}
                className="w-full bg-white rounded-xl shadow p-5 text-left hover:shadow-md transition"
              >
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">
                    Tema {i + 1}
                  </span>
                  <h3 className="font-semibold text-gray-900">{topic.title}</h3>
                </div>
                {topic.description && <p className="text-sm text-gray-500">{topic.description}</p>}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

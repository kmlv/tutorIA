import { apiFetch } from "./api";

export type Topic = {
  id: number;
  title: string;
  description: string | null;
  objectives: string | null;
  order: number;
  course_id: number;
};

export type Course = {
  id: number;
  title: string;
  description: string | null;
  invite_code: string;
  professor_id: number;
  created_at: string;
  topics: Topic[];
};

export type Enrollment = {
  id: number;
  course: Course;
  enrolled_at: string;
};

export const coursesApi = {
  create: (data: { title: string; description?: string }) =>
    apiFetch("/courses", { method: "POST", body: JSON.stringify(data) }) as Promise<Course>,

  mine: () => apiFetch("/courses/mine") as Promise<Course[]>,

  enrolled: () => apiFetch("/courses/enrolled") as Promise<Enrollment[]>,

  join: (invite_code: string) =>
    apiFetch("/courses/join", { method: "POST", body: JSON.stringify({ invite_code }) }) as Promise<Enrollment>,

  addTopic: (course_id: number, data: { title: string; description?: string; objectives?: string; order: number }) =>
    apiFetch(`/topics/course/${course_id}`, { method: "POST", body: JSON.stringify(data) }) as Promise<Topic>,

  deleteTopic: (topic_id: number) =>
    apiFetch(`/topics/${topic_id}`, { method: "DELETE" }),
};

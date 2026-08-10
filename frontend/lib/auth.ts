import Cookies from "js-cookie";
import { apiFetch } from "./api";

const TOKEN_KEY = "tutoria_token";

export type User = {
  id: number;
  email: string;
  name: string;
  is_professor: boolean;
  is_student: boolean;
};

export type ActiveRole = "professor" | "student";

export function getToken(): string | undefined {
  return Cookies.get(TOKEN_KEY);
}

export function setToken(token: string) {
  Cookies.set(TOKEN_KEY, token, { expires: 1 });
}

export function clearToken() {
  Cookies.remove(TOKEN_KEY);
}

export async function fetchMe(): Promise<User> {
  const token = getToken();
  return apiFetch("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function login(email: string, password: string): Promise<User> {
  const { access_token } = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(access_token);
  return fetchMe();
}

export async function register(data: {
  email: string;
  password: string;
  name: string;
  is_professor: boolean;
  is_student: boolean;
}): Promise<User> {
  const { access_token } = await apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
  setToken(access_token);
  return fetchMe();
}

export function logout() {
  clearToken();
  window.location.href = "/login";
}

export function getActiveRole(): ActiveRole | null {
  if (typeof window === "undefined") return null;
  return (localStorage.getItem("tutoria_role") as ActiveRole) ?? null;
}

export function setActiveRole(role: ActiveRole) {
  localStorage.setItem("tutoria_role", role);
}

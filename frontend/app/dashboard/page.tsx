"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getActiveRole, getToken } from "@/lib/auth";

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    const role = getActiveRole();
    if (role === "professor") router.replace("/professor/dashboard");
    else if (role === "student") router.replace("/student/dashboard");
    else router.replace("/select-role");
  }, [router]);

  return null;
}

"use client";

import { useAuth } from "./auth";
import { ProfileInputs } from "./types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface RemoteProfile {
  id: string;
  userId: string;
  data: ProfileInputs;
  updatedAt: string;
}

export interface RemoteScenario {
  id: string;
  userId: string;
  name: string;
  profile: ProfileInputs;
  createdAt: string;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = useAuth.getState().token;
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (res.status === 401) {
    // Token expired or invalid — drop it so the UI falls back to anonymous.
    useAuth.getState().logout();
    throw new ApiError(401, "Unauthorized");
  }
  if (!res.ok) throw new ApiError(res.status, `Request failed: ${res.status}`);
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

export const api = {
  /** Full-page redirect to begin the Google OAuth flow on the API. */
  loginUrl: () => `${API_URL}/auth/google`,

  me: () => request<{ id: string; email: string; name: string | null; avatarUrl: string | null }>("/auth/me"),

  getProfile: () => request<RemoteProfile | null>("/profile"),
  putProfile: (profile: ProfileInputs) =>
    request<RemoteProfile>("/profile", {
      method: "PUT",
      body: JSON.stringify({
        data: profile,
        currentAge: profile.currentAge,
        retirementAge: profile.retirementAge,
        persona: profile.persona,
      }),
    }),

  coachStatus: () => request<{ available: boolean }>("/coach/status"),
  coach: (question: string, context: Record<string, unknown>, history: { role: "user" | "coach"; text: string }[]) =>
    request<{ answer: string }>("/coach", {
      method: "POST",
      body: JSON.stringify({ question, context, history }),
    }),

  listScenarios: () => request<RemoteScenario[]>("/scenarios"),
  createScenario: (name: string, profile: ProfileInputs) =>
    request<RemoteScenario>("/scenarios", {
      method: "POST",
      body: JSON.stringify({ name, profile }),
    }),
  deleteScenario: (id: string) => request<{ deleted: true }>(`/scenarios/${id}`, { method: "DELETE" }),
};

export { ApiError };

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api";

export type AuthResponse = { access_token: string; token_type: string; email: string };
export type Profile = {
  user_id: number;
  annual_salary?: number | null;
  monthly_expenses?: number | null;
  risk_profile?: string | null;
  dependents?: number | null;
  city?: string | null;
  notes?: string | null;
};

function authHeaders() {
  const token = localStorage.getItem("finpilot_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
      ...authHeaders(),
    },
  });
  if (!res.ok) {
    const maybeJson = await res.json().catch(() => null);
    throw new Error(maybeJson?.detail || "Request failed");
  }
  return res.json();
}

export const api = {
  register: (email: string, password: string, full_name: string) =>
    request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, full_name }),
    }),

  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  getProfile: () => request<Profile>("/profile"),
  updateProfile: (profile: Partial<Profile>) =>
    request<Profile>("/profile", { method: "PUT", body: JSON.stringify(profile) }),

  sendChat: (message: string) =>
    request<{ reply: string }>("/chat", { method: "POST", body: JSON.stringify({ message }) }),

  getHistory: () => request<Array<{ role: string; content: string; created_at: string }>>("/chat/history"),

  compareTax: (annual_salary: number, deductions_old_regime: number) =>
    request<any>(`/tools/tax/compare?annual_salary=${annual_salary}&deductions_old_regime=${deductions_old_regime}`),

  analyzePortfolio: async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_BASE}/tools/portfolio/analyze`, {
      method: "POST",
      headers: { ...authHeaders() },
      body: form,
    });
    if (!res.ok) {
      const maybeJson = await res.json().catch(() => null);
      throw new Error(maybeJson?.detail || "Upload failed");
    }
    return res.json();
  },
};

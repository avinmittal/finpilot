import { getApiBase } from "./config";

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

export type ChatItem = { role: string; content: string; created_at?: string };

export type TaxRegimeBreakdown = {
  regime: "old" | "new";
  label: string;
  annual_salary: number;
  standard_deduction: number;
  additional_deductions: number;
  taxable_income: number;
  base_tax: number;
  cess: number;
  total_tax: number;
  effective_rate_pct: number;
  note: string;
};

export type TaxComparison = {
  annual_salary: number;
  deductions_old_regime: number;
  standard_deduction: number;
  old_regime: TaxRegimeBreakdown;
  new_regime: TaxRegimeBreakdown;
  better_regime: "old" | "new";
  estimated_savings: number;
  summary: string;
  disclaimer: string;
};

export type PortfolioAnalysis = {
  total_value: number;
  holdings_count: number;
  allocation: Record<string, number>;
  allocation_summary: Array<{ asset_class: string; value: number; percentage: number }>;
  concentration: {
    top_3_pct: number;
    top_5_pct: number;
    largest_holding_pct: number;
    risk_level: "low" | "moderate" | "high";
  };
  concentration_top_3_pct: number;
  top_holdings: Array<{
    name: string;
    asset_class: string;
    value: number;
    percentage: number;
  }>;
  diagnostics: string[];
};

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("finpilot_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...authHeaders(),
  };

  if (init?.headers) {
    Object.assign(headers, init.headers);
  }

  const res = await fetch(`${getApiBase()}${path}`, {
    ...init,
    headers,
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

  getHistory: () => request<ChatItem[]>("/chat/history"),

  compareTax: (annual_salary: number, deductions_old_regime: number) =>
    request<TaxComparison>(`/tools/tax/compare?annual_salary=${annual_salary}&deductions_old_regime=${deductions_old_regime}`),

  analyzePortfolio: async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${getApiBase()}/tools/portfolio/analyze`, {
      method: "POST",
      headers: { ...authHeaders() },
      body: form,
    });
    if (!res.ok) {
      const maybeJson = await res.json().catch(() => null);
      throw new Error(maybeJson?.detail || "Upload failed");
    }
    return res.json() as Promise<PortfolioAnalysis>;
  },
};

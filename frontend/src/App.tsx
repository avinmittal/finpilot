import { useEffect, useMemo, useState } from "react";
import {
  api,
  ChatItem,
  PortfolioAnalysis,
  Profile,
  TaxComparison,
  TaxRegimeBreakdown,
} from "./api";
import { getApiBase, setApiBase } from "./config";

type ToolResult =
  | { kind: "tax"; data: TaxComparison }
  | { kind: "portfolio"; data: PortfolioAnalysis };

const starterPrompts = [
  "Build a 15-year SIP plan for ₹25,000 per month at 12%.",
  "Compare prepaying a 9% home loan vs investing ₹10,00,000 at 12% for 10 years.",
  "Compare old vs new tax regime for ₹24,00,000 salary and ₹1,50,000 deductions.",
  "Given my saved profile, what should I review first?",
];

const navigation = ["Chat", "Profile", "Tax", "Portfolio"];

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function formatINR(value?: number | null) {
  return inr.format(Number(value || 0));
}

function App() {
  const [mode, setMode] = useState<"auth" | "app">(
    localStorage.getItem("finpilot_token") ? "app" : "auth",
  );
  const [activeSection, setActiveSection] = useState("Chat");
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [authError, setAuthError] = useState("");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileForm, setProfileForm] = useState<Partial<Profile>>({});
  const [profileMsg, setProfileMsg] = useState("");

  const [history, setHistory] = useState<ChatItem[]>([]);
  const [message, setMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [toolResult, setToolResult] = useState<ToolResult | null>(null);
  const [toolError, setToolError] = useState("");

  const [taxSalary, setTaxSalary] = useState("2400000");
  const [taxDeduction, setTaxDeduction] = useState("150000");
  const [portfolioFile, setPortfolioFile] = useState<File | null>(null);
  const [apiBase, setApiBaseState] = useState(getApiBase());

  const isLoggedIn = mode === "app";

  useEffect(() => {
    if (isLoggedIn) {
      loadProfile();
      loadHistory();
    }
  }, [isLoggedIn]);

  async function loadProfile() {
    try {
      const p = await api.getProfile();
      setProfile(p);
      setProfileForm(p);
    } catch (e: any) {
      setProfileMsg(e.message);
    }
  }

  async function loadHistory() {
    try {
      setHistory(await api.getHistory());
    } catch {
      setHistory([]);
    }
  }

  async function submitAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    if (!email || !password || (authTab === "register" && password.length < 8)) {
      setAuthError("Enter a valid email and a password with at least 8 characters.");
      return;
    }

    try {
      const result =
        authTab === "login"
          ? await api.login(email, password)
          : await api.register(email, password, fullName);
      localStorage.setItem("finpilot_token", result.access_token);
      localStorage.setItem("finpilot_email", result.email);
      setMode("app");
    } catch (e: any) {
      setAuthError(e.message);
    }
  }

  async function saveProfile() {
    setProfileMsg("");
    try {
      const updated = await api.updateProfile({
        annual_salary: numericOrNull(profileForm.annual_salary),
        monthly_expenses: numericOrNull(profileForm.monthly_expenses),
        risk_profile: profileForm.risk_profile || null,
        dependents: numericOrNull(profileForm.dependents),
        city: profileForm.city || null,
        notes: profileForm.notes || null,
      });
      setProfile(updated);
      setProfileForm(updated);
      setProfileMsg("Profile saved. FinPilot will use this context in future answers.");
    } catch (e: any) {
      setProfileMsg(e.message);
    }
  }

  async function sendChat(prompt?: string) {
    const content = (prompt ?? message).trim();
    if (!content || chatLoading) return;
    setChatLoading(true);
    setToolError("");
    const nextHistory = [...history, { role: "user", content }];
    setHistory(nextHistory);
    setMessage("");
    try {
      const res = await api.sendChat(content);
      setHistory([...nextHistory, { role: "assistant", content: res.reply }]);
    } catch (e: any) {
      setToolError(e.message);
    } finally {
      setChatLoading(false);
    }
  }

  async function runTaxCompare() {
    setToolError("");
    const salary = Number(taxSalary);
    const deductions = Number(taxDeduction);
    if (salary < 0 || deductions < 0 || Number.isNaN(salary) || Number.isNaN(deductions)) {
      setToolError("Enter valid non-negative tax inputs.");
      return;
    }

    try {
      const result = await api.compareTax(salary, deductions);
      setToolResult({ kind: "tax", data: result });
    } catch (e: any) {
      setToolError(e.message);
    }
  }

  async function uploadPortfolio() {
    if (!portfolioFile) return;
    setToolError("");
    try {
      const result = await api.analyzePortfolio(portfolioFile);
      setToolResult({ kind: "portfolio", data: result });
    } catch (e: any) {
      setToolError(e.message);
    }
  }

  function logout() {
    localStorage.removeItem("finpilot_token");
    localStorage.removeItem("finpilot_email");
    window.location.reload();
  }

  function updateApiBase(value: string) {
    setApiBaseState(value);
    setApiBase(value);
  }

  const dashboardStats = useMemo(() => {
    const monthlyExpenses = Number(profile?.monthly_expenses || 0);
    const annualSalary = Number(profile?.annual_salary || 0);
    const monthlyIncome = annualSalary / 12;
    const estimatedSurplus = Math.max(0, monthlyIncome - monthlyExpenses);
    return { monthlyIncome, monthlyExpenses, estimatedSurplus };
  }, [profile]);

  if (mode === "auth") {
    return (
      <div className="auth-page">
        <section className="auth-hero">
          <div className="eyebrow">AI-powered financial copilot for Indian households</div>
          <h1>FinPilot</h1>
          <p>
            Conversational guidance, deterministic calculators, portfolio diagnostics,
            and tax intelligence in one private workspace.
          </p>
        </section>
        <section className="auth-card">
          <div className="segmented">
            <button className={authTab === "login" ? "active" : ""} onClick={() => setAuthTab("login")}>
              Login
            </button>
            <button className={authTab === "register" ? "active" : ""} onClick={() => setAuthTab("register")}>
              Register
            </button>
          </div>
          <form onSubmit={submitAuth} className="stack">
            {authTab === "register" && (
              <label>
                Full name
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </label>
            )}
            <label>
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label>
              Password
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            <label>
              API endpoint
              <input value={apiBase} onChange={(e) => updateApiBase(e.target.value)} />
            </label>
            <button type="submit">{authTab === "login" ? "Login" : "Create account"}</button>
          </form>
          {authError && <div className="error">{authError}</div>}
        </section>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="brand-mark">F</div>
          <h2>FinPilot</h2>
          <p className="sidebar-copy">Guidance, calculators, portfolio diagnostics, and tax intelligence.</p>
        </div>
        <nav className="nav-list">
          {navigation.map((item) => (
            <button
              key={item}
              className={activeSection === item ? "active" : ""}
              onClick={() => setActiveSection(item)}
            >
              {item}
            </button>
          ))}
        </nav>
        <div className="account-block">
          <div className="small muted-inverse">{localStorage.getItem("finpilot_email")}</div>
          <label className="api-setting">
            API endpoint
            <input value={apiBase} onChange={(e) => updateApiBase(e.target.value)} />
          </label>
          <button className="secondary" onClick={logout}>Logout</button>
        </div>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <div className="eyebrow">FinPilot v2</div>
            <h1>{activeSection}</h1>
          </div>
          <div className="status-pill">Education-first guidance</div>
        </header>

        <section className="summary-grid">
          <MetricCard label="Monthly income" value={formatINR(dashboardStats.monthlyIncome)} />
          <MetricCard label="Monthly expenses" value={formatINR(dashboardStats.monthlyExpenses)} />
          <MetricCard label="Estimated surplus" value={formatINR(dashboardStats.estimatedSurplus)} tone="positive" />
        </section>

        {activeSection === "Chat" && (
          <section className="workspace-grid chat-layout">
            <div className="panel chat-panel">
              <div className="panel-heading">
                <div>
                  <h3>Ask FinPilot</h3>
                  <p>Profile-aware answers with deterministic backend tools for calculations.</p>
                </div>
              </div>
              <div className="prompts">
                {starterPrompts.map((p) => (
                  <button key={p} className="chip" onClick={() => sendChat(p)}>{p}</button>
                ))}
              </div>
              <div className="chat-window">
                {history.length === 0 && (
                  <div className="empty-state">
                    <strong>Start with a planning question.</strong>
                    <span>Try a SIP projection, tax comparison, or profile-aware review.</span>
                  </div>
                )}
                {history.map((item, idx) => (
                  <div key={`${item.created_at || idx}-${idx}`} className={`bubble ${item.role}`}>
                    <span>{item.role === "user" ? "You" : "FinPilot"}</span>
                    <div>{item.content}</div>
                  </div>
                ))}
                {chatLoading && <div className="bubble assistant"><span>FinPilot</span><div>Thinking through the right tool...</div></div>}
              </div>
              {toolError && <div className="error">{toolError}</div>}
              <div className="composer">
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendChat();
                  }}
                  placeholder="Ask about SIPs, tax, loans, cash flow, or your saved profile"
                />
                <button onClick={() => sendChat()} disabled={chatLoading}>Send</button>
              </div>
            </div>
            <ProfilePreview profile={profile} />
          </section>
        )}

        {activeSection === "Profile" && (
          <section className="workspace-grid">
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <h3>Financial profile</h3>
                  <p>Saved context helps FinPilot personalize guidance without asking again.</p>
                </div>
              </div>
              <div className="form-grid">
                <FormInput label="Annual salary" value={profileForm.annual_salary ?? ""} onChange={(value) => setProfileForm({ ...profileForm, annual_salary: Number(value) })} />
                <FormInput label="Monthly expenses" value={profileForm.monthly_expenses ?? ""} onChange={(value) => setProfileForm({ ...profileForm, monthly_expenses: Number(value) })} />
                <FormInput label="Risk profile" value={profileForm.risk_profile ?? ""} onChange={(value) => setProfileForm({ ...profileForm, risk_profile: value })} />
                <FormInput label="Dependents" value={profileForm.dependents ?? ""} onChange={(value) => setProfileForm({ ...profileForm, dependents: Number(value) })} />
                <FormInput label="City" value={profileForm.city ?? ""} onChange={(value) => setProfileForm({ ...profileForm, city: value })} />
                <label className="wide">
                  Notes
                  <textarea
                    value={profileForm.notes ?? ""}
                    onChange={(e) => setProfileForm({ ...profileForm, notes: e.target.value })}
                    placeholder="Goals, constraints, upcoming cash needs, insurance context"
                  />
                </label>
              </div>
              <div className="action-row">
                <button onClick={saveProfile}>Save profile</button>
                {profileMsg && <span className="small muted">{profileMsg}</span>}
              </div>
            </div>
            <ProfilePreview profile={profile} />
          </section>
        )}

        {activeSection === "Tax" && (
          <section className="workspace-grid">
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <h3>Indian tax regime comparison</h3>
                  <p>Structured old-vs-new regime estimate using deterministic backend slabs.</p>
                </div>
              </div>
              <div className="form-grid compact">
                <FormInput label="Annual salary" value={taxSalary} onChange={setTaxSalary} />
                <FormInput label="Old-regime deductions" value={taxDeduction} onChange={setTaxDeduction} />
              </div>
              <div className="action-row">
                <button onClick={runTaxCompare}>Compare regimes</button>
                {toolError && <span className="error inline-error">{toolError}</span>}
              </div>
            </div>
            {toolResult?.kind === "tax" ? <TaxResult data={toolResult.data} /> : <TaxPlaceholder />}
          </section>
        )}

        {activeSection === "Portfolio" && (
          <section className="workspace-grid">
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <h3>Portfolio upload analyzer</h3>
                  <p>Upload holdings with value or market_value columns for allocation and concentration diagnostics.</p>
                </div>
              </div>
              <label className="upload-zone">
                <input type="file" accept=".csv" onChange={(e) => setPortfolioFile(e.target.files?.[0] || null)} />
                <strong>{portfolioFile ? portfolioFile.name : "Choose a portfolio CSV"}</strong>
                <span>Accepted columns: name/security, asset_class/category, value/current_value/market_value</span>
              </label>
              <div className="action-row">
                <button onClick={uploadPortfolio} disabled={!portfolioFile}>Analyze portfolio</button>
                {toolError && <span className="error inline-error">{toolError}</span>}
              </div>
            </div>
            {toolResult?.kind === "portfolio" ? <PortfolioResult data={toolResult.data} /> : <PortfolioPlaceholder />}
          </section>
        )}
      </main>
    </div>
  );
}

function numericOrNull(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone?: "positive" }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong className={tone === "positive" ? "positive" : ""}>{value}</strong>
    </div>
  );
}

function FormInput({ label, value, onChange }: { label: string; value: string | number; onChange: (value: string) => void }) {
  return (
    <label>
      {label}
      <input value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function ProfilePreview({ profile }: { profile: Profile | null }) {
  return (
    <aside className="panel insight-panel">
      <div className="panel-heading">
        <div>
          <h3>Profile context</h3>
          <p>Used by chat answers when relevant.</p>
        </div>
      </div>
      <dl className="profile-list">
        <div><dt>Annual salary</dt><dd>{formatINR(profile?.annual_salary)}</dd></div>
        <div><dt>Monthly expenses</dt><dd>{formatINR(profile?.monthly_expenses)}</dd></div>
        <div><dt>Risk profile</dt><dd>{profile?.risk_profile || "Not set"}</dd></div>
        <div><dt>Dependents</dt><dd>{profile?.dependents ?? "Not set"}</dd></div>
        <div><dt>City</dt><dd>{profile?.city || "Not set"}</dd></div>
      </dl>
    </aside>
  );
}

function TaxResult({ data }: { data: TaxComparison }) {
  return (
    <div className="panel result-panel">
      <div className="result-banner">
        <span>Lower estimated tax</span>
        <strong>{data.better_regime === "old" ? "Old regime" : "New regime"}</strong>
        <small>{formatINR(data.estimated_savings)} estimated savings</small>
      </div>
      <div className="comparison-grid">
        <RegimeCard regime={data.old_regime} winner={data.better_regime === "old"} />
        <RegimeCard regime={data.new_regime} winner={data.better_regime === "new"} />
      </div>
      <p className="muted small">{data.disclaimer}</p>
    </div>
  );
}

function RegimeCard({ regime, winner }: { regime: TaxRegimeBreakdown; winner: boolean }) {
  return (
    <div className={`regime-card ${winner ? "winner" : ""}`}>
      <div>
        <span>{regime.label}</span>
        {winner && <strong>Best fit</strong>}
      </div>
      <h4>{formatINR(regime.total_tax)}</h4>
      <dl>
        <div><dt>Taxable income</dt><dd>{formatINR(regime.taxable_income)}</dd></div>
        <div><dt>Effective rate</dt><dd>{regime.effective_rate_pct}%</dd></div>
        <div><dt>Cess</dt><dd>{formatINR(regime.cess)}</dd></div>
      </dl>
    </div>
  );
}

function PortfolioResult({ data }: { data: PortfolioAnalysis }) {
  return (
    <div className="panel result-panel">
      <div className="result-banner">
        <span>Total portfolio value</span>
        <strong>{formatINR(data.total_value)}</strong>
        <small>{data.holdings_count} holdings · {data.concentration.risk_level} concentration</small>
      </div>
      <h3>Allocation</h3>
      <div className="allocation-list">
        {data.allocation_summary.map((item) => (
          <div key={item.asset_class}>
            <div>
              <strong>{item.asset_class}</strong>
              <span>{item.percentage}%</span>
            </div>
            <meter min={0} max={100} value={item.percentage} />
          </div>
        ))}
      </div>
      <h3>Top holdings</h3>
      <div className="holding-list">
        {data.top_holdings.slice(0, 6).map((holding) => (
          <div key={`${holding.name}-${holding.value}`}>
            <span>{holding.name}</span>
            <strong>{holding.percentage}%</strong>
          </div>
        ))}
      </div>
      <p className="muted small">{data.diagnostics.join(" ")}</p>
    </div>
  );
}

function TaxPlaceholder() {
  return (
    <div className="panel placeholder-panel">
      <h3>Comparison output</h3>
      <p>Run a tax comparison to see regime-wise taxable income, cess, effective rate, and estimated savings.</p>
    </div>
  );
}

function PortfolioPlaceholder() {
  return (
    <div className="panel placeholder-panel">
      <h3>Portfolio diagnostics</h3>
      <p>Upload a CSV to see allocation, top holdings, and concentration risk in a readable format.</p>
    </div>
  );
}

export default App;

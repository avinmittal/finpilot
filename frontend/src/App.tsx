import { useEffect, useMemo, useState } from "react";
import { api, Profile } from "./api";

type ChatItem = { role: string; content: string; created_at?: string };

const starterPrompts = [
  "If I invest 25000 per month for 15 years at 12%, how much can it grow to?",
  "Should I prepay a 9% home loan or invest 1000000 at 12% for 10 years?",
  "Compare old vs new tax regime for 2400000 salary and 150000 deductions",
];

function App() {
  const [mode, setMode] = useState<"auth" | "app">(localStorage.getItem("finpilot_token") ? "app" : "auth");
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
  const [toolResult, setToolResult] = useState<any>(null);
  const [toolError, setToolError] = useState("");

  const [taxSalary, setTaxSalary] = useState("2400000");
  const [taxDeduction, setTaxDeduction] = useState("150000");
  const [portfolioFile, setPortfolioFile] = useState<File | null>(null);

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
      const items = await api.getHistory();
      setHistory(items);
    } catch {
      // ignore
    }
  }

  async function submitAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
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
        annual_salary: Number(profileForm.annual_salary || 0) || null,
        monthly_expenses: Number(profileForm.monthly_expenses || 0) || null,
        risk_profile: profileForm.risk_profile || null,
        dependents: Number(profileForm.dependents || 0) || null,
        city: profileForm.city || null,
        notes: profileForm.notes || null,
      });
      setProfile(updated);
      setProfileForm(updated);
      setProfileMsg("Profile saved");
    } catch (e: any) {
      setProfileMsg(e.message);
    }
  }

  async function sendChat(prompt?: string) {
    const content = (prompt ?? message).trim();
    if (!content) return;
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
    try {
      const result = await api.compareTax(Number(taxSalary), Number(taxDeduction));
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

  const greeting = useMemo(() => {
    if (profile?.annual_salary) {
      return `Profile loaded. Salary ₹${Number(profile.annual_salary).toLocaleString("en-IN")}`;
    }
    return "Set up your profile for better responses.";
  }, [profile]);

  if (mode === "auth") {
    return (
      <div className="page auth-page">
        <div className="auth-card">
          <h1>FinPilot v2</h1>
          <p className="muted">AI financial copilot for India</p>
          <div className="segmented">
            <button className={authTab === "login" ? "active" : ""} onClick={() => setAuthTab("login")}>Login</button>
            <button className={authTab === "register" ? "active" : ""} onClick={() => setAuthTab("register")}>Register</button>
          </div>
          <form onSubmit={submitAuth} className="stack">
            {authTab === "register" && (
              <input placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            )}
            <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="submit">{authTab === "login" ? "Login" : "Create account"}</button>
          </form>
          {authError && <div className="error">{authError}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="page app-page">
      <aside className="sidebar">
        <div>
          <h2>FinPilot</h2>
          <div className="muted small">{localStorage.getItem("finpilot_email")}</div>
          <p className="small">{greeting}</p>
        </div>
        <button className="secondary" onClick={logout}>Logout</button>
      </aside>

      <main className="content">
        <section className="panel">
          <h3>Chat</h3>
          <div className="prompts">
            {starterPrompts.map((p) => (
              <button key={p} className="chip" onClick={() => sendChat(p)}>{p}</button>
            ))}
          </div>
          <div className="chat-window">
            {history.map((item, idx) => (
              <div key={idx} className={`bubble ${item.role}`}>
                <strong>{item.role === "user" ? "You" : "FinPilot"}</strong>
                <div>{item.content}</div>
              </div>
            ))}
            {chatLoading && <div className="bubble assistant">Thinking…</div>}
          </div>
          <div className="composer">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask about SIPs, tax, loans, cash flow, or your profile"
            />
            <button onClick={() => sendChat()}>Send</button>
          </div>
        </section>

        <section className="grid">
          <div className="panel">
            <h3>Financial profile</h3>
            <div className="stack">
              <input
                placeholder="Annual salary"
                value={profileForm.annual_salary ?? ""}
                onChange={(e) => setProfileForm({ ...profileForm, annual_salary: Number(e.target.value) })}
              />
              <input
                placeholder="Monthly expenses"
                value={profileForm.monthly_expenses ?? ""}
                onChange={(e) => setProfileForm({ ...profileForm, monthly_expenses: Number(e.target.value) })}
              />
              <input
                placeholder="Risk profile"
                value={profileForm.risk_profile ?? ""}
                onChange={(e) => setProfileForm({ ...profileForm, risk_profile: e.target.value })}
              />
              <input
                placeholder="Dependents"
                value={profileForm.dependents ?? ""}
                onChange={(e) => setProfileForm({ ...profileForm, dependents: Number(e.target.value) })}
              />
              <input
                placeholder="City"
                value={profileForm.city ?? ""}
                onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
              />
              <textarea
                placeholder="Notes"
                value={profileForm.notes ?? ""}
                onChange={(e) => setProfileForm({ ...profileForm, notes: e.target.value })}
              />
              <button onClick={saveProfile}>Save profile</button>
            </div>
            {profileMsg && <div className="small muted">{profileMsg}</div>}
          </div>

          <div className="panel">
            <h3>Tax regime calculator</h3>
            <div className="stack">
              <input value={taxSalary} onChange={(e) => setTaxSalary(e.target.value)} placeholder="Annual salary" />
              <input value={taxDeduction} onChange={(e) => setTaxDeduction(e.target.value)} placeholder="Old-regime deductions" />
              <button onClick={runTaxCompare}>Compare tax</button>
            </div>
          </div>

          <div className="panel">
            <h3>Portfolio upload analyzer</h3>
            <div className="stack">
              <input type="file" accept=".csv" onChange={(e) => setPortfolioFile(e.target.files?.[0] || null)} />
              <button onClick={uploadPortfolio} disabled={!portfolioFile}>Analyze portfolio</button>
              <div className="small muted">Upload a CSV with name, asset_class, value columns.</div>
            </div>
          </div>
        </section>

        {(toolResult || toolError) && (
          <section className="panel">
            <h3>Tool output</h3>
            {toolError && <div className="error">{toolError}</div>}
            {toolResult && <pre>{JSON.stringify(toolResult.data, null, 2)}</pre>}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;

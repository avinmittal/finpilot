import { useEffect, useMemo, useState } from "react";
import { api, ChatItem, Profile } from "./api";
import { AuthPage } from "./components/AuthPage";
import { ChatSection } from "./components/ChatSection";
import { PortfolioSection } from "./components/PortfolioSection";
import { ProfileSection } from "./components/ProfileSection";
import { TaxSection } from "./components/TaxSection";
import { formatINR } from "./utils";

const navigation = ["Chat", "Profile", "Tax", "Portfolio"];

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

function App() {
  const [mode, setMode] = useState<"auth" | "app">(
    localStorage.getItem("finpilot_token") ? "app" : "auth",
  );
  const [activeSection, setActiveSection] = useState("Chat");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileForm, setProfileForm] = useState<Partial<Profile>>({});
  const [profileMsg, setProfileMsg] = useState("");

  const [history, setHistory] = useState<ChatItem[]>([]);

  const isLoggedIn = mode === "app";

  useEffect(() => {
    if (isLoggedIn) {
      api.getProfile().then((p) => { setProfile(p); setProfileForm(p); }).catch(() => {});
      api.getHistory().then(setHistory).catch(() => setHistory([]));
    }
  }, [isLoggedIn]);

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

  function logout() {
    localStorage.removeItem("finpilot_token");
    localStorage.removeItem("finpilot_email");
    window.location.reload();
  }

  const dashboardStats = useMemo(() => {
    const monthlyExpenses = Number(profile?.monthly_expenses || 0);
    const annualSalary = Number(profile?.annual_salary || 0);
    const monthlyIncome = annualSalary / 12;
    const estimatedSurplus = Math.max(0, monthlyIncome - monthlyExpenses);
    return { monthlyIncome, monthlyExpenses, estimatedSurplus };
  }, [profile]);

  if (mode === "auth") {
    return <AuthPage onAuth={() => setMode("app")} />;
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
          <ChatSection history={history} onHistoryUpdate={setHistory} profile={profile} />
        )}
        {activeSection === "Profile" && (
          <ProfileSection
            profileForm={profileForm}
            profileMsg={profileMsg}
            onFormChange={setProfileForm}
            onSave={saveProfile}
            profile={profile}
          />
        )}
        {activeSection === "Tax" && <TaxSection />}
        {activeSection === "Portfolio" && <PortfolioSection />}
      </main>
    </div>
  );
}

export default App;

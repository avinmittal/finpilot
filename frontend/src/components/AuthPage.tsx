import { useState } from "react";
import { api } from "../api";

interface Props {
  onAuth: () => void;
}

export function AuthPage({ onAuth }: Props) {
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [authError, setAuthError] = useState("");

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
      onAuth();
    } catch (e: any) {
      setAuthError(e.message);
    }
  }

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
          <button type="submit">{authTab === "login" ? "Login" : "Create account"}</button>
        </form>
        {authError && <div className="error">{authError}</div>}
      </section>
    </div>
  );
}

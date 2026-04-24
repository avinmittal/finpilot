import { useState } from "react";
import { api, ChatItem, Profile } from "../api";
import { ProfilePreview } from "./ProfilePreview";

const starterPrompts = [
  "Build a 15-year SIP plan for ₹25,000 per month at 12%.",
  "Compare prepaying a 9% home loan vs investing ₹10,00,000 at 12% for 10 years.",
  "Compare old vs new tax regime for ₹24,00,000 salary and ₹1,50,000 deductions.",
  "Given my saved profile, what should I review first?",
];

interface Props {
  history: ChatItem[];
  onHistoryUpdate: (items: ChatItem[]) => void;
  profile: Profile | null;
}

export function ChatSection({ history, onHistoryUpdate, profile }: Props) {
  const [message, setMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");

  async function sendChat(prompt?: string) {
    const content = (prompt ?? message).trim();
    if (!content || chatLoading) return;
    setChatLoading(true);
    setChatError("");
    const nextHistory = [...history, { role: "user", content }];
    onHistoryUpdate(nextHistory);
    setMessage("");
    try {
      const res = await api.sendChat(content);
      onHistoryUpdate([...nextHistory, { role: "assistant", content: res.reply }]);
    } catch (e: any) {
      setChatError(e.message);
    } finally {
      setChatLoading(false);
    }
  }

  return (
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
          {chatLoading && (
            <div className="bubble assistant">
              <span>FinPilot</span>
              <div>Thinking through the right tool...</div>
            </div>
          )}
        </div>
        {chatError && <div className="error">{chatError}</div>}
        <div className="composer">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") sendChat(); }}
            placeholder="Ask about SIPs, tax, loans, cash flow, or your saved profile"
          />
          <button onClick={() => sendChat()} disabled={chatLoading}>Send</button>
        </div>
      </div>
      <ProfilePreview profile={profile} />
    </section>
  );
}

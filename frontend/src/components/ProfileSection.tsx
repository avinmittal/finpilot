import { Profile } from "../api";
import { ProfilePreview } from "./ProfilePreview";

interface Props {
  profileForm: Partial<Profile>;
  profileMsg: string;
  onFormChange: (form: Partial<Profile>) => void;
  onSave: () => void;
  profile: Profile | null;
}

function FormInput({ label, value, onChange }: { label: string; value: string | number; onChange: (v: string) => void }) {
  return (
    <label>
      {label}
      <input value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function ProfileSection({ profileForm, profileMsg, onFormChange, onSave, profile }: Props) {
  return (
    <section className="workspace-grid">
      <div className="panel">
        <div className="panel-heading">
          <div>
            <h3>Financial profile</h3>
            <p>Saved context helps FinPilot personalize guidance without asking again.</p>
          </div>
        </div>
        <div className="form-grid">
          <FormInput label="Annual salary" value={profileForm.annual_salary ?? ""} onChange={(v) => onFormChange({ ...profileForm, annual_salary: Number(v) })} />
          <FormInput label="Monthly expenses" value={profileForm.monthly_expenses ?? ""} onChange={(v) => onFormChange({ ...profileForm, monthly_expenses: Number(v) })} />
          <FormInput label="Risk profile" value={profileForm.risk_profile ?? ""} onChange={(v) => onFormChange({ ...profileForm, risk_profile: v })} />
          <FormInput label="Dependents" value={profileForm.dependents ?? ""} onChange={(v) => onFormChange({ ...profileForm, dependents: Number(v) })} />
          <FormInput label="City" value={profileForm.city ?? ""} onChange={(v) => onFormChange({ ...profileForm, city: v })} />
          <label className="wide">
            Notes
            <textarea
              value={profileForm.notes ?? ""}
              onChange={(e) => onFormChange({ ...profileForm, notes: e.target.value })}
              placeholder="Goals, constraints, upcoming cash needs, insurance context"
            />
          </label>
        </div>
        <div className="action-row">
          <button onClick={onSave}>Save profile</button>
          {profileMsg && <span className="small muted">{profileMsg}</span>}
        </div>
      </div>
      <ProfilePreview profile={profile} />
    </section>
  );
}

import { Profile } from "../api";
import { formatINR } from "../utils";

interface Props {
  profile: Profile | null;
}

export function ProfilePreview({ profile }: Props) {
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

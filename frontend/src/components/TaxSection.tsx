import { useState } from "react";
import { api, TaxComparison, TaxRegimeBreakdown } from "../api";
import { formatINR } from "../utils";

function FormInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label>
      {label}
      <input value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
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

function TaxPlaceholder() {
  return (
    <div className="panel placeholder-panel">
      <h3>Comparison output</h3>
      <p>Run a tax comparison to see regime-wise taxable income, cess, effective rate, and estimated savings.</p>
    </div>
  );
}

export function TaxSection() {
  const [taxSalary, setTaxSalary] = useState("2400000");
  const [taxDeduction, setTaxDeduction] = useState("150000");
  const [result, setResult] = useState<TaxComparison | null>(null);
  const [error, setError] = useState("");

  async function runTaxCompare() {
    setError("");
    const salary = Number(taxSalary);
    const deductions = Number(taxDeduction);
    if (salary < 0 || deductions < 0 || Number.isNaN(salary) || Number.isNaN(deductions)) {
      setError("Enter valid non-negative tax inputs.");
      return;
    }
    try {
      setResult(await api.compareTax(salary, deductions));
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
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
          {error && <span className="error inline-error">{error}</span>}
        </div>
      </div>
      {result ? <TaxResult data={result} /> : <TaxPlaceholder />}
    </section>
  );
}

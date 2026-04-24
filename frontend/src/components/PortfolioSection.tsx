import { useState } from "react";
import { api, PortfolioAnalysis } from "../api";
import { formatINR } from "../utils";

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

function PortfolioPlaceholder() {
  return (
    <div className="panel placeholder-panel">
      <h3>Portfolio diagnostics</h3>
      <p>Upload a CSV to see allocation, top holdings, and concentration risk in a readable format.</p>
    </div>
  );
}

export function PortfolioSection() {
  const [portfolioFile, setPortfolioFile] = useState<File | null>(null);
  const [result, setResult] = useState<PortfolioAnalysis | null>(null);
  const [error, setError] = useState("");

  async function uploadPortfolio() {
    if (!portfolioFile) return;
    setError("");
    try {
      setResult(await api.analyzePortfolio(portfolioFile));
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
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
          {error && <span className="error inline-error">{error}</span>}
        </div>
      </div>
      {result ? <PortfolioResult data={result} /> : <PortfolioPlaceholder />}
    </section>
  );
}

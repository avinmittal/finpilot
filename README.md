# FinPilot v2

FinPilot is an AI-powered financial copilot for Indian households, combining
conversational guidance, calculators, portfolio diagnostics, and tax intelligence.

The product is education-first. Financial math is handled by deterministic backend
services, while the LLM orchestrates guidance, asks clarifying questions, and uses
tools when calculations are needed.

Implemented capabilities:

- User registration and login with JWT auth
- Saved financial profile reused in chat answers
- OpenAI Responses API integration
- Explicit backend tool registry for financial calculators
- SIP future value calculator
- Loan prepayment vs investing comparison
- Simplified Indian old-vs-new tax regime comparison
- Portfolio CSV upload analyzer with allocation and concentration diagnostics
- React/Vite dashboard with chat, profile, tax, and portfolio workspaces

## Stack

- Frontend: React + Vite + TypeScript
- Backend: FastAPI + SQLAlchemy + SQLite
- AI: OpenAI Responses API with tool calling
- Auth: JWT
- Styling: custom CSS with a premium fintech dashboard direction

## Project structure

```text
backend/app/
  api/          FastAPI routers
  core/         configuration
  db/           SQLAlchemy session setup
  models/       persistence models
  schemas/      Pydantic request/response schemas
  services/     deterministic calculators, AI orchestration, portfolio analysis

frontend/src/
  App.tsx       authenticated product shell and screens
  api.ts        typed API client
  styles.css    application styling
```

## Quick start

### 1) Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

### 2) Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend runs at `http://localhost:5173` and backend at `http://localhost:8000`.

## GitHub Pages frontend

This repo includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml`.
On every push to `main`, it builds `frontend/` and deploys the static app to:

```text
https://avinmittal.github.io/finpilot/
```

In GitHub, enable Pages with:

```text
Settings -> Pages -> Build and deployment -> Source: GitHub Actions
```

The static frontend cannot host the FastAPI backend. To test the full app from
GitHub Pages, run or deploy the backend separately and set the API endpoint in
the login screen/sidebar. For local backend testing, use:

```text
http://localhost:8000/api
```

For a deployed backend, use its HTTPS API URL, for example:

```text
https://your-finpilot-api.example.com/api
```

The backend CORS defaults include `https://avinmittal.github.io`. If you deploy
the frontend elsewhere, add that origin to `FRONTEND_ORIGINS`.

### Docker Compose

```bash
docker compose up --build
```

## Tests

Backend:

```bash
cd backend
pytest
```

Frontend type/build check:

```bash
cd frontend
npm run build
```

## Environment

Add your key in `backend/.env`:
```bash
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-5
JWT_SECRET=replace-me
DATABASE_URL=sqlite:///./data/finpilot.db
FRONTEND_ORIGIN=http://localhost:5173
```

## Example questions

- `If I invest 25000 per month for 15 years at 12%, how much can it grow to?`
- `Should I prepay a 9% home loan or invest 1000000 at 12% for 10 years?`
- `Compare old vs new tax regime for 2400000 salary and 150000 deductions`

## Portfolio upload format

Upload CSV with columns such as:
- name columns: `name`, `holding`, `security`, `instrument`, `symbol`, `scheme`
- asset columns: `asset_class`, `asset`, `category`, `type`
- value columns: `value`, `current_value`, `market_value`, `amount`, `nav_value`

Example:
```csv
name,asset_class,value
HDFC Index Fund,equity,250000
Liquid Fund,debt,100000
Gold ETF,gold,50000
```

## Notes

- This project is education-first and avoids security-specific buy/sell recommendations.
- The tax calculator is simplified and does not include every edge case, surcharge, or marginal relief.
- SQLite is the default for local development. The SQLAlchemy setup is intentionally simple so it can later move to Postgres with `DATABASE_URL`.
- Do not put secrets in source control. Use `.env` locally and deployment environment variables in production.

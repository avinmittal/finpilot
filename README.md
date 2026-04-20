# FinPilot v2

AI-powered financial copilot for India with:
- OpenAI Responses API integration
- JWT auth
- Saved financial profile
- React chat UI
- SIP, loan-vs-invest, and Indian tax-regime calculators
- Portfolio CSV upload analyzer

## Stack

- Frontend: React + Vite + TypeScript
- Backend: FastAPI + SQLAlchemy + SQLite
- AI: OpenAI Responses API with tool calling
- Auth: JWT
- Styling: simple CSS

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

## Environment

Add your key in `backend/.env`:
```bash
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-5
JWT_SECRET=replace-me
```

## Example questions

- `If I invest 25000 per month for 15 years at 12%, how much can it grow to?`
- `Should I prepay a 9% home loan or invest 1000000 at 12% for 10 years?`
- `Compare old vs new tax regime for 2400000 salary and 150000 deductions`

## Portfolio upload format

Upload CSV with columns such as:
- `name`
- `asset_class`
- `value`

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

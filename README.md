# AURA AGENT — Unified AI Product Accelerator

> From raw idea to pitch-ready product in 6 AI-powered stages.

## What it does

UAPA walks founders through a full product development pipeline — no paid research tools, no expensive consultants:

| Stage | What happens |
|-------|-------------|
| **1 · Intake** | Conversational AI extracts your idea, constraints, and problem statement |
| **2 · Whitespace** | DuckDuckGo + Gemini analyse competitors, price tiers, and psychographic gaps with cited sources |
| **3 · Definition** | Auto-generates target personas, a RICE-prioritised feature table, and a full PRD |
| **4 · Prototype** | Physical products → Pollinations.ai concept render + spec sheet. Software → scaffolded Next.js code |
| **5 · GTM + Economics** | Gemini drafts GTM motion, CAC/LTV/payback models, and channel strategy |
| **6 · Tracking** | Upload weekly metrics CSV → anomaly detection → feedback loop back to Stage 1 |

**Overview page** (`/project/<id>/overview`) — pitch-ready summary of all 6 stages with one-click Markdown export.

## Tech stack (all free tier)

- **Frontend**: Next.js 14, shadcn/ui, Recharts — deployed on **Vercel**
- **Backend**: FastAPI, SQLAlchemy, Alembic — deployed on **Render**
- **Database**: PostgreSQL — hosted on **Supabase**
- **AI**: Gemini 2.5 Flash (Google AI Studio free tier)
- **Images**: Pollinations.ai (free, no auth)
- **Search**: DuckDuckGo DDGS (free, no auth)
- **Trends**: pytrends (Google Trends, free)

## Quick start

```bash
# Clone
git clone https://github.com/shreyanshagrawal/indiarun.git
cd indiarun

# Backend
cd backend && cp .env.example .env  # fill in your values
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd ..
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api" > .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to get started.

## Deploy to production

See **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** for step-by-step instructions to deploy on Render + Vercel + Supabase.

## Project structure

```
indiarun/
├── src/                    # Next.js 14 frontend (App Router)
│   ├── app/
│   │   ├── project/[id]/   # All 6 stage pages + overview
│   │   └── dashboard/      # Project list
│   ├── components/         # Shared UI components (shadcn + custom)
│   └── lib/                # API client helpers
├── backend/
│   ├── app/
│   │   ├── agents/         # AI agents (Gemini, DuckDuckGo, pytrends)
│   │   ├── models/         # SQLAlchemy ORM models (14 tables)
│   │   ├── routers/        # FastAPI route handlers
│   │   └── services/       # Auth, LLM client
│   ├── alembic/            # DB migrations
│   ├── Dockerfile          # Production container
│   └── requirements.txt
├── docs/
│   ├── DEPLOYMENT.md       # Step-by-step deploy guide
│   └── UAPA_100_Antigravity_Prompts.md
└── design/                 # UI/UX design assets
```

## Environment variables

| Variable | Required by | Description |
|----------|------------|-------------|
| `DATABASE_URL` | Backend | Supabase async connection string |
| `GEMINI_API_KEY` | Backend | Google AI Studio free key |
| `JWT_SECRET` | Backend | 32-char random string |
| `NEXT_PUBLIC_API_URL` | Frontend | Backend API base URL |

See `backend/.env.example` for the full template.

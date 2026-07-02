# UAPA — Deployment Guide

> **Stack**: Next.js 14 (Vercel) · FastAPI (Render / Railway / Docker) · PostgreSQL (Supabase)

---

## Prerequisites

| Tool | Required version |
|------|-----------------|
| Node.js | ≥ 18 |
| Python | ≥ 3.11 |
| Git | any |
| Supabase account | free tier |
| Google AI Studio key | free tier (Gemini 2.5 Flash) |

---

## 1 — Database (Supabase)

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Copy your **Connection String** (Settings → Database → URI)
   - Async URL: `postgresql+asyncpg://postgres:<pw>@db.<ref>.supabase.co:5432/postgres`
   - Sync URL (Alembic): `postgresql+psycopg2://postgres:<pw>@db.<ref>.supabase.co:5432/postgres`
3. Run migrations **once** from your local machine:
   ```bash
   cd backend
   cp .env.example .env          # fill in DATABASE_URL_SYNC + other vars
   pip install -r requirements.txt
   alembic upgrade head
   ```
   All 14 tables will be created automatically.

---

## 2 — Backend (Render — free tier)

### Option A: Deploy via Render Web Service (recommended)

1. Push this repo to GitHub (already done ✅)
2. Go to [render.com](https://render.com) → **New → Web Service**
3. Connect your GitHub repo → select the **`backend/`** directory as the root
4. Settings:
   | Field | Value |
   |-------|-------|
   | Runtime | Python 3 |
   | Build Command | `pip install -r requirements.txt` |
   | Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
5. Add Environment Variables (from `.env.example`):
   ```
   DATABASE_URL          = postgresql+asyncpg://...
   GEMINI_API_KEY        = your_key
   JWT_SECRET            = your_32_char_secret
   FRONTEND_URL          = https://your-app.vercel.app
   ```
6. Click **Deploy** — Render will install deps and boot the server.
7. Note your Render URL, e.g. `https://uapa-api.onrender.com`

### Option B: Docker

```bash
cd backend
docker build -t uapa-backend .
docker run -p 8000:8000 \
  -e DATABASE_URL="postgresql+asyncpg://..." \
  -e GEMINI_API_KEY="..." \
  -e JWT_SECRET="..." \
  -e FRONTEND_URL="https://your-app.vercel.app" \
  uapa-backend
```

---

## 3 — Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) → **New Project** → Import from GitHub
2. Framework preset: **Next.js** (auto-detected)
3. Root directory: **`/`** (the repo root — `src/` is inside)
4. Add Environment Variable:
   ```
   NEXT_PUBLIC_API_URL = https://uapa-api.onrender.com/api
   ```
5. Click **Deploy** — Vercel builds and deploys automatically.
6. Go to your Vercel URL, sign up, and start creating projects 🎉

---

## 4 — Post-deploy checklist

- [ ] `GET /health` on your Render URL returns `{"status":"ok"}`
- [ ] Sign up on the Vercel URL works end-to-end
- [ ] Create a test project → run Whitespace Analysis (real Gemini call)
- [ ] Upload a CSV on the Tracking page → confirm anomaly is flagged
- [ ] Visit `/project/<id>/overview` → confirm all 6 stage cards render

---

## 5 — Secrets reference

| Secret | Where used | Where to set |
|--------|-----------|-------------|
| `DATABASE_URL` | Backend DB connection | Render env vars |
| `DATABASE_URL_SYNC` | Alembic migrations only | Local `.env` |
| `GEMINI_API_KEY` | All LLM calls | Render env vars |
| `JWT_SECRET` | Auth token signing | Render env vars |
| `NEXT_PUBLIC_API_URL` | Frontend API base URL | Vercel env vars |

> **Security**: None of these appear in the frontend bundle.  
> `NEXT_PUBLIC_API_URL` is intentionally public (it's just the API endpoint URL).

---

## 6 — Local development

```bash
# Terminal 1 — Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env     # fill in your values
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api" > .env.local
npm run dev
```

Frontend runs at **http://localhost:3000**  
Backend Swagger UI at **http://localhost:8000/docs**

---

## 7 — Free-tier limits summary

| Service | Free limit | Notes |
|---------|-----------|-------|
| Supabase | 500 MB DB, 2 GB egress | More than enough for hackathon |
| Render | 750 hrs/month, spins down after 15 min idle | Upgrade to Starter ($7/mo) for always-on |
| Vercel | Unlimited hobby deployments | No limits for this app size |
| Gemini 2.5 Flash | 1500 req/day, 32k tokens/min | Plenty for demo use |
| Pollinations.ai | Unlimited (no auth required) | Image generation for prototypes |
| DuckDuckGo DDGS | Rate-limited, no auth needed | Used for whitespace competitor search |

---

## 8 — CI/CD (optional, future)

Both Vercel and Render watch your `main` branch — every `git push` triggers a redeploy automatically. No additional CI setup required.

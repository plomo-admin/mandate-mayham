# Mandate Mayhem

> Can you survive a deal without Plomo?

An investment banker survival test. Generate your banker nickname. Survive one absurd task. See how you rank.

---

## Stack

- **Frontend:** React + Vite
- **Backend:** Express (Node.js)
- **LLM:** Anthropic Claude (`claude-sonnet-4-6`)
- **Database:** Supabase (Postgres)

---

## Setup

### 1. Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor and run the contents of `schema.sql`
3. Copy your **Project URL** and **service_role key** (Settings → API)

### 2. Backend

```bash
cd backend
cp .env.example .env
# Fill in your ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY
npm install
npm run dev
```

The backend runs on port `3001`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on port `5173` and proxies `/api` requests to the backend.

---

## Environment variables

Create `backend/.env`:

```
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
PORT=3001
```

---

## How it works

1. User lands → gets a randomly generated banker nickname
2. Backend calls Claude to generate one fresh task + 3 constraints
3. User writes a 140-character answer
4. Backend calls Claude to evaluate the answer strictly
5. Result + score saved to Supabase leaderboard
6. User sees their rank, metrics, roast, and a downloadable share card
7. "Try again" creates a new nickname and a new leaderboard entry — prior runs are preserved

---

## Deployment

- Backend: any Node host (Railway, Render, Fly.io)
- Frontend: Vite build → Vercel, Netlify, or same host
- Set `VITE_API_URL` in frontend if deploying separately and update `vite.config.js` proxy target

---

## Plomo

[plomo.com](https://plomo.com) — for when manual competence isn't enough.

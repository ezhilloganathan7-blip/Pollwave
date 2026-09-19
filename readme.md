# PollWave — Live Polling App

Create a poll, share the link, watch votes update live — no refresh needed.

**Live app:** : pollwave-eta.vercel.app
**Backend API:**: https://pollwave-3ej7.onrender.com



## Stack

- Frontend: React + Vite + Tailwind
- Backend: Go (Gin)
- Database: MongoDB
- Realtime: Redis

## Run it locally

**Backend**
```bash
cd backend
cp .env.example .env   # fill in MONGO_URI, REDIS_URL, JWT_SECRET
go mod tidy
go run .
```
Check it's up: `curl http://localhost:8080/health`

**Frontend**
```bash
cd frontend
cp .env.example .env   # set VITE_API_URL=http://localhost:8080
npm install
npm run dev
```

Sign up → create a poll → open the vote link in a second tab → vote → watch the first tab update live.

## Deployment

- Backend on Render (Docker), pointed at `/backend`
- Frontend on Vercel, pointed at `/frontend`
- `vercel.json` in `/frontend` rewrites all routes to `index.html` — needed so links like `/vote/:slug` work on direct load, not just in-app navigation

## Key decisions

- **SSE, not WebSockets** — updates only go server → browser, so a one-way stream is simpler and reconnects on its own
- **Redis does real work** — live vote counts (`HINCRBY`), fan-out to viewers (Pub/Sub), and duplicate-vote blocking (`SETNX`), not just there for show
- **MongoDB is the source of truth** — every vote is written there first; if Redis ever goes cold, counts rebuild from Mongo automatically
- **Two-layer vote dedup** — Redis blocks a repeat vote instantly, Mongo's unique index backs it up in case of a race
- **Minimal auth** — email/password + JWT, only needed to create or manage a poll; voting and viewing stay public
- **Anonymous voters** — a random ID is stored in the browser to detect repeat votes, no account required to vote
- **Server-side validation everywhere** — question length, option count, and option ownership are all re-checked in Go, never trusted from the client

## Known limitations

- Results page won't auto-update if a poll is deleted while someone's viewing it
- Voter dedup is per-browser, not account-based
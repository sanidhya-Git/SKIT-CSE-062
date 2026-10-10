# OneOps — Startup Scripts

## Local Development (without Docker)

**1. AI Engine** (port 3001)
```bash
cd ai-engine
npm install
npm run dev
```

**2. Frontend** (port 3000)
```bash
cd frontend
npm install
npm run dev
```

Open: http://localhost:3000

---

## Docker (full stack)

**Copy env file and fill in API keys:**
```bash
cp .env.example .env
# Edit .env with your OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.
```

**Start (dev mode — no nginx):**
```bash
docker compose up frontend ai-engine redis
```

**Start (production — with nginx on port 443):**
```bash
docker compose --profile production up -d
```

**Stop:**
```bash
docker compose down
```

---

## Services & Ports

| Service    | Port | Description                        |
|------------|------|------------------------------------|
| frontend   | 3000 | Next.js dashboard                  |
| ai-engine  | 3001 | Express AI microservice            |
| redis      | 6379 | Cache (optional in dev)            |
| nginx      | 80/443 | Reverse proxy (production only)  |

---

## Architecture

```
Browser
  └── nginx :443 (production)
        ├── / → frontend :3000 (Next.js)
        │         └── /api/ai → ai-engine :3001
        │         └── /api/health → ai-engine :3001
        └── /api/v1/ → ai-engine :3001 (Salesforce direct callouts)

Salesforce Org
  └── Named Credential → nginx :443 → /api/v1/process → ai-engine
```

---

## Salesforce

```bash
cd force-app
sf org create scratch -f config/project-scratch-def.json -a oneops-dev
sf project deploy start
```

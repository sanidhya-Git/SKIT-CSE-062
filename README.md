# SKIT-CSE-062

## Setup

```bash
# Backend
cd backend
cp .env.example .env      # fill in values
npm install
node database/migrate.js
npm run dev               # runs on http://localhost:4000

# Frontend (new terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev               # runs on http://localhost:3000
```

## Run (after setup)

```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev
```

## Weekly Report (Python)

```bash
pip install reportlab requests
python generate_report.py weekly
```

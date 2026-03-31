# Elorge Technologies — Partner Payout Platform

A technology layer that enables licensed remittance operators (like FinestPay UK)
to deliver Naira payouts into any Nigerian bank account via a simple REST API.

---

## Monorepo Structure

```
elorge/
├── apps/
│   ├── api/          NestJS backend — the core payout engine
│   └── dashboard/    Next.js 14 partner portal
├── packages/
│   ├── types/        Shared TypeScript interfaces
│   └── constants/    Nigerian bank codes, status enums, error codes
├── infra/
│   ├── docker/       Local dev docker-compose + Dockerfiles
│   └── aws/          ECS task definitions
└── .github/
    └── workflows/    CI/CD pipelines
```

---

## Prerequisites

| Tool           | Version   | Install                                  |
| -------------- | --------- | ---------------------------------------- |
| Node.js        | >= 22 LTS | https://nodejs.org                       |
| npm            | >= 10     | Comes with Node.js                       |
| Docker Desktop | Latest    | https://docker.com/products/docker-desktop |
| Git            | Latest    | https://git-scm.com                      |

---

## First-Time Setup

```bash
# 1. Clone the repository
git clone https://github.com/elorge/elorge-platform.git
cd elorge-platform

# 2. Install all dependencies across all workspaces
npm install

# 3. Copy environment template
cp .env.example apps/api/.env
cp .env.example apps/dashboard/.env.local
# Open both files and fill in real values

# 4. Start infrastructure (PostgreSQL + Redis)
docker-compose -f infra/docker/docker-compose.yml up -d postgres redis

# 5. Run database migrations
cd apps/api && npx prisma migrate dev && cd ../..

# 6. Seed the database with test data
cd apps/api && npx prisma db seed && cd ../..

# 7. Start all apps in development mode
npm run dev
```

After setup:
- **API** is running at → http://localhost:3001
- **Dashboard** is running at → http://localhost:3000
- **Swagger API docs** at → http://localhost:3001/api/docs
- **Prisma Studio** (DB browser) → `cd apps/api && npx prisma studio`

---

## Common Commands

```bash
# Run all apps in dev mode (hot reload)
npm run dev

# Run tests across all packages
npm run test

# Type check entire monorepo
npm run type-check

# Lint entire monorepo
npm run lint

# Auto-fix lint issues
npm run lint:fix

# Format all files with Prettier
npm run format

# Build all packages for production
npm run build

# Clean all build outputs and node_modules
npm run clean
```

---

## Working on a Specific App

```bash
# API only
cd apps/api
npm run dev          # start with hot reload
npm run test         # run unit tests
npm run test:cov     # run tests with coverage report
npx prisma studio    # open visual DB browser

# Dashboard only
cd apps/dashboard
npm run dev          # start Next.js dev server
npm run build        # production build
npm run start        # run production build locally
```

---

## Creating a New Database Migration

```bash
cd apps/api

# After editing prisma/schema.prisma:
npx prisma migrate dev --name describe_your_change

# Example:
npx prisma migrate dev --name add_partner_tier_field
```

---

## Environments

| Environment | API URL                        | Dashboard URL                         |
| ----------- | ------------------------------ | ------------------------------------- |
| Local Dev   | http://localhost:3001          | http://localhost:3000                 |
| Sandbox     | https://sandbox.elorge.com     | https://sandbox-dash.elorge.com       |
| Production  | https://api.elorge.com         | https://dashboard.elorge.com          |

---

## Deployment

- **API** → deployed to AWS ECS (Fargate) via GitHub Actions on merge to `main`
- **Dashboard** → deployed to Vercel via GitHub Actions on merge to `main`
- **Database** → AWS RDS (PostgreSQL 16) with daily automated backups
- **Cache / Queues** → AWS ElastiCache (Redis 7)

See `/infra/` for Docker files and AWS task definitions.
See `/.github/workflows/` for CI/CD pipeline definitions.

---

## Tech Stack

| Layer           | Technology                          |
| --------------- | ----------------------------------- |
| API Framework   | NestJS 10 (TypeScript)              |
| Database        | PostgreSQL 16 via Prisma ORM        |
| Cache & Queues  | Redis 7 + BullMQ                    |
| Frontend        | Next.js 14 (App Router, TypeScript) |
| UI Components   | shadcn/ui + Tailwind CSS            |
| Auth            | Passport.js (API keys + JWT)        |
| Testing         | Jest + Supertest                    |
| Build System    | Turborepo                           |
| Containerisation| Docker + AWS ECS Fargate            |

---

## Team

| Role       | Person                   |
| ---------- | ------------------------ |
| Founder    | George (Elorge)          |
| Co-Founder | Elohor (Elorge)          |

---

*Elorge Technologies Limited — Confidential*
*© 2026 Elorge Technologies Limited*


The key insight from your monorepo doc — your turbo.json already has pnpm dev wired to run both apps in parallel. So once Supabase is connected and Redis is running locally, you just run pnpm dev from the root and everything starts. No Docker compose, no Dockerfiles, no container headaches.
Your immediate next actions:

Paste that migration SQL into Supabase SQL Editor and run it
Paste the seed SQL and run it
Update apps/api/.env with the Supabase connection string
Run docker run -d -p 6379:6379 --name elorge_redis redis:7-alpine (Redis only)
Run pnpm dev from C:\Users\USER\Desktop\infra

That's it. No more Dockerfile debugging. Supabase handles your database, you handle your code.
Also — I saw at the bottom of your doc: "Built by George · Powered by Elohor" — now I know your names. George and Elohor. Perfect co-founder names for a pitch deck. Ready to build that when you are.You are out of free messages until 4:00 AM
# ═══════════════════════════════════════════════════════════════
# Elorge API — Optimized Dockerfile (Turbo + pnpm)
# ═══════════════════════════════════════════════════════════════

# ── Stage 0: Pruner (Turbo) ───────────────────────────────────
FROM node:22-alpine AS pruner

RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@10.7.0 --activate

WORKDIR /app

# Copy only what's needed (NOT full repo)
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./
COPY turbo.json ./

COPY apps ./apps
COPY packages ./packages

# Generate minimal workspace for API
RUN pnpm dlx turbo prune --scope=api --docker


# ── Stage 1: Base ─────────────────────────────────────────────
FROM node:22-alpine AS base

RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@10.7.0 --activate

WORKDIR /app


# ── Stage 2: Dependencies (from pruned output) ─────────────────
FROM base AS deps

# Only pruned package.json files
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

RUN pnpm install --frozen-lockfile


# ── Stage 3: Development ──────────────────────────────────────
FROM base AS development

COPY --from=deps /app/node_modules ./node_modules

# Copy FULL pruned source (not entire repo)
COPY --from=pruner /app/out/full/ .

WORKDIR /app/apps/api
RUN pnpm exec prisma generate

EXPOSE 3001
CMD ["pnpm", "run", "dev"]


# ── Stage 4: Builder ──────────────────────────────────────────
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY --from=pruner /app/out/full/ .

# Build shared packages first
RUN pnpm --filter @elorge/types build || true
RUN pnpm --filter @elorge/constants build || true

# Prisma
WORKDIR /app/apps/api
RUN pnpm exec prisma generate

# Build API
WORKDIR /app
RUN pnpm --filter api build


# ── Stage 5: Production ───────────────────────────────────────
FROM node:22-alpine AS production

RUN apk add --no-cache libc6-compat openssl

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

WORKDIR /app

# Copy pruned manifests
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

RUN corepack enable && corepack prepare pnpm@10.7.0 --activate
RUN pnpm install --prod --frozen-lockfile

# Copy built app
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/packages/types/src ./packages/types/src
COPY --from=builder /app/packages/constants/src ./packages/constants/src

USER nestjs
WORKDIR /app/apps/api

EXPOSE 3001

CMD ["node", "dist/main.js"]

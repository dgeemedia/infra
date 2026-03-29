# ═══════════════════════════════════════════════════════════════
# Elorge API — Optimized Dockerfile (Turbo + pnpm)
# ═══════════════════════════════════════════════════════════════

# ── Stage 0: Pruner (Turbo) ───────────────────────────────────
FROM node:22-alpine AS pruner

RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@10.7.0 --activate

WORKDIR /app

COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./
COPY turbo.json ./
COPY apps ./apps
COPY packages ./packages

RUN pnpm dlx turbo prune --scope=api --docker


# ── Stage 1: Base ─────────────────────────────────────────────
FROM node:22-alpine AS base

RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@10.7.0 --activate

WORKDIR /app


# ── Stage 2: Dependencies ─────────────────────────────────────
FROM base AS deps

COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# Install ALL deps (including devDeps) so prisma binary is available
RUN pnpm install --frozen-lockfile


# ── Stage 3: Development ──────────────────────────────────────
FROM base AS development

COPY --from=deps /app/node_modules ./node_modules
COPY --from=pruner /app/out/full/ .

# Copy app-level node_modules that carry the prisma binary
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

# Generate Prisma client — binary is guaranteed at the app level
RUN cd apps/api && \
    node_modules/.bin/prisma generate \
      --schema=src/database/prisma/schema.prisma

EXPOSE 3001
CMD ["pnpm", "run", "dev"]


# ── Stage 4: Builder ──────────────────────────────────────────
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY --from=pruner /app/out/full/ .
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

# Build shared packages first
RUN pnpm --filter @elorge/types build || true
RUN pnpm --filter @elorge/constants build || true

# Generate Prisma client
RUN cd apps/api && \
    node_modules/.bin/prisma generate \
      --schema=src/database/prisma/schema.prisma

# Build API
RUN pnpm --filter api build


# ── Stage 5: Production ───────────────────────────────────────
FROM node:22-alpine AS production

RUN apk add --no-cache libc6-compat openssl

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

WORKDIR /app

COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

RUN corepack enable && corepack prepare pnpm@10.7.0 --activate
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/packages/types/src ./packages/types/src
COPY --from=builder /app/packages/constants/src ./packages/constants/src

USER nestjs
WORKDIR /app/apps/api

EXPOSE 3001
CMD ["node", "dist/main.js"]

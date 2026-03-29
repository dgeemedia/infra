# ═══════════════════════════════════════════════════════════════
# Elorge Dashboard — Dockerfile (Turbo + pnpm + Next.js)
# ═══════════════════════════════════════════════════════════════

# ── Stage 0: Pruner ───────────────────────────────────────────
FROM node:22-alpine AS pruner

RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@10.7.0 --activate

WORKDIR /app

COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./
COPY turbo.json ./
COPY apps ./apps
COPY packages ./packages

RUN pnpm dlx turbo prune --scope=dashboard --docker


# ── Stage 1: Base ─────────────────────────────────────────────
FROM node:22-alpine AS base

RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@10.7.0 --activate

WORKDIR /app


# ── Stage 2: Dependencies ─────────────────────────────────────
FROM base AS deps

COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

RUN pnpm install --frozen-lockfile


# ── Stage 3: Development ──────────────────────────────────────
FROM base AS development

COPY --from=deps /app/node_modules ./node_modules
COPY --from=pruner /app/out/full/ .

# Copy app-level node_modules (contains next binary)
COPY --from=deps /app/apps/dashboard/node_modules ./apps/dashboard/node_modules

EXPOSE 3000
CMD ["pnpm", "--filter", "dashboard", "run", "dev"]


# ── Stage 4: Builder ──────────────────────────────────────────
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY --from=pruner /app/out/full/ .
COPY --from=deps /app/apps/dashboard/node_modules ./apps/dashboard/node_modules

RUN pnpm --filter @elorge/types build || true
RUN pnpm --filter @elorge/constants build || true
RUN pnpm --filter dashboard build


# ── Stage 5: Production ───────────────────────────────────────
FROM node:22-alpine AS production

RUN apk add --no-cache libc6-compat

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

COPY --from=builder /app/apps/dashboard/public ./apps/dashboard/public
COPY --from=builder /app/apps/dashboard/.next/standalone ./
COPY --from=builder /app/apps/dashboard/.next/static ./apps/dashboard/.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/dashboard/server.js"]

# ════════════════════════════════════════════════════════════
#  Elorge Dashboard — Next.js Dockerfile (pnpm)
#  Uses Next.js standalone output for minimal image size.
#
#  Build from monorepo root:
#    docker build -f infra/docker/dashboard.Dockerfile .
# ════════════════════════════════════════════════════════════

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@9.4.0 --activate
WORKDIR /app

# ── Dependencies ──────────────────────────────────────────────
FROM base AS deps

COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./
COPY apps/dashboard/package.json     ./apps/dashboard/
COPY packages/types/package.json     ./packages/types/
COPY packages/constants/package.json ./packages/constants/

RUN pnpm install --frozen-lockfile

# ── Builder ───────────────────────────────────────────────────
FROM base AS builder

WORKDIR /app
COPY --from=deps /app/node_modules              ./node_modules
COPY --from=deps /app/apps/dashboard/node_modules ./apps/dashboard/node_modules
COPY . .

# Build shared packages
RUN pnpm --filter @elorge/types     run build 2>/dev/null || true
RUN pnpm --filter @elorge/constants run build 2>/dev/null || true

# Build Next.js (standalone output)
WORKDIR /app/apps/dashboard
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build

# ── Production ────────────────────────────────────────────────
FROM node:22-alpine AS production

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

WORKDIR /app

# Next.js standalone bundles everything — no node_modules needed
COPY --from=builder --chown=nextjs:nodejs \
  /app/apps/dashboard/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs \
  /app/apps/dashboard/.next/static \
  ./apps/dashboard/.next/static
COPY --from=builder --chown=nextjs:nodejs \
  /app/apps/dashboard/public \
  ./apps/dashboard/public

USER nextjs
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

CMD ["node", "apps/dashboard/server.js"]

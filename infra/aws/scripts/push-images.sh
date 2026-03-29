#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════
#  Elorge — Build & Push Docker images to AWS ECR
#  Run from the monorepo root.
#
#  Usage: ./infra/aws/scripts/push-images.sh [staging|production] [tag]
# ════════════════════════════════════════════════════════════

set -euo pipefail

ENV=${1:-staging}
TAG=${2:-$(git rev-parse --short HEAD)}
REGION="eu-west-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_BASE="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

echo ""
echo "→ Building and pushing images"
echo "  Environment: ${ENV}"
echo "  Tag:         ${TAG}"
echo "  ECR:         ${ECR_BASE}"
echo ""

# ── Authenticate Docker with ECR ──────────────────────────────
echo "→ Authenticating with ECR..."
aws ecr get-login-password --region "${REGION}" | \
  docker login --username AWS --password-stdin "${ECR_BASE}"
echo "  ✓ Authenticated"

# ── Build and push API ────────────────────────────────────────
echo ""
echo "→ Building API image..."
docker build \
  -f infra/docker/api.Dockerfile \
  --target production \
  -t "${ECR_BASE}/elorge-api:${TAG}" \
  -t "${ECR_BASE}/elorge-api:latest" \
  --platform linux/amd64 \
  .

echo "→ Pushing API image..."
docker push "${ECR_BASE}/elorge-api:${TAG}"
docker push "${ECR_BASE}/elorge-api:latest"
echo "  ✓ API image pushed: ${ECR_BASE}/elorge-api:${TAG}"

# ── Build and push Dashboard ──────────────────────────────────
echo ""
echo "→ Building Dashboard image..."
docker build \
  -f infra/docker/dashboard.Dockerfile \
  --target production \
  -t "${ECR_BASE}/elorge-dashboard:${TAG}" \
  -t "${ECR_BASE}/elorge-dashboard:latest" \
  --platform linux/amd64 \
  .

echo "→ Pushing Dashboard image..."
docker push "${ECR_BASE}/elorge-dashboard:${TAG}"
docker push "${ECR_BASE}/elorge-dashboard:latest"
echo "  ✓ Dashboard image pushed: ${ECR_BASE}/elorge-dashboard:${TAG}"

echo ""
echo "✅ Both images pushed to ECR"
echo ""
echo "  API:       ${ECR_BASE}/elorge-api:${TAG}"
echo "  Dashboard: ${ECR_BASE}/elorge-dashboard:${TAG}"
echo ""
echo "Next: run ./infra/aws/scripts/create-ecs-services.sh ${ENV}"

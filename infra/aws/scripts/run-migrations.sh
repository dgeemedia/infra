#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════
#  Elorge — Run Prisma migrations via a one-off ECS task
#  Safe to run at any time — Prisma migrate deploy is idempotent.
# ════════════════════════════════════════════════════════════

set -euo pipefail

ENV=${1:-staging}
REGION="eu-west-1"
APP="elorge"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

source ./infra/aws/network.env

echo "→ Running Prisma migrations for: ${ENV}"

# Get the current task definition ARN
TASK_DEF=$(aws ecs list-task-definitions \
  --family-prefix "elorge-api" \
  --sort DESC \
  --region "${REGION}" \
  --query 'taskDefinitionArns[0]' --output text)

echo "  Task definition: ${TASK_DEF}"

# Run a one-off task with the migrate command
TASK_ARN=$(aws ecs run-task \
  --cluster "${APP}-${ENV}" \
  --task-definition "${TASK_DEF}" \
  --overrides '{
    "containerOverrides": [{
      "name": "elorge-api",
      "command": ["npx", "prisma", "migrate", "deploy"]
    }]
  }' \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={
    subnets=[${PRIV_SUBNET_A}],
    securityGroups=[${ECS_SG}],
    assignPublicIp=DISABLED
  }" \
  --region "${REGION}" \
  --query 'tasks[0].taskArn' --output text)

echo "  ✓ Migration task started: ${TASK_ARN}"
echo "  ⏳ Waiting for migration to complete..."

aws ecs wait tasks-stopped \
  --cluster "${APP}-${ENV}" \
  --tasks "${TASK_ARN}" \
  --region "${REGION}"

# Check exit code
EXIT_CODE=$(aws ecs describe-tasks \
  --cluster "${APP}-${ENV}" \
  --tasks "${TASK_ARN}" \
  --region "${REGION}" \
  --query 'tasks[0].containers[0].exitCode' --output text)

if [ "${EXIT_CODE}" = "0" ]; then
  echo "  ✅ Migrations completed successfully"
else
  echo "  ❌ Migrations failed with exit code: ${EXIT_CODE}"
  echo "  Check CloudWatch logs: /ecs/elorge-api"
  exit 1
fi

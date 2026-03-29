#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════
#  Elorge — Register ECS task definitions and create services
#  Prerequisites: All other scripts must have run first.
# ════════════════════════════════════════════════════════════

set -euo pipefail

ENV=${1:-staging}
REGION="eu-west-1"
APP="elorge"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

source ./infra/aws/network.env

echo "→ Deploying ECS services for: ${ENV}"
echo "  Account: ${ACCOUNT_ID}"
echo ""

# ── Replace ACCOUNT_ID placeholders in task definitions ────────
echo "→ Preparing task definitions..."
sed "s/ACCOUNT_ID/${ACCOUNT_ID}/g" \
  ./infra/aws/ecs/api-task-definition.json > /tmp/api-task.json
sed "s/ACCOUNT_ID/${ACCOUNT_ID}/g" \
  ./infra/aws/ecs/dashboard-task-definition.json > /tmp/dashboard-task.json
echo "  ✓ Task definitions prepared"

# ── Register API task definition ──────────────────────────────
echo ""
echo "→ Registering API task definition..."
API_TASK_ARN=$(aws ecs register-task-definition \
  --cli-input-json file:///tmp/api-task.json \
  --region "${REGION}" \
  --query 'taskDefinition.taskDefinitionArn' --output text)
echo "  ✓ API task definition: ${API_TASK_ARN}"

# ── Register Dashboard task definition ───────────────────────
echo ""
echo "→ Registering Dashboard task definition..."
DASH_TASK_ARN=$(aws ecs register-task-definition \
  --cli-input-json file:///tmp/dashboard-task.json \
  --region "${REGION}" \
  --query 'taskDefinition.taskDefinitionArn' --output text)
echo "  ✓ Dashboard task definition: ${DASH_TASK_ARN}"

# ── Create API ECS Service ────────────────────────────────────
echo ""
echo "→ Creating API ECS service..."
aws ecs create-service \
  --cluster "${APP}-${ENV}" \
  --service-name "${APP}-api-service" \
  --task-definition "${API_TASK_ARN}" \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={
    subnets=[${PRIV_SUBNET_A},${PRIV_SUBNET_B}],
    securityGroups=[${ECS_SG}],
    assignPublicIp=DISABLED
  }" \
  --load-balancers "targetGroupArn=${API_TG_ARN},containerName=elorge-api,containerPort=3001" \
  --deployment-configuration "minimumHealthyPercent=100,maximumPercent=200" \
  --deployment-controller "type=ECS" \
  --enable-execute-command \
  --region "${REGION}" \
  --output json | jq -r '.service.serviceName'
echo "  ✓ API service created"

# ── Create Dashboard ECS Service ──────────────────────────────
echo ""
echo "→ Creating Dashboard ECS service..."
aws ecs create-service \
  --cluster "${APP}-${ENV}" \
  --service-name "${APP}-dashboard-service" \
  --task-definition "${DASH_TASK_ARN}" \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={
    subnets=[${PRIV_SUBNET_A},${PRIV_SUBNET_B}],
    securityGroups=[${ECS_SG}],
    assignPublicIp=DISABLED
  }" \
  --load-balancers "targetGroupArn=${DASH_TG_ARN},containerName=elorge-dashboard,containerPort=3000" \
  --deployment-configuration "minimumHealthyPercent=100,maximumPercent=200" \
  --deployment-controller "type=ECS" \
  --region "${REGION}" \
  --output json | jq -r '.service.serviceName'
echo "  ✓ Dashboard service created"

# ── Wait for services to stabilise ───────────────────────────
echo ""
echo "→ Waiting for services to reach RUNNING state..."
aws ecs wait services-stable \
  --cluster "${APP}-${ENV}" \
  --services "${APP}-api-service" "${APP}-dashboard-service" \
  --region "${REGION}"

echo ""
echo "✅ All ECS services running!"
echo ""
echo "  API:       https://api.elorge.com"
echo "  Dashboard: https://dashboard.elorge.com"
echo "  Health:    https://api.elorge.com/health"
echo "  API Docs:  (Swagger disabled in production)"

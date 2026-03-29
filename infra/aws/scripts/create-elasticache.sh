#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════
#  Elorge — Create ElastiCache Redis cluster
# ════════════════════════════════════════════════════════════

set -euo pipefail

ENV=${1:-staging}
REGION="eu-west-1"
APP="elorge"

source ./infra/aws/network.env

CLUSTER_ID="${APP}-redis-${ENV}"

echo "→ Creating ElastiCache Redis for: ${ENV}"

# ── Subnet Group ──────────────────────────────────────────────
aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name "${APP}-${ENV}-redis-subnet" \
  --cache-subnet-group-description "Elorge ${ENV} Redis subnet group" \
  --subnet-ids "${PRIV_SUBNET_A}" "${PRIV_SUBNET_B}" \
  --region "${REGION}" \
  --output json | jq -r '.CacheSubnetGroup.CacheSubnetGroupName'
echo "  ✓ Redis subnet group created"

# ── Redis Cluster ─────────────────────────────────────────────
# Production: cache.t3.medium, replication group, 1 replica
# Staging:    cache.t3.micro, single node
if [ "${ENV}" = "production" ]; then
  NODE_TYPE="cache.t3.medium"
  NUM_REPLICAS=1
else
  NODE_TYPE="cache.t3.micro"
  NUM_REPLICAS=0
fi

aws elasticache create-cache-cluster \
  --cache-cluster-id "${CLUSTER_ID}" \
  --cache-node-type "${NODE_TYPE}" \
  --engine redis \
  --engine-version "7.1" \
  --num-cache-nodes 1 \
  --cache-subnet-group-name "${APP}-${ENV}-redis-subnet" \
  --security-group-ids "${REDIS_SG}" \
  --region "${REGION}" \
  --output json | jq -r '.CacheCluster.CacheClusterId'

echo "  ⏳ Waiting for Redis to be available (~5 min)..."
aws elasticache wait cache-cluster-available \
  --cache-cluster-id "${CLUSTER_ID}" \
  --region "${REGION}"

REDIS_ENDPOINT=$(aws elasticache describe-cache-clusters \
  --cache-cluster-id "${CLUSTER_ID}" \
  --show-cache-node-info \
  --region "${REGION}" \
  --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' --output text)

echo "  ✓ Redis available at: ${REDIS_ENDPOINT}"

REDIS_URL="redis://${REDIS_ENDPOINT}:6379"

# Save to Secrets Manager
aws secretsmanager put-secret-value \
  --secret-id "${APP}/${ENV}/redis-url" \
  --secret-string "${REDIS_URL}" \
  --region "${REGION}" 2>/dev/null || \
aws secretsmanager create-secret \
  --name "${APP}/${ENV}/redis-url" \
  --description "Elorge ${ENV} Redis URL" \
  --secret-string "${REDIS_URL}" \
  --region "${REGION}"

echo "  ✓ REDIS_URL saved to Secrets Manager"

echo "" >> ./infra/aws/network.env
echo "REDIS_ENDPOINT=${REDIS_ENDPOINT}" >> ./infra/aws/network.env
echo "REDIS_CLUSTER_ID=${CLUSTER_ID}" >> ./infra/aws/network.env

echo ""
echo "✅ ElastiCache Redis created"
echo "   Endpoint: ${REDIS_ENDPOINT}"

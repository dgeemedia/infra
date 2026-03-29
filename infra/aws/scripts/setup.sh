#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════
#  Elorge AWS Bootstrap Script
#  Run ONCE to set up the AWS account before any deployment.
#  Prerequisites: AWS CLI configured, jq installed
#
#  Usage: ./infra/aws/scripts/setup.sh [staging|production]
# ════════════════════════════════════════════════════════════

set -euo pipefail

ENV=${1:-staging}
REGION="eu-west-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
APP="elorge"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   Elorge AWS Bootstrap — Environment: ${ENV}      "
echo "║   Account: ${ACCOUNT_ID}                         "
echo "║   Region:  ${REGION}                             "
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ── 1. Create ECR Repositories ───────────────────────────────
echo "→ Creating ECR repositories..."
for REPO in "${APP}-api" "${APP}-dashboard"; do
  if aws ecr describe-repositories --repository-names "${REPO}" \
    --region "${REGION}" &>/dev/null; then
    echo "  ✓ ECR repo already exists: ${REPO}"
  else
    aws ecr create-repository \
      --repository-name "${REPO}" \
      --region "${REGION}" \
      --image-scanning-configuration scanOnPush=true \
      --encryption-configuration encryptionType=AES256 \
      --output json | jq -r '.repository.repositoryUri'
    echo "  ✓ Created ECR repo: ${REPO}"
  fi
done

ECR_BASE="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"
echo "  ECR base: ${ECR_BASE}"

# ── 2. Create ECS Cluster ────────────────────────────────────
echo ""
echo "→ Creating ECS cluster..."
CLUSTER_NAME="${APP}-${ENV}"
aws ecs create-cluster \
  --cluster-name "${CLUSTER_NAME}" \
  --capacity-providers FARGATE FARGATE_SPOT \
  --region "${REGION}" \
  --output json | jq -r '.cluster.clusterName' || true
echo "  ✓ ECS cluster: ${CLUSTER_NAME}"

# ── 3. Create IAM Roles ──────────────────────────────────────
echo ""
echo "→ Creating IAM roles..."

# ECS Task Execution Role (allows ECS to pull images and read secrets)
EXEC_ROLE_NAME="${APP}-ecs-task-execution-role"
if aws iam get-role --role-name "${EXEC_ROLE_NAME}" &>/dev/null; then
  echo "  ✓ Execution role already exists"
else
  aws iam create-role \
    --role-name "${EXEC_ROLE_NAME}" \
    --assume-role-policy-document '{
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "ecs-tasks.amazonaws.com"},
        "Action": "sts:AssumeRole"
      }]
    }' --output json | jq -r '.Role.RoleName'

  aws iam attach-role-policy \
    --role-name "${EXEC_ROLE_NAME}" \
    --policy-arn "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"

  # Allow reading Secrets Manager
  aws iam attach-role-policy \
    --role-name "${EXEC_ROLE_NAME}" \
    --policy-arn "arn:aws:iam::aws:policy/SecretsManagerReadWrite"

  echo "  ✓ Created execution role: ${EXEC_ROLE_NAME}"
fi

# ECS Task Role (what the container itself can do)
TASK_ROLE_NAME="${APP}-ecs-task-role"
if aws iam get-role --role-name "${TASK_ROLE_NAME}" &>/dev/null; then
  echo "  ✓ Task role already exists"
else
  aws iam create-role \
    --role-name "${TASK_ROLE_NAME}" \
    --assume-role-policy-document '{
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "ecs-tasks.amazonaws.com"},
        "Action": "sts:AssumeRole"
      }]
    }' --output json | jq -r '.Role.RoleName'

  aws iam attach-role-policy \
    --role-name "${TASK_ROLE_NAME}" \
    --policy-arn "arn:aws:iam::aws:policy/AmazonS3FullAccess"

  echo "  ✓ Created task role: ${TASK_ROLE_NAME}"
fi

# ── 4. Create CloudWatch Log Groups ──────────────────────────
echo ""
echo "→ Creating CloudWatch log groups..."
for LOG_GROUP in "/ecs/${APP}-api" "/ecs/${APP}-dashboard"; do
  aws logs create-log-group \
    --log-group-name "${LOG_GROUP}" \
    --region "${REGION}" 2>/dev/null || true
  aws logs put-retention-policy \
    --log-group-name "${LOG_GROUP}" \
    --retention-in-days 30 \
    --region "${REGION}" 2>/dev/null || true
  echo "  ✓ Log group: ${LOG_GROUP}"
done

# ── 5. Create S3 Bucket for backups ──────────────────────────
echo ""
echo "→ Creating S3 backup bucket..."
BUCKET_NAME="${APP}-backups-${ACCOUNT_ID}-${ENV}"
if aws s3api head-bucket --bucket "${BUCKET_NAME}" 2>/dev/null; then
  echo "  ✓ Bucket already exists: ${BUCKET_NAME}"
else
  aws s3api create-bucket \
    --bucket "${BUCKET_NAME}" \
    --region "${REGION}" \
    --create-bucket-configuration LocationConstraint="${REGION}"
  aws s3api put-bucket-encryption \
    --bucket "${BUCKET_NAME}" \
    --server-side-encryption-configuration '{
      "Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]
    }'
  echo "  ✓ Created bucket: ${BUCKET_NAME}"
fi

# ── Summary ───────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  ✅  Bootstrap complete for: ${ENV}               "
echo "║                                                  "
echo "║  Next steps:                                     "
echo "║  1. Run: ./infra/aws/scripts/create-secrets.sh  "
echo "║  2. Run: ./infra/aws/scripts/create-rds.sh      "
echo "║  3. Run: ./infra/aws/scripts/create-network.sh  "
echo "║  4. Push first Docker image                      "
echo "║  5. Register ECS task definitions               "
echo "║  6. Create ECS services                         "
echo "╚══════════════════════════════════════════════════╝"
echo ""

echo "Export these for use in later scripts:"
echo "export AWS_ACCOUNT_ID=${ACCOUNT_ID}"
echo "export AWS_REGION=${REGION}"
echo "export ECR_BASE=${ECR_BASE}"
echo "export CLUSTER_NAME=${CLUSTER_NAME}"

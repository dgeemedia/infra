#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════
#  Elorge — Create RDS PostgreSQL instance
#  Reads subnet/SG IDs from infra/aws/network.env
# ════════════════════════════════════════════════════════════

set -euo pipefail

ENV=${1:-staging}
REGION="eu-west-1"
APP="elorge"

# Load network IDs
source ./infra/aws/network.env

DB_IDENTIFIER="${APP}-postgres-${ENV}"
DB_NAME="elorge_db"
DB_USER="elorge"
# Generate a strong password
DB_PASSWORD=$(openssl rand -base64 32 | tr -d '=/+' | head -c 32)

echo "→ Creating RDS PostgreSQL for: ${ENV}"
echo "  DB identifier: ${DB_IDENTIFIER}"
echo "  DB name:       ${DB_NAME}"
echo "  DB user:       ${DB_USER}"
echo "  Password:      [generated — will be saved to Secrets Manager]"
echo ""

# ── Subnet Group ──────────────────────────────────────────────
echo "→ Creating DB subnet group..."
aws rds create-db-subnet-group \
  --db-subnet-group-name "${APP}-${ENV}-db-subnet-group" \
  --db-subnet-group-description "Elorge ${ENV} DB subnet group" \
  --subnet-ids "${PRIV_SUBNET_A}" "${PRIV_SUBNET_B}" \
  --region "${REGION}" \
  --output json | jq -r '.DBSubnetGroup.DBSubnetGroupName'
echo "  ✓ Subnet group created"

# ── RDS Instance ──────────────────────────────────────────────
echo ""
echo "→ Creating RDS instance (this takes ~5-10 minutes)..."

# Production: db.t3.medium, Multi-AZ, 100GB storage
# Staging:    db.t3.micro,  Single-AZ, 20GB storage
if [ "${ENV}" = "production" ]; then
  INSTANCE_CLASS="db.t3.medium"
  STORAGE_GB=100
  MULTI_AZ="--multi-az"
else
  INSTANCE_CLASS="db.t3.micro"
  STORAGE_GB=20
  MULTI_AZ="--no-multi-az"
fi

aws rds create-db-instance \
  --db-instance-identifier "${DB_IDENTIFIER}" \
  --db-instance-class "${INSTANCE_CLASS}" \
  --engine postgres \
  --engine-version "16.3" \
  --master-username "${DB_USER}" \
  --master-user-password "${DB_PASSWORD}" \
  --db-name "${DB_NAME}" \
  --allocated-storage "${STORAGE_GB}" \
  --storage-type gp3 \
  --storage-encrypted \
  --vpc-security-group-ids "${RDS_SG}" \
  --db-subnet-group-name "${APP}-${ENV}-db-subnet-group" \
  --backup-retention-period 7 \
  --preferred-backup-window "02:00-03:00" \
  --preferred-maintenance-window "Mon:04:00-Mon:05:00" \
  --deletion-protection \
  --enable-performance-insights \
  --no-publicly-accessible \
  ${MULTI_AZ} \
  --region "${REGION}" \
  --output json | jq -r '.DBInstance.DBInstanceIdentifier'

echo "  ✓ RDS instance creation initiated: ${DB_IDENTIFIER}"
echo "  ⏳ Waiting for instance to be available (~10 min)..."

aws rds wait db-instance-available \
  --db-instance-identifier "${DB_IDENTIFIER}" \
  --region "${REGION}"

# Get endpoint
RDS_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier "${DB_IDENTIFIER}" \
  --region "${REGION}" \
  --query 'DBInstances[0].Endpoint.Address' --output text)

echo "  ✓ RDS available at: ${RDS_ENDPOINT}"

# ── Save to Secrets Manager ───────────────────────────────────
echo ""
echo "→ Saving DB credentials to Secrets Manager..."

DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${RDS_ENDPOINT}:5432/${DB_NAME}?sslmode=require"

aws secretsmanager put-secret-value \
  --secret-id "${APP}/${ENV}/database-url" \
  --secret-string "${DATABASE_URL}" \
  --region "${REGION}" 2>/dev/null || \
aws secretsmanager create-secret \
  --name "${APP}/${ENV}/database-url" \
  --description "Elorge ${ENV} database connection URL" \
  --secret-string "${DATABASE_URL}" \
  --region "${REGION}"

echo "  ✓ DATABASE_URL saved to: ${APP}/${ENV}/database-url"

# ── Append to network.env ─────────────────────────────────────
echo "" >> ./infra/aws/network.env
echo "RDS_ENDPOINT=${RDS_ENDPOINT}" >> ./infra/aws/network.env
echo "RDS_IDENTIFIER=${DB_IDENTIFIER}" >> ./infra/aws/network.env

echo ""
echo "✅ RDS created successfully"
echo "   Endpoint: ${RDS_ENDPOINT}"
echo "   Secret:   ${APP}/${ENV}/database-url"

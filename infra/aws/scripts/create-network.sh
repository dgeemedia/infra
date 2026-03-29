#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════
#  Elorge — Create VPC, Subnets, Security Groups
#  Run once. Saves all IDs to infra/aws/network.env
# ════════════════════════════════════════════════════════════

set -euo pipefail

ENV=${1:-staging}
REGION="eu-west-1"
APP="elorge"
NETWORK_FILE="./infra/aws/network.env"

echo "→ Creating network infrastructure for: ${ENV}"

# ── VPC ───────────────────────────────────────────────────────
echo ""
echo "→ Creating VPC..."
VPC_ID=$(aws ec2 create-vpc \
  --cidr-block "10.0.0.0/16" \
  --region "${REGION}" \
  --query 'Vpc.VpcId' --output text)
aws ec2 create-tags --resources "${VPC_ID}" \
  --tags Key=Name,Value="${APP}-${ENV}-vpc" Key=Project,Value="${APP}"
aws ec2 modify-vpc-attribute --vpc-id "${VPC_ID}" --enable-dns-hostnames
aws ec2 modify-vpc-attribute --vpc-id "${VPC_ID}" --enable-dns-support
echo "  ✓ VPC: ${VPC_ID}"

# ── Internet Gateway ──────────────────────────────────────────
IGW_ID=$(aws ec2 create-internet-gateway \
  --region "${REGION}" --query 'InternetGateway.InternetGatewayId' --output text)
aws ec2 attach-internet-gateway --internet-gateway-id "${IGW_ID}" --vpc-id "${VPC_ID}"
aws ec2 create-tags --resources "${IGW_ID}" \
  --tags Key=Name,Value="${APP}-${ENV}-igw"
echo "  ✓ Internet Gateway: ${IGW_ID}"

# ── Public Subnets (for ALB) ──────────────────────────────────
echo ""
echo "→ Creating public subnets..."
PUB_SUBNET_A=$(aws ec2 create-subnet \
  --vpc-id "${VPC_ID}" --cidr-block "10.0.1.0/24" \
  --availability-zone "${REGION}a" \
  --query 'Subnet.SubnetId' --output text)
aws ec2 create-tags --resources "${PUB_SUBNET_A}" \
  --tags Key=Name,Value="${APP}-${ENV}-public-a"
aws ec2 modify-subnet-attribute --subnet-id "${PUB_SUBNET_A}" \
  --map-public-ip-on-launch

PUB_SUBNET_B=$(aws ec2 create-subnet \
  --vpc-id "${VPC_ID}" --cidr-block "10.0.2.0/24" \
  --availability-zone "${REGION}b" \
  --query 'Subnet.SubnetId' --output text)
aws ec2 create-tags --resources "${PUB_SUBNET_B}" \
  --tags Key=Name,Value="${APP}-${ENV}-public-b"
aws ec2 modify-subnet-attribute --subnet-id "${PUB_SUBNET_B}" \
  --map-public-ip-on-launch
echo "  ✓ Public subnets: ${PUB_SUBNET_A}, ${PUB_SUBNET_B}"

# ── Private Subnets (for ECS tasks, RDS, Redis) ───────────────
echo ""
echo "→ Creating private subnets..."
PRIV_SUBNET_A=$(aws ec2 create-subnet \
  --vpc-id "${VPC_ID}" --cidr-block "10.0.10.0/24" \
  --availability-zone "${REGION}a" \
  --query 'Subnet.SubnetId' --output text)
aws ec2 create-tags --resources "${PRIV_SUBNET_A}" \
  --tags Key=Name,Value="${APP}-${ENV}-private-a"

PRIV_SUBNET_B=$(aws ec2 create-subnet \
  --vpc-id "${VPC_ID}" --cidr-block "10.0.11.0/24" \
  --availability-zone "${REGION}b" \
  --query 'Subnet.SubnetId' --output text)
aws ec2 create-tags --resources "${PRIV_SUBNET_B}" \
  --tags Key=Name,Value="${APP}-${ENV}-private-b"
echo "  ✓ Private subnets: ${PRIV_SUBNET_A}, ${PRIV_SUBNET_B}"

# ── Route table for public subnets ────────────────────────────
RTB_ID=$(aws ec2 create-route-table \
  --vpc-id "${VPC_ID}" --query 'RouteTable.RouteTableId' --output text)
aws ec2 create-route --route-table-id "${RTB_ID}" \
  --destination-cidr-block "0.0.0.0/0" --gateway-id "${IGW_ID}"
aws ec2 associate-route-table --route-table-id "${RTB_ID}" --subnet-id "${PUB_SUBNET_A}"
aws ec2 associate-route-table --route-table-id "${RTB_ID}" --subnet-id "${PUB_SUBNET_B}"

# ── Security Groups ───────────────────────────────────────────
echo ""
echo "→ Creating security groups..."

# ALB — open to internet on 80/443
ALB_SG=$(aws ec2 create-security-group \
  --group-name "${APP}-${ENV}-alb-sg" \
  --description "Elorge ALB — public HTTPS" \
  --vpc-id "${VPC_ID}" --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id "${ALB_SG}" \
  --ip-permissions \
  'IpProtocol=tcp,FromPort=80,ToPort=80,IpRanges=[{CidrIp=0.0.0.0/0}]' \
  'IpProtocol=tcp,FromPort=443,ToPort=443,IpRanges=[{CidrIp=0.0.0.0/0}]'
aws ec2 create-tags --resources "${ALB_SG}" \
  --tags Key=Name,Value="${APP}-${ENV}-alb-sg"
echo "  ✓ ALB Security Group: ${ALB_SG}"

# ECS — only from ALB
ECS_SG=$(aws ec2 create-security-group \
  --group-name "${APP}-${ENV}-ecs-sg" \
  --description "Elorge ECS tasks — from ALB only" \
  --vpc-id "${VPC_ID}" --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id "${ECS_SG}" \
  --protocol tcp --port 3001 --source-group "${ALB_SG}"
aws ec2 authorize-security-group-ingress --group-id "${ECS_SG}" \
  --protocol tcp --port 3000 --source-group "${ALB_SG}"
aws ec2 create-tags --resources "${ECS_SG}" \
  --tags Key=Name,Value="${APP}-${ENV}-ecs-sg"
echo "  ✓ ECS Security Group: ${ECS_SG}"

# RDS — only from ECS
RDS_SG=$(aws ec2 create-security-group \
  --group-name "${APP}-${ENV}-rds-sg" \
  --description "Elorge RDS PostgreSQL — from ECS only" \
  --vpc-id "${VPC_ID}" --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id "${RDS_SG}" \
  --protocol tcp --port 5432 --source-group "${ECS_SG}"
aws ec2 create-tags --resources "${RDS_SG}" \
  --tags Key=Name,Value="${APP}-${ENV}-rds-sg"
echo "  ✓ RDS Security Group: ${RDS_SG}"

# Redis — only from ECS
REDIS_SG=$(aws ec2 create-security-group \
  --group-name "${APP}-${ENV}-redis-sg" \
  --description "Elorge ElastiCache Redis — from ECS only" \
  --vpc-id "${VPC_ID}" --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id "${REDIS_SG}" \
  --protocol tcp --port 6379 --source-group "${ECS_SG}"
aws ec2 create-tags --resources "${REDIS_SG}" \
  --tags Key=Name,Value="${APP}-${ENV}-redis-sg"
echo "  ✓ Redis Security Group: ${REDIS_SG}"

# ── Save all IDs to env file ──────────────────────────────────
cat > "${NETWORK_FILE}" << EOF
# Auto-generated by create-network.sh — DO NOT EDIT MANUALLY
VPC_ID=${VPC_ID}
IGW_ID=${IGW_ID}
PUB_SUBNET_A=${PUB_SUBNET_A}
PUB_SUBNET_B=${PUB_SUBNET_B}
PRIV_SUBNET_A=${PRIV_SUBNET_A}
PRIV_SUBNET_B=${PRIV_SUBNET_B}
ALB_SG=${ALB_SG}
ECS_SG=${ECS_SG}
RDS_SG=${RDS_SG}
REDIS_SG=${REDIS_SG}
EOF

echo ""
echo "✅ Network created. IDs saved to: ${NETWORK_FILE}"
echo ""
cat "${NETWORK_FILE}"

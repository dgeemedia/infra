#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════
#  Elorge — Create Application Load Balancer
#  Creates ALB, target groups, HTTP→HTTPS redirect,
#  and HTTPS listeners for api.elorge.com and dashboard.elorge.com
#
#  Prerequisites:
#  - SSL certificate must exist in ACM (run create-cert.sh first)
#  - network.env must be populated
# ════════════════════════════════════════════════════════════

set -euo pipefail

ENV=${1:-staging}
REGION="eu-west-1"
APP="elorge"

source ./infra/aws/network.env

echo "→ Creating Application Load Balancer for: ${ENV}"

# ── ALB ───────────────────────────────────────────────────────
ALB_ARN=$(aws elbv2 create-load-balancer \
  --name "${APP}-${ENV}-alb" \
  --subnets "${PUB_SUBNET_A}" "${PUB_SUBNET_B}" \
  --security-groups "${ALB_SG}" \
  --scheme internet-facing \
  --type application \
  --ip-address-type ipv4 \
  --region "${REGION}" \
  --query 'LoadBalancers[0].LoadBalancerArn' --output text)
echo "  ✓ ALB created: ${ALB_ARN}"

ALB_DNS=$(aws elbv2 describe-load-balancers \
  --load-balancer-arns "${ALB_ARN}" \
  --region "${REGION}" \
  --query 'LoadBalancers[0].DNSName' --output text)
echo "  ✓ ALB DNS: ${ALB_DNS}"

# ── Target Groups ─────────────────────────────────────────────
echo ""
echo "→ Creating target groups..."

# API target group
API_TG_ARN=$(aws elbv2 create-target-group \
  --name "${APP}-${ENV}-api-tg" \
  --protocol HTTP \
  --port 3001 \
  --vpc-id "${VPC_ID}" \
  --target-type ip \
  --health-check-protocol HTTP \
  --health-check-path "/health" \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 10 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3 \
  --region "${REGION}" \
  --query 'TargetGroups[0].TargetGroupArn' --output text)
echo "  ✓ API target group: ${API_TG_ARN}"

# Dashboard target group
DASH_TG_ARN=$(aws elbv2 create-target-group \
  --name "${APP}-${ENV}-dash-tg" \
  --protocol HTTP \
  --port 3000 \
  --vpc-id "${VPC_ID}" \
  --target-type ip \
  --health-check-protocol HTTP \
  --health-check-path "/" \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 10 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3 \
  --region "${REGION}" \
  --query 'TargetGroups[0].TargetGroupArn' --output text)
echo "  ✓ Dashboard target group: ${DASH_TG_ARN}"

# ── HTTP Listener (redirect to HTTPS) ─────────────────────────
echo ""
echo "→ Creating HTTP→HTTPS redirect listener..."
aws elbv2 create-listener \
  --load-balancer-arn "${ALB_ARN}" \
  --protocol HTTP \
  --port 80 \
  --default-actions 'Type=redirect,RedirectConfig={Protocol=HTTPS,Port=443,StatusCode=HTTP_301}' \
  --region "${REGION}" \
  --output json | jq -r '.Listeners[0].ListenerArn'
echo "  ✓ HTTP redirect listener created"

# ── HTTPS Listener ────────────────────────────────────────────
echo ""
echo "→ Creating HTTPS listener..."
# Get cert ARN (must exist in ACM)
CERT_ARN=$(aws acm list-certificates \
  --region "${REGION}" \
  --query 'CertificateSummaryList[?contains(DomainName, `elorge.com`)].CertificateArn' \
  --output text | head -1)

if [ -z "${CERT_ARN}" ]; then
  echo "  ⚠️  No SSL certificate found for elorge.com in ACM"
  echo "  Run: aws acm request-certificate --domain-name '*.elorge.com' --validation-method DNS"
  echo "  Then re-run this script after validation completes"
  exit 1
fi

echo "  Using certificate: ${CERT_ARN}"

HTTPS_LISTENER_ARN=$(aws elbv2 create-listener \
  --load-balancer-arn "${ALB_ARN}" \
  --protocol HTTPS \
  --port 443 \
  --ssl-policy "ELBSecurityPolicy-TLS13-1-2-2021-06" \
  --certificates "CertificateArn=${CERT_ARN}" \
  --default-actions "Type=forward,TargetGroupArn=${DASH_TG_ARN}" \
  --region "${REGION}" \
  --query 'Listeners[0].ListenerArn' --output text)
echo "  ✓ HTTPS listener: ${HTTPS_LISTENER_ARN}"

# ── Listener Rules — route api.elorge.com to API target group ─
echo ""
echo "→ Creating routing rules..."
aws elbv2 create-rule \
  --listener-arn "${HTTPS_LISTENER_ARN}" \
  --priority 10 \
  --conditions 'Field=host-header,Values=["api.elorge.com","sandbox.elorge.com"]' \
  --actions "Type=forward,TargetGroupArn=${API_TG_ARN}" \
  --region "${REGION}" \
  --output json | jq -r '.Rules[0].RuleArn'
echo "  ✓ API routing rule created"

# ── Save ALB details ──────────────────────────────────────────
cat >> ./infra/aws/network.env << EOF
ALB_ARN=${ALB_ARN}
ALB_DNS=${ALB_DNS}
API_TG_ARN=${API_TG_ARN}
DASH_TG_ARN=${DASH_TG_ARN}
HTTPS_LISTENER_ARN=${HTTPS_LISTENER_ARN}
CERT_ARN=${CERT_ARN}
EOF

echo ""
echo "✅ ALB created successfully"
echo ""
echo "⚠️  ACTION REQUIRED: Create DNS records in Route 53 or your DNS provider:"
echo ""
echo "  api.elorge.com        CNAME  ${ALB_DNS}"
echo "  dashboard.elorge.com  CNAME  ${ALB_DNS}"
echo "  sandbox.elorge.com    CNAME  ${ALB_DNS}"

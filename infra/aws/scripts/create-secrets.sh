#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════
#  Elorge — Push all platform secrets to AWS Secrets Manager
#  Run this BEFORE registering ECS task definitions.
#
#  Usage: ./infra/aws/scripts/create-secrets.sh [staging|production]
#  You will be prompted for each secret value.
# ════════════════════════════════════════════════════════════

set -euo pipefail

ENV=${1:-staging}
REGION="eu-west-1"
APP="elorge"

echo ""
echo "→ Creating secrets in AWS Secrets Manager for: ${ENV}"
echo "  Prefix: ${APP}/${ENV}/"
echo ""
echo "  You will be prompted for each value."
echo "  Press Enter to skip if already set (from RDS/Redis scripts)."
echo ""

# Helper: create or update a secret
put_secret() {
  local name="$1"
  local description="$2"
  local value="$3"

  if [ -z "${value}" ]; then
    echo "  ⏭  Skipped (empty): ${APP}/${ENV}/${name}"
    return
  fi

  aws secretsmanager put-secret-value \
    --secret-id "${APP}/${ENV}/${name}" \
    --secret-string "${value}" \
    --region "${REGION}" 2>/dev/null || \
  aws secretsmanager create-secret \
    --name "${APP}/${ENV}/${name}" \
    --description "${description}" \
    --secret-string "${value}" \
    --region "${REGION}" --output json | jq -r '.Name'

  echo "  ✓ ${APP}/${ENV}/${name}"
}

# ── Prompt for secrets ────────────────────────────────────────
read -rsp "JWT_SECRET (min 64 chars random string): " JWT_SECRET; echo
read -rsp "BANKLY_CLIENT_ID: "       BANKLY_CLIENT_ID; echo
read -rsp "BANKLY_CLIENT_SECRET: "   BANKLY_CLIENT_SECRET; echo
read -rsp "BANKLY_WALLET_ACCOUNT: "  BANKLY_WALLET_ACCOUNT; echo
read -rsp "FLUTTERWAVE_SECRET_KEY: " FLW_KEY; echo
read -rsp "OPEN_EXCHANGE_RATES_APP_ID: " OER_KEY; echo
read -rsp "COMPLY_ADVANTAGE_API_KEY: " CA_KEY; echo
read -rsp "WEBHOOK_SECRET (32 chars): " WEBHOOK_SECRET; echo
read -rsp "NEXTAUTH_SECRET (32 chars): " NEXTAUTH_SECRET; echo

echo ""
echo "→ Saving all secrets..."

put_secret "jwt-secret"              "Elorge JWT signing secret"         "${JWT_SECRET}"
put_secret "bankly-client-id"        "Bankly PSP client ID"              "${BANKLY_CLIENT_ID}"
put_secret "bankly-client-secret"    "Bankly PSP client secret"          "${BANKLY_CLIENT_SECRET}"
put_secret "bankly-wallet-account"   "Bankly funded wallet account"      "${BANKLY_WALLET_ACCOUNT}"
put_secret "flutterwave-secret-key"  "Flutterwave secret key"            "${FLW_KEY}"
put_secret "openexchangerates-key"   "Open Exchange Rates app ID"        "${OER_KEY}"
put_secret "comply-advantage-key"    "ComplyAdvantage API key"           "${CA_KEY}"
put_secret "webhook-secret"          "Elorge webhook HMAC signing secret" "${WEBHOOK_SECRET}"
put_secret "nextauth-secret"         "NextAuth.js session secret"         "${NEXTAUTH_SECRET}"

echo ""
echo "✅ All secrets saved to AWS Secrets Manager"
echo ""
echo "To verify: aws secretsmanager list-secrets --region ${REGION} | jq -r '.SecretList[].Name' | grep ${APP}"

# Elorge — Production Deployment Runbook

Complete guide for deploying Elorge Technologies Payout Platform to AWS.

---

## Prerequisites

Install these tools on your machine before starting:

```bash
# AWS CLI
brew install awscli          # macOS
# or: https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html

# Configure AWS credentials
aws configure
# AWS Access Key ID:     [your key]
# AWS Secret Access Key: [your secret]
# Default region:        eu-west-1
# Default output:        json

# Verify identity
aws sts get-caller-identity

# Other tools
brew install jq docker git
```

---

## GitHub Secrets Required

Add these in: GitHub → Your Repo → Settings → Secrets → Actions

| Secret | Value |
|--------|-------|
| `AWS_ACCESS_KEY_ID`     | IAM user access key (deployment user) |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key |
| `VERCEL_TOKEN`          | Vercel personal access token |

---

## Phase 1 — First-Time AWS Setup (Run Once)

```bash
# Clone the repo
git clone https://github.com/elorge/elorge-platform.git
cd elorge-platform

# Make all scripts executable
chmod +x ./infra/aws/scripts/*.sh

# Step 1: Bootstrap (ECR repos, ECS cluster, IAM roles, S3, CloudWatch)
./infra/aws/scripts/setup.sh production

# Step 2: Create VPC, subnets, security groups
./infra/aws/scripts/create-network.sh production

# Step 3: Create PostgreSQL RDS (~10 min)
./infra/aws/scripts/create-rds.sh production

# Step 4: Create Redis ElastiCache (~5 min)
./infra/aws/scripts/create-elasticache.sh production

# Step 5: Request SSL certificate (free via ACM)
aws acm request-certificate \
  --domain-name "*.elorge.com" \
  --validation-method DNS \
  --region eu-west-1
# → Copy the DNS validation records to your DNS provider
# → Wait for status to become ISSUED (~5-30 min)

# Step 6: Create ALB (requires cert to be ISSUED first)
./infra/aws/scripts/create-alb.sh production

# Step 7: Save all secrets to Secrets Manager
./infra/aws/scripts/create-secrets.sh production
# You'll be prompted for: JWT_SECRET, Bankly keys, FX key, etc.
```

---

## Phase 2 — DNS Configuration

After ALB is created, the script prints the ALB DNS name.
Add these records in your DNS provider (Route 53, Cloudflare, etc.):

```
api.elorge.com          CNAME   elorge-production-alb-xxxxx.eu-west-1.elb.amazonaws.com
dashboard.elorge.com    CNAME   elorge-production-alb-xxxxx.eu-west-1.elb.amazonaws.com
sandbox.elorge.com      CNAME   elorge-production-alb-xxxxx.eu-west-1.elb.amazonaws.com
```

Wait for DNS propagation (5–30 min), then verify:

```bash
curl -I https://api.elorge.com/health
# Expected: HTTP/2 200
```

---

## Phase 3 — First Deployment

```bash
# Step 1: Build and push Docker images to ECR
./infra/aws/scripts/push-images.sh production

# Step 2: Run database migrations
./infra/aws/scripts/run-migrations.sh production

# Step 3: Create ECS services (starts the containers)
./infra/aws/scripts/create-ecs-services.sh production
```

After this, verify everything is running:

```bash
# Check ECS services
aws ecs describe-services \
  --cluster elorge-production \
  --services elorge-api-service elorge-dashboard-service \
  --region eu-west-1 \
  --query 'services[].{Name:serviceName,Status:status,Running:runningCount,Desired:desiredCount}'

# Test health endpoint
curl https://api.elorge.com/health

# Test rate endpoint (should return GBP/NGN rate)
curl -H "Authorization: Bearer el_live_YOUR_KEY" \
  "https://api.elorge.com/v1/rates?from=GBP&amount=100"
```

---

## Phase 4 — Subsequent Deployments (Automated)

After Phase 1–3, all future deployments happen **automatically** on merge to `main`:

```
Developer merges PR to main
        ↓
GitHub Actions: Run tests (CI)
        ↓
GitHub Actions: Build Docker image → push to ECR
        ↓
GitHub Actions: Run DB migrations (one-off ECS task)
        ↓
GitHub Actions: Deploy new image to ECS (rolling update)
        ↓
GitHub Actions: Health check passes
        ↓
Live — zero downtime
```

To trigger a manual deploy:

```bash
# Force push to main (emergency)
git commit --allow-empty -m "Force deploy" && git push origin main

# Or re-run the workflow in GitHub UI:
# Actions → Deploy API → Run workflow
```

---

## Go-Live Checklist with FinestPay

Before giving FinestPay their production API key, verify each item:

- [ ] `GET https://api.elorge.com/health` returns HTTP 200
- [ ] `GET https://api.elorge.com/v1/rates?from=GBP&amount=100` returns a valid rate
- [ ] Bankly sandbox test transfer succeeds end-to-end
- [ ] Webhook delivery works (test with RequestBin or webhook.site)
- [ ] SSL certificate is valid (no browser warnings)
- [ ] DNS records are live for api.elorge.com and dashboard.elorge.com
- [ ] Partner created in dashboard for FinestPay UK
- [ ] Live API key generated and shared securely (not via email)
- [ ] Webhook URL registered (FinestPay provides their endpoint)
- [ ] Compliance screening tested — sanctions hit correctly flags payout
- [ ] RDS automated backups confirmed active
- [ ] CloudWatch alarms set (see Monitoring section below)

---

## Monitoring & Alerts

### CloudWatch Alarms to Create

```bash
# API error rate > 5%
aws cloudwatch put-metric-alarm \
  --alarm-name "elorge-api-error-rate" \
  --metric-name "5XXError" \
  --namespace "AWS/ApplicationELB" \
  --statistic Average \
  --period 60 \
  --threshold 0.05 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 3 \
  --alarm-actions "arn:aws:sns:eu-west-1:ACCOUNT_ID:elorge-alerts"

# ECS CPU > 80%
aws cloudwatch put-metric-alarm \
  --alarm-name "elorge-api-cpu-high" \
  --metric-name "CPUUtilization" \
  --namespace "AWS/ECS" \
  --dimensions Name=ClusterName,Value=elorge-production Name=ServiceName,Value=elorge-api-service \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions "arn:aws:sns:eu-west-1:ACCOUNT_ID:elorge-alerts"

# RDS storage < 20GB
aws cloudwatch put-metric-alarm \
  --alarm-name "elorge-rds-storage-low" \
  --metric-name "FreeStorageSpace" \
  --namespace "AWS/RDS" \
  --dimensions Name=DBInstanceIdentifier,Value=elorge-postgres-production \
  --statistic Average \
  --period 300 \
  --threshold 21474836480 \
  --comparison-operator LessThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions "arn:aws:sns:eu-west-1:ACCOUNT_ID:elorge-alerts"
```

### Key CloudWatch Log Groups

```bash
# API logs (all requests, errors, queue jobs)
aws logs tail /ecs/elorge-api --follow

# Dashboard logs
aws logs tail /ecs/elorge-dashboard --follow

# Filter for errors only
aws logs filter-log-events \
  --log-group-name /ecs/elorge-api \
  --filter-pattern "ERROR"
```

---

## Rollback Procedure

If a deployment causes issues:

```bash
# 1. Get previous task definition revision
aws ecs list-task-definitions \
  --family-prefix elorge-api \
  --sort DESC \
  --region eu-west-1

# 2. Roll back service to previous task definition
aws ecs update-service \
  --cluster elorge-production \
  --service elorge-api-service \
  --task-definition elorge-api:PREVIOUS_REVISION \
  --region eu-west-1

# 3. Wait for rollback to complete
aws ecs wait services-stable \
  --cluster elorge-production \
  --services elorge-api-service \
  --region eu-west-1

echo "✅ Rollback complete"
```

---

## Monthly Cost Estimate (Production)

| Service | Spec | Monthly Cost |
|---------|------|-------------|
| ECS Fargate (API) | 0.5 vCPU, 1GB × 2 tasks | ~$18 |
| ECS Fargate (Dashboard) | 0.25 vCPU, 0.5GB × 1 task | ~$5 |
| RDS PostgreSQL | db.t3.medium, 100GB, Multi-AZ | ~$85 |
| ElastiCache Redis | cache.t3.micro | ~$15 |
| Application Load Balancer | 1 ALB | ~$18 |
| ECR | 2 repos, ~2GB storage | ~$1 |
| CloudWatch | Logs + metrics + alarms | ~$5 |
| Data Transfer | ~50GB/month | ~$5 |
| **Total** | | **~$152/month** |

*As your payout volume grows, the only cost that scales significantly is data transfer. All other costs are fixed.*

---

## Emergency Contacts

| Issue | Contact |
|-------|---------|
| AWS account issues | george@elorge.com |
| Bankly API down | Bankly developer support |
| FinestPay integration | tech@finestpay.co.uk |
| Domain/DNS | Your domain registrar |

---

*Elorge Technologies Limited — Confidential*
*© 2026 Elorge Technologies Limited*

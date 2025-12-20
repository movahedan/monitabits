# Monitabits Infrastructure

AWS infrastructure for the Monitabits application, managed with Pulumi and TypeScript.

> **🚀 New to AWS/Pulumi?** Start here: [Complete Beginner's Setup Guide](./SETUP_GUIDE.md)

## ⚡ Quick Start

```bash
# 1. Install dependencies
cd apps/monitabits-infra
bun install

# 2. Login to Pulumi
pulumi login

# 3. Select/create stack
pulumi stack init dev

# 4. Configure AWS region
pulumi config set aws:region us-east-1

# 5. Set your IP for SSH access (get IP: curl https://checkip.amazonaws.com)
# Edit Pulumi.dev.yaml: compute:allowedSshCidrs: ["YOUR_IP/32"]

# 6. Set RDS password
pulumi config set --secret rds:password "$(openssl rand -base64 32)"

# 7. Preview changes
pulumi preview

# 8. Deploy
pulumi up
```

**Need detailed instructions?** See [SETUP_GUIDE.md](./SETUP_GUIDE.md)

## Overview

This infrastructure project provisions AWS resources for the Monitabits application:

- **Networking**: VPC with public and private subnets across multiple availability zones
- **Compute**: EC2 instance with IAM role for S3, ECR, and Secrets Manager access
- **Database**: RDS PostgreSQL in private subnets with encrypted storage
- **Storage**: S3 bucket for application assets with versioning and encryption
- **Secrets**: AWS Secrets Manager for RDS credentials
- **CI/CD**: ECR repository and IAM role for secure deployments

## Architecture

```
                          VPC (10.x.0.0/16)
    ┌─────────────────────────────────────────────────────────┐
    │                                                          │
    │  ┌──────────────────┐        ┌──────────────────┐       │
    │  │  Public Subnet   │        │  Public Subnet   │       │
    │  │     (AZ-1a)      │        │     (AZ-1b)      │       │
    │  │                  │        │                  │       │
    │  │  ┌────────────┐  │        │                  │       │
    │  │  │    EC2     │  │        │                  │       │
    │  │  │  Instance  │  │        │                  │       │
    │  │  └────────────┘  │        │                  │       │
    │  │                  │        │                  │       │
    │  │  ┌────────────┐  │        │                  │       │
    │  │  │    NAT     │  │        │                  │       │
    │  │  │  Gateway   │  │        │                  │       │
    │  │  └────────────┘  │        │                  │       │
    │  └────────┬─────────┘        └────────┬─────────┘       │
    │           │                           │                  │
    │           └───────────┬───────────────┘                  │
    │                       │                                  │
    │           ┌───────────▼───────────┐                      │
    │           │   Internet Gateway    │                      │
    │           └───────────────────────┘                      │
    │                                                          │
    │  ┌──────────────────┐        ┌──────────────────┐       │
    │  │  Private Subnet  │        │  Private Subnet  │       │
    │  │     (AZ-1a)      │        │     (AZ-1b)      │       │
    │  │                  │        │                  │       │
    │  │  ┌────────────┐  │        │                  │       │
    │  │  │    RDS     │  │        │                  │       │
    │  │  │ PostgreSQL │  │        │                  │       │
    │  │  └────────────┘  │        │                  │       │
    │  └──────────────────┘        └──────────────────┘       │
    │                                                          │
    └─────────────────────────────────────────────────────────┘

              ┌──────────────┐    ┌──────────────┐
              │  S3 Bucket   │    │    ECR       │
              │   (Assets)   │    │ Repository   │
              └──────────────┘    └──────────────┘

              ┌──────────────┐
              │   Secrets    │
              │   Manager    │
              └──────────────┘
```

## Security Features

This infrastructure implements security best practices:

1. **No Hardcoded Secrets**: All secrets must be explicitly configured via Pulumi secrets
2. **AWS Secrets Manager**: RDS credentials stored in AWS Secrets Manager
3. **Role-Based CI/CD**: Uses IAM roles with OIDC federation instead of access keys
4. **Input Validation**: All configuration values are validated before deployment
5. **No Sensitive Outputs**: Access keys and passwords are never exported as outputs
6. **Encryption**: EBS volumes and RDS storage are encrypted at rest
7. **IMDSv2 Required**: EC2 instances require IMDSv2 for enhanced security
8. **SSH Restrictions**: SSH access is blocked from 0.0.0.0/0 by validation

## Prerequisites & Setup

**Requirements:** AWS Account, AWS CLI configured, Pulumi CLI installed, Node.js/Bun

> **👋 New to AWS/Pulumi?** See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed setup instructions.

**Quick setup:**
1. **Install dependencies:**
   ```bash
   cd apps/monitabits-infra
   bun install
   ```

2. **Login to Pulumi**:
   ```bash
   pulumi login
   ```

3. **Select or create a stack**:
   ```bash
   # Select existing stack
   pulumi stack select dev

   # Or create new stack
   pulumi stack init dev
   ```

3. **Configure** (see Configuration & Secrets sections below)

## Configuration

### Stack Configuration Files

Each environment has its own configuration file:
- `Pulumi.dev.yaml` - Development environment
- `Pulumi.stg.yaml` - Staging environment
- `Pulumi.prod.yaml` - Production environment
- `Pulumi.example.yaml` - Documented example template

### Required Configuration

Before deploying, update these values in your stack config:

```yaml
# SSH access - replace with your actual IP
compute:allowedSshCidrs:
  - "YOUR_IP_ADDRESS/32"  # Get via: curl https://checkip.amazonaws.com
```

### Configuration Options

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `project:name` | string | `monitabits` | Project name for resource naming |
| `project:environment` | string | *required* | Environment (dev/stg/prod) |
| `vpc:cidr` | string | *required* | VPC CIDR block (e.g., 10.0.0.0/16) |
| `vpc:publicSubnetCidrs` | string[] | *required* | Public subnet CIDRs |
| `vpc:privateSubnetCidrs` | string[] | *required* | Private subnet CIDRs |
| `vpc:availabilityZones` | string[] | `[]` | Specific AZs (auto-detect if empty) |
| `compute:instanceType` | string | `t3.medium` | EC2 instance type |
| `compute:diskSize` | number | `20` | EBS volume size (GB) |
| `compute:allowedSshCidrs` | string[] | *required* | CIDR blocks for SSH access |
| `rds:instanceClass` | string | `db.t3.micro` | RDS instance class |
| `rds:allocatedStorage` | number | `20` | RDS storage (GB) |
| `rds:backupRetentionDays` | number | `7` | Backup retention (days) |
| `rds:multiAz` | boolean | env-based | Enable Multi-AZ |
| `s3:bucketSuffix` | string | *required* | S3 bucket name suffix |

## Secrets Management

### Required Secrets

Secrets MUST be set via the Pulumi CLI (never in config files):

```bash
# RDS password (required)
pulumi config set --secret rds:password "$(openssl rand -base64 32)"
```

### AWS Secrets Manager

RDS credentials are automatically stored in AWS Secrets Manager:
- Secret Name: `monitabits-{env}-rds-credentials`
- Contains: username, password, engine, port, dbname

**Retrieving secrets from your application:**

```bash
# Via AWS CLI
aws secretsmanager get-secret-value \
  --secret-id monitabits-dev-rds-credentials \
  --query SecretString --output text | jq

# Via Pulumi output
pulumi stack output rdsSecretArn
```

**From application code (Node.js):**

```typescript
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({ region: "us-east-1" });
const response = await client.send(
  new GetSecretValueCommand({ SecretId: "monitabits-dev-rds-credentials" })
);
const credentials = JSON.parse(response.SecretString);
```

## Deployment

### Preview Changes

```bash
# From monorepo root
bun run infra:preview:dev

# Or directly
cd apps/monitabits-infra
pulumi preview -s dev
```

### Deploy

```bash
# Development
bun run infra:up:dev

# Staging
bun run infra:up:stg

# Production
bun run infra:up:prod
```

### Destroy

```bash
# Development only (production has deletion protection)
bun run infra:destroy:dev
```

## CI/CD Integration

### IAM Role for GitHub Actions

The infrastructure creates an IAM role for CI/CD that supports OIDC federation:

```bash
# Get role ARN
pulumi stack output ciCdRoleArn
```

### GitHub Actions Setup

1. **Create OIDC Provider** in AWS IAM (one-time setup):
   ```bash
   aws iam create-open-id-connect-provider \
     --url https://token.actions.githubusercontent.com \
     --client-id-list sts.amazonaws.com \
     --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
   ```

2. **Update Role Trust Policy** to restrict to your repository:
   ```json
   {
     "StringLike": {
       "token.actions.githubusercontent.com:sub": "repo:YOUR_ORG/YOUR_REPO:*"
     }
   }
   ```

3. **Configure GitHub Actions workflow**:
   ```yaml
   - name: Configure AWS Credentials
     uses: aws-actions/configure-aws-credentials@v4
     with:
       role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
       aws-region: us-east-1
   ```

### Deploy Script

The `src/deploy.ts` script handles the full deployment pipeline:

```bash
# Run from apps/monitabits-infra directory
bun run src/deploy.ts
```

**Environment Variables:**
- `IMAGE_TAG` - Docker image tag (defaults to `GITHUB_SHA` or `latest`)
- `AWS_REGION` - AWS region (defaults to `us-east-1`)
- `PULUMI_STACK` - Pulumi stack name (defaults to `dev`)
- `PULUMI_ACCESS_TOKEN` - Pulumi access token for stack outputs

**What it does:**
1. Gets Pulumi stack outputs (ECR repo, EC2 instance ID, RDS secret name)
2. Detects affected services from `docker-compose.yml` using `EntityCompose`
3. Builds and pushes Docker images for affected services to ECR
4. Retrieves RDS credentials from AWS Secrets Manager
5. Copies `docker-compose.yml` to EC2 via SSM
6. Runs `docker-compose pull && up -d` on EC2

### GitHub Actions Workflow

The `Main.yml` workflow runs on successful `Check` workflow completion:

```yaml
jobs:
  build-and-deploy:
    steps:
      - Checkout
      - Configure AWS Credentials (OIDC)
      - Setup Pulumi CLI
      - Setup Docker Buildx
      - Login to ECR
      - Setup Bun
      - Install dependencies
      - Quick check (lint + test)
      - Build, Push & Deploy (runs src/deploy.ts)
```

## Outputs

View all stack outputs:
```bash
pulumi stack output
```

### Available Outputs

| Output | Description |
|--------|-------------|
| `vpcId` | VPC ID |
| `publicSubnetIds` | Public subnet IDs |
| `privateSubnetIds` | Private subnet IDs |
| `ec2InstanceId` | EC2 instance ID |
| `ec2InstancePublicIp` | EC2 public IP address |
| `ec2InstancePrivateIp` | EC2 private IP address |
| `ec2IamRoleArn` | EC2 IAM role ARN |
| `rdsEndpoint` | RDS endpoint (host:port) |
| `rdsPort` | RDS port (5432) |
| `rdsAddress` | RDS hostname |
| `s3BucketName` | S3 bucket name |
| `s3BucketArn` | S3 bucket ARN |
| `ecrRepositoryUri` | ECR repository URI |
| `ecrRepositoryName` | ECR repository name |
| `ciCdRoleArn` | CI/CD IAM role ARN |
| `rdsSecretArn` | Secrets Manager secret ARN |
| `rdsSecretName` | Secrets Manager secret name |

## Troubleshooting

### Common Issues

**"rds:password is required"**
```bash
# Set the RDS password as a secret
pulumi config set --secret rds:password "your-secure-password"
```

**"compute:allowedSshCidrs must contain at least one CIDR block"**
```bash
# Update your stack config file with your IP
# Get your IP: curl https://checkip.amazonaws.com
```

**"Security: compute:allowedSshCidrs must not include 0.0.0.0/0"**
```
SSH access from anywhere is blocked for security. Use specific CIDR blocks.
```

**Type checking fails**
```bash
# Ensure dependencies are installed
bun install

# Check types
bun run check:types
```

### Validation Errors

The infrastructure validates all inputs before deployment:
- VPC CIDR must be valid notation and between /16 and /28
- SSH CIDRs cannot include 0.0.0.0/0
- RDS backup retention must meet environment minimums
- All secrets must be explicitly set (no fallback values)

### Getting Help

1. Check Pulumi logs: `pulumi logs`
2. View stack state: `pulumi stack`
3. Refresh state: `pulumi refresh`

## References

- [Pulumi AWS Documentation](https://www.pulumi.com/docs/clouds/aws/)
- [Pulumi Secrets Management](https://www.pulumi.com/docs/iac/concepts/secrets/)
- [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/)
- [GitHub Actions OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)

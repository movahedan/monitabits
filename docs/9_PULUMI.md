# 🧠 Understanding the Monitabits Infrastructure Project

> A comprehensive guide to understanding how this Pulumi infrastructure project works, from architecture to implementation details.

## 📋 Table of Contents

- [What Is This Project?](#what-is-this-project)
- [Architecture Overview](#architecture-overview)
- [How It Works](#how-it-works)
- [Key Concepts](#key-concepts)
- [Reading the Code](#reading-the-code)
- [Common Patterns](#common-patterns)
- [Security Model](#security-model)
- [Next Steps](#next-steps)

## 🎯 What Is This Project?

This project uses **Pulumi** (Infrastructure as Code) to automatically create and manage AWS cloud resources for the Monitabits application. Instead of manually clicking through the AWS Console, we write TypeScript code that describes what we want, and Pulumi makes it happen.

**Think of it like this:**
- Traditional way: Manually create VPC, EC2, RDS in AWS Console → error-prone, not repeatable
- This way: Write code describing infrastructure → Pulumi creates it → repeatable, version-controlled

## 🏗️ Architecture Overview

The infrastructure creates a complete AWS environment:

```
┌─────────────────────────────────────────────────┐
│                    AWS Account                   │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │         VPC (10.x.0.0/16)                │  │
│  │                                           │  │
│  │  ┌──────────────┐    ┌──────────────┐   │  │
│  │  │ Public Subnet│    │ Public Subnet│   │  │
│  │  │              │    │              │   │  │
│  │  │   ┌──────┐   │    │              │   │  │
│  │  │   │ EC2  │   │    │              │   │  │
│  │  │   │ App  │   │    │              │   │  │
│  │  │   └──────┘   │    │              │   │  │
│  │  │              │    │              │   │  │
│  │  │   ┌──────┐   │    │              │   │  │
│  │  │   │ NAT  │   │    │              │   │  │
│  │  │   │ GW   │   │    │              │   │  │
│  │  │   └──────┘   │    │              │   │  │
│  │  └──────┬───────┘    └──────┬───────┘   │  │
│  │         │                    │           │  │
│  │         └────────┬───────────┘           │  │
│  │                  │                       │  │
│  │         ┌────────▼────────┐              │  │
│  │         │ Internet Gateway│              │  │
│  │         └─────────────────┘              │  │
│  │                                           │  │
│  │  ┌──────────────┐    ┌──────────────┐   │  │
│  │  │Private Subnet│    │Private Subnet│   │  │
│  │  │              │    │              │   │  │
│  │  │   ┌──────┐   │    │              │   │  │
│  │  │   │ RDS  │   │    │              │   │  │
│  │  │   │Postgres│  │    │              │   │  │
│  │  │   └──────┘   │    │              │   │  │
│  │  └──────────────┘    └──────────────┘   │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────┐  ┌──────────────┐            │
│  │  S3 Bucket   │  │  ECR Repo   │            │
│  │  (Assets)    │  │  (Images)   │            │
│  └──────────────┘  └──────────────┘            │
│                                                 │
│  ┌──────────────┐                              │
│  │   Secrets    │                              │
│  │   Manager    │                              │
│  └──────────────┘                              │
└─────────────────────────────────────────────────┘
```

## 🔄 How It Works

### 1. **Configuration Loading** (`src/config.ts`)

When you run `pulumi up`, the first thing that happens is configuration loading:

```typescript
const config = loadConfig();
```

This function:
- Reads values from `Pulumi.{env}.yaml` files
- Loads secrets (encrypted) from Pulumi's secret store
- Validates all inputs (CIDR blocks, IP addresses, etc.)
- Returns a typed `InfrastructureConfig` object

**Key insight:** Configuration is separated from code. Same code, different configs for dev/stg/prod.

### 2. **Resource Creation** (various `src/*.ts` files)

Resources are created in dependency order:

```typescript
// 1. Network (nothing depends on this)
const network = createNetwork(config);

// 2. Security (needs network)
const security = createSecurity(config, network);

// 3. Secrets (independent)
const secrets = createSecrets(config);

// 4. Storage (independent)
const storage = createStorage(config);

// 5. CI/CD (independent)
const ciCd = createCiCd(config);

// 6. Compute (needs network, security, secrets, storage, CI/CD)
const compute = createCompute({
	config,
	network,
	security,
	secrets,
	s3BucketName: storage.s3Bucket.bucket,
	ecrRepositoryUri: ciCd.ecrRepository.repositoryUrl,
});

// 7. Data (needs network, security, secrets)
const data = createData(config, network, security, secrets);
```

**Key insight:** Each module is self-contained. `createNetwork()` only knows about networking, not EC2 or RDS.

### 3. **Pulumi Execution**

When you run `pulumi up`:
1. Pulumi reads your TypeScript code
2. It creates a "desired state" - what you want
3. It compares to "current state" - what exists in AWS
4. It calculates a "diff" - what needs to change
5. It shows you a preview
6. You approve, and it makes the changes

**Key insight:** Pulumi is declarative. You say "I want a VPC", not "create VPC, then create subnet, then...".

## 🧩 Key Concepts

### Pulumi Outputs

Pulumi resources return `Output<T>` types, not direct values:

```typescript
const vpc = new aws.ec2.Vpc(...);
// vpc.id is Output<string>, not string

// To use it:
vpc.id.apply(id => console.log(`VPC ID: ${id}`));

// Or in another resource:
const subnet = new aws.ec2.Subnet({
  vpcId: vpc.id, // Pulumi handles the async resolution
});
```

**Why?** Because AWS resources are created asynchronously. Pulumi tracks dependencies automatically.

### Stacks

A "stack" is an isolated instance of your infrastructure:

- `dev` stack → dev environment (smaller, cheaper)
- `stg` stack → staging environment (production-like)
- `prod` stack → production environment (high availability)

Each stack has:
- Its own state file (what resources exist)
- Its own configuration (`Pulumi.{env}.yaml`)
- Its own secrets

**Key insight:** Same code, multiple environments, isolated from each other.

### Secrets Management

Secrets are handled in three layers:

1. **Pulumi Config Secrets** - Encrypted in Pulumi's backend
   ```bash
   pulumi config set --secret rds:password "mypassword"
   ```

2. **AWS Secrets Manager** - Encrypted at rest in AWS
   ```typescript
   const secret = new aws.secretsmanager.Secret(...);
   // Stores RDS credentials
   ```

3. **Stack Outputs** - Never exported (security)
   ```typescript
   // ❌ BAD: export const password = ...
   // ✅ GOOD: export const secretArn = ... (just the ARN)
   ```

**Key insight:** Secrets flow: Pulumi → Secrets Manager → Application (via IAM)

## 🎨 Common Patterns

### Pattern 1: Resource Naming

```typescript
const vpc = new aws.ec2.Vpc(
  resourceName(project, "vpc"), // Name: "monitabits-dev-vpc"
  { /* config */ }
);
```

**Why?** Consistent naming makes resources easy to find in AWS Console.

### Pattern 2: Tags

```typescript
tags: {
  Name: resourceName(project, "vpc"),
  Project: project.name,
  Environment: project.environment,
}
```

**Why?** Tags enable cost tracking, filtering, and automation.

### Pattern 3: Dependencies

```typescript
const natGateway = new aws.ec2.NatGateway(
  resourceName(project, "nat-gw"),
  { subnetId: publicSubnets[0].id },
  { dependsOn: [internetGateway] } // Explicit dependency
);
```

**Why?** Pulumi needs to know creation order. Usually inferred, sometimes explicit.

### Pattern 4: Outputs

```typescript
// In index.ts
export const vpcId: pulumi.Output<string> = network.vpc.id;
```

**Why?** Other stacks or applications can reference these values.

## 🔒 Security Model

### Defense in Depth

1. **Network Security**
   - Private subnets for databases
   - Security groups restrict traffic
   - NACLs as additional layer

2. **Access Control**
   - IAM roles (not users) for services
   - Least privilege policies
   - No access keys in code

3. **Secrets Management**
   - Encrypted at rest (Secrets Manager)
   - Encrypted in transit (TLS)
   - Never in code or outputs

4. **Input Validation**
   - CIDR blocks validated
   - SSH access restricted
   - No `0.0.0.0/0` allowed

**Key insight:** Security is built in, not bolted on.

## 🚀 Next Steps

### To Understand Better

1. **Read in this order:**
   - `src/index.ts` - See the big picture
   - `src/config.ts` - Understand configuration
   - `src/network.ts` - See a simple module
   - `src/compute.ts` - See a complex module with dependencies
   - `src/deploy.ts` - See the CI/CD deployment script

2. **Try these commands:**
   ```bash
   # See what would change
   pulumi preview -s dev
   
   # See current outputs
   pulumi stack output -s dev
   
   # See configuration
   pulumi config -s dev
   ```

3. **Experiment:**
   - Change instance type in `Pulumi.dev.yaml`
   - Run `pulumi preview` to see the diff
   - Understand what Pulumi will change

### To Make Changes

1. **Small change:** Modify existing resource properties
2. **New resource:** Create new module, add to `index.ts`
3. **New config:** Add to `config.ts`, update YAML files

## 🔄 CI/CD Deployment

### Deploy Script (`src/deploy.ts`)

The deploy script automates the full deployment pipeline:

```bash
# Run from apps/monitabits-infra
bun run src/deploy.ts
```

**Flow:**
1. Get Pulumi stack outputs (ECR repo, EC2 ID, RDS secret)
2. Detect affected services from `docker-compose.yml` via `EntityCompose`
3. Build and push Docker images for affected services
4. Retrieve RDS credentials from Secrets Manager
5. Copy `docker-compose.yml` to EC2 via SSM
6. Run `docker-compose up -d` on EC2

**Environment Variables:**
| Variable | Default | Description |
|----------|---------|-------------|
| `IMAGE_TAG` | `GITHUB_SHA` or `latest` | Docker image tag |
| `AWS_REGION` | `us-east-1` | AWS region |
| `PULUMI_STACK` | `dev` | Pulumi stack name |
| `PULUMI_ACCESS_TOKEN` | - | Required for Pulumi CLI |

### GitHub Actions Workflow

The `Main.yml` workflow triggers on successful `Check` workflow:

```yaml
jobs:
  build-and-deploy:
    steps:
      - Checkout repository
      - Configure AWS Credentials (OIDC)
      - Setup Pulumi CLI
      - Setup Docker Buildx
      - Login to Amazon ECR
      - Setup Bun
      - Cache dependencies
      - Install dependencies
      - Quick check (lint + test)
      - Build, Push & Deploy
```

### Docker Compose Integration

The `docker-compose.yml` uses environment variables for ECR images:

```yaml
services:
  monitabits-api:
    image: ${ECR_REPO}/api:${IMAGE_TAG:-latest}
    environment:
      - DATABASE_URL=${DATABASE_URL}
  
  monitabits-app:
    image: ${ECR_REPO}/app:${IMAGE_TAG:-latest}
```

This allows the same compose file to work across all environments (dev/stg/prod) - Pulumi outputs provide the environment-specific values.

### To Learn More

- [Pulumi AWS Documentation](https://www.pulumi.com/docs/clouds/aws/)
- [Pulumi TypeScript Guide](https://www.pulumi.com/docs/languages-sdks/typescript/)
- [AWS VPC Best Practices](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-best-practices.html)

## 💡 Key Takeaways

1. **Infrastructure as Code:** Your infrastructure is version-controlled, repeatable code
2. **Declarative:** You describe what you want, Pulumi figures out how
3. **Type-Safe:** TypeScript catches errors before deployment
4. **Secure by Default:** Security best practices built in
5. **Modular:** Each resource type in its own module
6. **Configurable:** Same code, different environments via config

Remember: This is just code. You can read it, understand it, modify it, and test it - just like any other codebase!

---
name: AWS Infrastructure with Pulumi
overview: Create a Pulumi TypeScript infrastructure project that mirrors the AWS architecture diagram, organized as modules for network, security, compute, data, storage, and CI/CD. Integrate it into the monorepo with Bun scripts for stack management.
todos:
  - id: setup-project
    content: Create monitabits-infra app structure with Pulumi.yaml, package.json, tsconfig.json, biome.json
    status: pending
  - id: config-module
    content: Implement config.ts with type-safe configuration loading and validation
    status: pending
  - id: network-module
    content: Implement network.ts with VPC, subnets, IGW, NAT Gateway, and route tables
    status: pending
  - id: security-module
    content: Implement security.ts with security groups (app, db) and simplified NACLs
    status: pending
  - id: compute-module
    content: Implement compute.ts with EC2 instance, IAM role, and user data stub
    status: pending
  - id: data-module
    content: Implement data.ts with RDS PostgreSQL instance in private subnet
    status: pending
  - id: storage-module
    content: Implement storage.ts with S3 bucket for application assets
    status: pending
  - id: cicd-module
    content: Implement ci_cd.ts with ECR repository and IAM for CI/CD pipeline
    status: pending
  - id: index-entry
    content: Create index.ts that orchestrates all modules and exports outputs
    status: pending
  - id: stack-configs
    content: Create Pulumi.dev.yaml, Pulumi.stg.yaml, Pulumi.prod.yaml with stack-specific configurations
    status: pending
  - id: monorepo-integration
    content: Add infra scripts to root package.json and update .gitignore for Pulumi files
    status: pending
  - id: documentation
    content: Create README.md with setup instructions, configuration guide, and architecture overview
    status: pending
---

# AWS Infrastructure with Pulumi

Create a comprehensive Pulumi TypeScript infrastructure project (`apps/monitabits-infra`) that implements the AWS architecture shown in the diagram.

## Architecture Overview

The infrastructure consists of:

- **VPC** with public and private subnets across multiple AZs
- **Networking**: Internet Gateway, NAT Gateway, Route Tables
- **Security**: Security Groups, Network ACLs (simplified in v1)
- **Compute**: EC2 instance with IAM role for S3 access
- **Data**: RDS PostgreSQL instance in private subnet
- **Storage**: S3 bucket for application assets
- **CI/CD**: ECR repository and IAM for CI pipeline

## Project Structure

```javascript
apps/monitabits-infra/
├── Pulumi.yaml              # Pulumi project config
├── Pulumi.dev.yaml          # Dev stack config (secrets/custom values)
├── Pulumi.stg.yaml          # Staging stack config
├── Pulumi.prod.yaml         # Production stack config
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript config
├── biome.json               # Biome linting config
├── src/
│   ├── index.ts             # Main entry point, exports all resources
│   ├── config.ts            # Configuration loading utilities
│   ├── network.ts           # VPC, subnets, IGW, NATGW, route tables
│   ├── security.ts          # Security groups, NACLs
│   ├── compute.ts           # EC2 instance, IAM role, user data stub
│   ├── data.ts              # RDS PostgreSQL instance
│   ├── storage.ts           # S3 bucket for assets
│   └── ci_cd.ts             # ECR repo, IAM for CI/CD
└── README.md                # Infrastructure documentation
```



## Configuration Strategy

Stack-specific configuration via Pulumi config (not hard-coded):

### Network Configuration

- `vpc:cider` - VPC CIDR block (e.g., `10.0.0.0/16`)
- `vpc:publicSubnetCidrs` - Array of public subnet CIDRs
- `vpc:privateSubnetCidrs` - Array of private subnet CIDRs
- `vpc:availabilityZones` - AZs to use (defaults to 2-3 AZs)

### Compute Configuration

- `compute:instanceType` - EC2 instance type (e.g., `t3.medium`)
- `compute:diskSize` - EBS volume size in GB
- `compute:allowedSshCidrs` - Array of CIDR blocks allowed for SSH (NOT 0.0.0.0/0)

### Database Configuration

- `rds:instanceClass` - RDS instance class (e.g., `db.t3.micro`)
- `rds:allocatedStorage` - Storage size in GB
- `rds:backupRetentionDays` - Backup retention period
- `rds:multiAz` - Enable Multi-AZ (default: false for dev, true for prod)

### Storage Configuration

- `s3:bucketSuffix` - Suffix for bucket name (monitabits-{env}-assets-{suffix})

### Tags

- `project:name` - Project name (monitabits)
- `project:environment` - Environment (dev/stg/prod)

## Implementation Details

### network.ts

- Create VPC with configurable CIDR
- Create public subnets (one per AZ) with route table pointing to IGW
- Create private subnets (one per AZ) with route table pointing to NAT Gateway
- Create Internet Gateway and attach to VPC
- Create NAT Gateway in public subnet with Elastic IP
- Configure route tables for public/private subnets
- Resource naming: `monitabits-{env}-vpc`, `monitabits-{env}-subnet-public-{az}`, etc.

### security.ts

- **App Security Group** (`monitabits-{env}-sg-app`):
- Allow HTTP/HTTPS from internet (0.0.0.0/0)
- Allow SSH from configured CIDRs only (from config, NOT 0.0.0.0/0)
- **Database Security Group** (`monitabits-{env}-sg-db`):
- Allow PostgreSQL (5432) only from app security group
- **NACLs**: Create simplified NACLs (permissive for v1, can be tightened later)
- All security groups tagged appropriately

### compute.ts

- **IAM Role** (`monitabits-{env}-iam-ec2-role`):
- Trust policy for EC2 service
- Policy allowing S3 read/write to assets bucket
- Policy for pulling from ECR
- **EC2 Instance** (`monitabits-{env}-ec2-app`):
- Instance type from config
- EBS volume size from config
- In public subnet
- Security group: app security group
- IAM role attached
- User data stub (commented placeholder for future setup scripts)
- Tagged with project and environment

### data.ts

- **RDS PostgreSQL** (`monitabits-{env}-rds`):
- Instance class from config
- Allocated storage from config
- Backup retention from config
- Multi-AZ from config (default false for dev)
- In private subnet (across multiple AZs if Multi-AZ)
- Security group: database security group
- Engine: PostgreSQL 16 (or latest stable)
- Publicly accessible: false
- Tagged appropriately

### storage.ts

- **S3 Bucket** (`monitabits-{env}-assets-{suffix}`):
- Versioning enabled
- Server-side encryption (SSE-S3)
- Public access blocked (resources accessed via IAM)
- Lifecycle policies (optional, for cost optimization)
- Tagged appropriately

### ci_cd.ts

- **ECR Repository** (`monitabits-{env}-ecr-app`):
- Image scanning on push enabled
- Lifecycle policy for image retention
- Tag immutability enabled
- **IAM User/Role for CI/CD**:
- Permissions to push to ECR
- Permissions to deploy to EC2 (SSM or SSH key access)
- Output access keys or assume role ARN for CI/CD pipeline

### config.ts

- Utility functions to load and validate Pulumi config
- Type-safe configuration interfaces
- Default values for optional configs
- Validation for required configs

### index.ts

- Import and create all resource modules
- Export outputs (VPC ID, instance IP, RDS endpoint, S3 bucket name, ECR repo URI)
- Organize resources with proper dependencies

## Integration with Monorepo

### Root package.json Scripts

Add infrastructure scripts:

- `infra:up:dev` → `pulumi up -s dev --yes` (in monitabits-infra directory)
- `infra:preview:dev` → `pulumi preview -s dev` (in monitabits-infra directory)
- `infra:up:stg` → `pulumi up -s stg --yes`
- `infra:preview:stg` → `pulumi preview -s stg`
- `infra:up:prod` → `pulumi up -s prod --yes`
- `infra:preview:prod` → `pulumi preview -s prod`
- `infra:destroy:dev` → `pulumi destroy -s dev` (for cleanup)

### Turborepo Configuration

Add `monitabits-infra` to turbo.json tasks if needed for validation/type-checking.

### TypeScript Configuration

- Use `@repo/typescript-config` package for base config
- Extend with Node.js types for Pulumi runtime

## Dependencies

Install via Bun:

- `@pulumi/pulumi` - Core Pulumi SDK
- `@pulumi/aws` - AWS provider
- `@pulumi/awsx` - AWS classic (higher-level abstractions) - optional, can use native AWS resources
- TypeScript types from `@repo/typescript-config`

## Outputs

Key outputs exported from the stack:

- VPC ID
- Public subnet IDs
- Private subnet IDs
- EC2 instance public IP
- EC2 instance ID
- RDS endpoint (hostname)
- RDS port
- S3 bucket name
- ECR repository URI
- IAM role ARN for EC2

## Security Considerations

1. **SSH Access**: Never hard-code `0.0.0.0/0`. Must be configured per stack.
2. **RDS Security**: Only accessible from app security group, never publicly.
3. **S3 Bucket**: Block public access, use IAM for access control.
4. **IAM Roles**: Principle of least privilege - EC2 role only has S3 and ECR permissions needed.
5. **Secrets**: Use Pulumi secrets for sensitive values (RDS passwords, etc.).

## Future Enhancements

This v1 implementation sets the foundation for:

- Cost optimization (instance sizing, reserved instances)
- Secrets management (AWS Secrets Manager, Pulumi secrets)
- Migration path to ECS/Fargate (same VPC/subnet structure can be reused)
- Enhanced monitoring (CloudWatch, alarms)
- Auto-scaling groups
- Application Load Balancer

## Files to Create

1. `apps/monitabits-infra/Pulumi.yaml` - Project metadata
2. `apps/monitabits-infra/package.json` - Dependencies and scripts
3. `apps/monitabits-infra/tsconfig.json` - TypeScript configuration
4. `apps/monitabits-infra/biome.json` - Linting configuration
5. `apps/monitabits-infra/src/index.ts` - Main entry point
6. `apps/monitabits-infra/src/config.ts` - Configuration utilities
7. `apps/monitabits-infra/src/network.ts` - Network resources
8. `apps/monitabits-infra/src/security.ts` - Security resources
9. `apps/monitabits-infra/src/compute.ts` - Compute resources
10. `apps/monitabits-infra/src/data.ts` - Database resources
11. `apps/monitabits-infra/src/storage.ts` - Storage resources
12. `apps/monitabits-infra/src/ci_cd.ts` - CI/CD resources
13. `apps/monitabits-infra/README.md` - Documentation
14. `apps/monitabits-infra/.gitignore` - Ignore Pulumi state files
15. Update root `package.json` - Add infra scripts
16. Update root `.gitignore` - Ignore Pulumi state files

## Notes

- Use Pulumi's stack references for sharing outputs between stacks if needed
- Store Pulumi state in S3 or Pulumi Cloud (not committed to git)
- Follow TypeScript best practices from `.cursor/rules/coding.mdc`
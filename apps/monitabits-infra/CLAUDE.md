# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the Monitabits infrastructure project.

**IMPORTANT: Always refer to `.cursor/rules/` for development standards.**

## Project Overview

This is a Pulumi TypeScript project that manages AWS infrastructure for the Monitabits application. It creates:
- VPC with public/private subnets across multiple AZs
- EC2 instance for application hosting
- RDS PostgreSQL database in private subnets
- S3 bucket for application assets
- ECR repository for container images
- AWS Secrets Manager for secure credential storage
- IAM roles and policies for secure access

## Key Commands

### Pulumi Operations
- `bun run check:types` - Run TypeScript type checking
- `pulumi preview -s dev` - Preview changes for dev stack
- `pulumi up -s dev` - Deploy dev stack
- `pulumi destroy -s dev` - Destroy dev stack (use with caution)
- `pulumi stack output` - View all stack outputs
- `pulumi config set --secret rds:password "<password>"` - Set RDS password secret

### Deployment Script
- `bun run src/deploy.ts` - Build, push Docker images, and deploy to EC2
  - Uses `EntityCompose` to detect affected services from `docker-compose.yml`
  - Uses `EntityPackage` to resolve package paths
  - Pulls Pulumi outputs for ECR repo, EC2 instance ID, RDS credentials
  - Copies `docker-compose.yml` to EC2 and runs `docker-compose up -d`

### From Monorepo Root
- `bun run infra:preview:dev` - Preview dev infrastructure
- `bun run infra:up:dev` - Deploy dev infrastructure
- `bun run infra:destroy:dev` - Destroy dev infrastructure

## Code Style

- Use TypeScript strict mode
- All functions must have explicit return types
- Use `readonly` properties in interfaces
- Prefer interfaces over type aliases for object shapes
- Use `pulumi.Output<T>` for async values
- Never export sensitive data (passwords, access keys) as stack outputs
- All secrets must use `config.requireSecret()` - no fallback values

## File Structure

```
src/
├── index.ts          # Main entry point, orchestrates all resources
├── config.ts         # Configuration loading and validation
├── network.ts        # VPC, subnets, IGW, NAT Gateway, route tables
├── security.ts       # Security groups and NACLs
├── secrets.ts        # AWS Secrets Manager integration
├── compute.ts        # EC2 instance and IAM roles
├── data.ts           # RDS PostgreSQL instance
├── storage.ts        # S3 bucket configuration
├── ci_cd.ts          # ECR repository and CI/CD IAM role
├── deploy.ts         # Build, push, and deploy script for CI/CD
└── security-utils.ts # Security validation utilities
```

## Important Patterns

### Configuration
- All configuration comes from Pulumi config (not hardcoded)
- Secrets are loaded via `config.requireSecret()` - will fail if not set
- Validation happens in `config.ts` using `security-utils.ts`
- Stack-specific configs in `Pulumi.{env}.yaml` files

### Resource Naming
- Use `resourceName(project, suffix)` helper from `config.ts`
- Format: `{project-name}-{environment}-{suffix}`
- Example: `monitabits-dev-vpc`

### Security Best Practices
- SSH access: Never allow `0.0.0.0/0` - validated in `validateSshCidrs()`
- Secrets: Stored in AWS Secrets Manager, not in code or outputs
- CI/CD: Uses IAM roles with OIDC, not access keys
- RDS: Password from Secrets Manager, never hardcoded
- EC2: IMDSv2 required, encrypted EBS volumes

### Dependencies
Resources are created in this order:
1. Network (VPC, subnets, gateways)
2. Security (security groups, NACLs)
3. Secrets (Secrets Manager)
4. Storage (S3)
5. CI/CD (ECR, IAM role)
6. Compute (EC2 - depends on S3, ECR, Secrets)
7. Data (RDS - depends on network, security, secrets)

## Common Tasks

### Adding a New Resource
1. Create a new module file in `src/` (e.g., `new-resource.ts`)
2. Export a `create*` function that takes `InfrastructureConfig`
3. Return an interface with created resources
4. Import and call in `index.ts`
5. Export any non-sensitive outputs

### Modifying Configuration
1. Update `config.ts` to load new config values
2. Add validation in `security-utils.ts` if needed
3. Update `Pulumi.example.yaml` with documentation
4. Update `README.md` with new configuration options

### Debugging
- Use `pulumi logs` to view stack logs
- Check `pulumi stack` for current state
- Run `pulumi refresh` to sync state with AWS
- Use `pulumi stack output <key>` to get specific values

## Testing

- Type checking: `bun run check:types`
- Always run type check before committing
- Preview changes before deploying: `pulumi preview`
- Test in dev environment before staging/prod

## Workflow

1. **Read** relevant files and understand current state
2. **Plan** changes (consider dependencies and security)
3. **Implement** changes following patterns above
4. **Validate** with type checking and preview
5. **Deploy** to dev first, then staging, then prod
6. **Document** any new configuration or patterns

## Security Reminders

- NEVER commit secrets to git
- NEVER use `0.0.0.0/0` for SSH access
- ALWAYS use `config.requireSecret()` for passwords
- ALWAYS validate CIDR blocks and IP addresses
- NEVER export sensitive data as stack outputs
- ALWAYS use IAM roles instead of access keys when possible

## Troubleshooting

### "rds:password is required"
Set the secret: `pulumi config set --secret rds:password "<password>"`

### "compute:allowedSshCidrs must contain at least one CIDR block"
Update `Pulumi.{env}.yaml` with your IP: `compute:allowedSshCidrs: ["YOUR_IP/32"]`

### Type errors after changes
Run `bun install` to ensure dependencies are up to date, then `bun run check:types`

### Stack state out of sync
Run `pulumi refresh` to sync state with actual AWS resources

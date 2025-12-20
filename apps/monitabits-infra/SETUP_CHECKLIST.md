# ✅ Setup Checklist

Use this checklist to track your progress through the setup process.

## Pre-Setup

- [ ] Mac computer with Terminal access
- [ ] Internet connection
- [ ] Credit card ready (for AWS account - free tier available)
- [ ] Node.js or Bun installed (`node --version` or `bun --version`)

## Step 1: AWS Account

- [ ] Created AWS account at aws.amazon.com
- [ ] Verified email address
- [ ] Completed phone verification
- [ ] Account is activated (received confirmation email)
- [ ] Can log in to AWS Console

## Step 2: IAM User

- [ ] Opened IAM Console
- [ ] Created new user (e.g., `pulumi-admin`)
- [ ] Attached `AdministratorAccess` policy
- [ ] Created access keys
- [ ] **SAVED Access Key ID** (you won't see it again!)
- [ ] **SAVED Secret Access Key** (you won't see it again!)

## Step 3: AWS CLI

- [ ] Installed AWS CLI (`aws --version` works)
- [ ] Ran `aws configure`
- [ ] Entered Access Key ID
- [ ] Entered Secret Access Key
- [ ] Set default region (e.g., `us-east-1`)
- [ ] Verified with `aws sts get-caller-identity` (shows your account info)

## Step 4: Pulumi

- [ ] Installed Pulumi (`pulumi version` works)
- [ ] Created account at app.pulumi.com
- [ ] Logged in via `pulumi login`
- [ ] Verified with `pulumi whoami`

## Step 5: Project Setup

- [ ] Navigated to `apps/monitabits-infra`
- [ ] Ran `bun install` (or `npm install`)
- [ ] Created stack: `pulumi stack init dev`
- [ ] Set AWS region: `pulumi config set aws:region us-east-1`
- [ ] Got my public IP address
- [ ] Updated `Pulumi.dev.yaml` with my IP in `compute:allowedSshCidrs`
- [ ] Set RDS password: `pulumi config set --secret rds:password "..."`
- [ ] Verified config: `pulumi config`

## Step 6: First Deployment

- [ ] Ran `pulumi preview` (saw list of resources to create)
- [ ] Reviewed the preview (understood what will be created)
- [ ] Ran `pulumi up` and typed `yes`
- [ ] Waited for deployment to complete (10-15 minutes)
- [ ] Viewed outputs: `pulumi stack output`
- [ ] Verified resources in AWS Console:
  - [ ] EC2 instance exists
  - [ ] RDS database exists
  - [ ] S3 bucket exists
  - [ ] ECR repository exists
  - [ ] VPC exists

## Post-Setup

- [ ] Read `README.md` for architecture overview
- [ ] Explored AWS Console to see resources
- [ ] Understood what was created
- [ ] (Optional) Made a small config change and ran `pulumi preview`

## Cleanup (When Done Learning)

- [ ] Ran `pulumi destroy` to remove all resources
- [ ] Confirmed resources are deleted in AWS Console
- [ ] (Optional) Deleted IAM user if no longer needed

---

**Stuck?** Check [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions and troubleshooting.

**Need help?** Review the Troubleshooting section in the setup guide.

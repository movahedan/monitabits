# 🚀 Complete Beginner's Setup Guide

> A step-by-step guide to setting up AWS and Pulumi from scratch for the Monitabits infrastructure project.

**📝 Tip**: Use [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) to track your progress as you go!

## 📋 Table of Contents

- [What You're About to Learn](#what-youre-about-to-learn)
- [Prerequisites Check](#prerequisites-check)
- [Step 1: Create AWS Account](#step-1-create-aws-account)
- [Step 2: Create IAM User for Pulumi](#step-2-create-iam-user-for-pulumi)
- [Step 3: Install AWS CLI](#step-3-install-aws-cli)
- [Step 4: Configure AWS Credentials](#step-4-configure-aws-credentials)
- [Step 5: Install Pulumi](#step-5-install-pulumi)
- [Step 6: Setup Pulumi Account](#step-6-setup-pulumi-account)
- [Step 7: Configure the Project](#step-7-configure-the-project)
- [Step 8: First Deployment](#step-8-first-deployment)
- [Troubleshooting](#troubleshooting)
- [Next Steps](#next-steps)

---

## 🎯 What You're About to Learn

**AWS (Amazon Web Services)** = Cloud computing platform where you can rent servers, databases, storage, etc.

**Pulumi** = A tool that lets you write code (TypeScript) to create and manage AWS resources automatically, instead of clicking through web interfaces.

**This Project** = Infrastructure code that creates:
- A virtual network (VPC)
- A server (EC2 instance)
- A database (RDS PostgreSQL)
- Storage (S3 bucket)
- Container registry (ECR)
- Security settings

Think of it like this: Instead of manually building a house, you write a blueprint, and Pulumi builds it for you in AWS.

---

## ✅ Prerequisites Check

Before we start, make sure you have:

- [ ] A Mac computer
- [ ] Internet connection
- [ ] A credit card (for AWS account - won't be charged for free tier)
- [ ] Terminal access
- [ ] Node.js or Bun installed (check with: `node --version` or `bun --version`)

If you don't have Node.js/Bun, install it first:
```bash
brew install node
# or
brew install bun
```

---

## Step 1: Create AWS Account

### 1.1 Sign Up for AWS

1. Go to [aws.amazon.com](https://aws.amazon.com/)
2. Click **"Create an AWS Account"** (top right)
3. Follow the signup process:
   - Enter your email and password
   - Provide payment information (you'll get free tier credits)
   - Verify your phone number
   - Choose a support plan (start with "Basic" - it's free)

### 1.2 Wait for Account Activation

- AWS will take a few minutes to activate your account
- You'll receive a confirmation email when it's ready
- Once activated, log in to the [AWS Console](https://console.aws.amazon.com/)

### 1.3 Choose a Region

**Important**: AWS has multiple regions (data centers in different locations). For this guide, we'll use **US East (N. Virginia)** - `us-east-1`.

- You can see your current region in the top-right corner of the AWS Console
- Click it to change if needed
- For beginners, `us-east-1` is recommended (most services available, cheapest)

---

## Step 2: Create IAM User for Pulumi

**Why?** You need credentials (username/password equivalent) for Pulumi to access AWS on your behalf.

### 2.1 Open IAM Console

1. In AWS Console, search for **"IAM"** in the top search bar
2. Click on **"IAM"** (Identity and Access Management)

### 2.2 Create a New User

1. In the left sidebar, click **"Users"**
2. Click **"Create user"** button (top right)
3. **User name**: Enter `pulumi-admin` (or any name you like)
4. Click **"Next"**

### 2.3 Set Permissions

1. Select **"Attach policies directly"**
2. Search for and check **"AdministratorAccess"**
   - ⚠️ **Note**: This gives full access. For production, use more restrictive policies, but for learning, this is fine.
3. Click **"Next"**
4. Click **"Create user"**

### 2.4 Create Access Keys

1. Click on the user you just created (`pulumi-admin`)
2. Click the **"Security credentials"** tab
3. Scroll down to **"Access keys"** section
4. Click **"Create access key"**
5. Select **"Command Line Interface (CLI)"** as the use case
6. Check the confirmation box
7. Click **"Next"**
8. (Optional) Add a description tag
9. Click **"Create access key"**

### 2.5 Save Your Credentials

**⚠️ CRITICAL: Save these now - you can only see them once!**

You'll see:
- **Access key ID**: Something like `AKIAIOSFODNN7EXAMPLE`
- **Secret access key**: Something like `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`

**Save them securely:**
- Copy both values
- Store them in a password manager or secure note
- **Never commit these to git!**

Click **"Done"** when you've saved them.

---

## Step 3: Install AWS CLI

**AWS CLI** = Command-line tool to interact with AWS from your terminal.

```bash
# Install AWS CLI using Homebrew
brew install awscli

# Verify installation
aws --version
# Should show: aws-cli/2.x.x
```

---

## Step 4: Configure AWS Credentials

Now we'll tell AWS CLI to use the credentials you created.

### 4.1 Configure AWS CLI

Run this command in your terminal:

```bash
aws configure
```

You'll be prompted for 4 things:

1. **AWS Access Key ID**: Paste your Access Key ID from Step 2.5
2. **AWS Secret Access Key**: Paste your Secret Access Key from Step 2.5
3. **Default region name**: Enter `us-east-1` (or your preferred region)
4. **Default output format**: Press Enter (defaults to `json`)

### 4.2 Verify Configuration

Test that it works:

```bash
# This should show your AWS account info (no errors)
aws sts get-caller-identity
```

You should see output like:
```json
{
    "UserId": "AIDA...",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/pulumi-admin"
}
```

**If you see an error**, double-check:
- Your access keys are correct
- No extra spaces when pasting
- Your IAM user has permissions

### 4.3 (Optional) Check Your Credentials File

AWS CLI stores credentials in `~/.aws/credentials`. You can verify:

```bash
cat ~/.aws/credentials
```

You should see:
```ini
[default]
aws_access_key_id = YOUR_ACCESS_KEY
aws_secret_access_key = YOUR_SECRET_KEY
```

---

## Step 5: Install Pulumi

**Pulumi** = The tool that will create AWS resources from your code.

```bash
# Install Pulumi using Homebrew
brew install pulumi

# Verify installation
pulumi version
# Should show: v3.x.x
```

---

## Step 6: Setup Pulumi Account

Pulumi needs an account to store your infrastructure state (what resources exist).

### 6.1 Create Pulumi Account

1. Go to [app.pulumi.com](https://app.pulumi.com/)
2. Click **"Sign Up"** (or "Sign In" if you have an account)
3. Sign up with:
   - GitHub account (recommended), or
   - Email address
4. Complete the signup process

### 6.2 Login from Terminal

```bash
pulumi login
```

This will:
- Open your browser
- Ask you to authorize the CLI
- Save your login token

**Alternative (if browser doesn't open):**
```bash
# Get a token from: https://app.pulumi.com/account/tokens
pulumi login --save
# Then paste the token when prompted
```

### 6.3 Verify Login

```bash
pulumi whoami
# Should show your username
```

---

## Step 7: Configure the Project

Now let's configure the Monitabits infrastructure project.

### 7.1 Navigate to Project

```bash
cd apps/monitabits-infra
```

### 7.2 Install Dependencies

```bash
bun install
```

### 7.3 Initialize Pulumi Stack

A "stack" is an isolated environment (dev, staging, prod). Let's create a dev stack:

```bash
pulumi stack init dev
```

If it asks about a backend, choose **"Pulumi Cloud"** (the default).

### 7.4 Configure AWS Region

Tell Pulumi which AWS region to use:

```bash
pulumi config set aws:region us-east-1
```

(Replace `us-east-1` with your preferred region if different)

### 7.5 Get Your Public IP Address

You need to allow SSH access from your IP address. Get it:

```bash
curl https://checkip.amazonaws.com
```

**Save this IP address** - you'll need it in the next step.

### 7.6 Update Configuration File

Open `Pulumi.dev.yaml` in your editor and update the SSH access:

```yaml
compute:allowedSshCidrs:
  - "YOUR_IP_ADDRESS/32"  # Replace YOUR_IP_ADDRESS with the IP from step 7.5
```

**Example:**
```yaml
compute:allowedSshCidrs:
  - "203.0.113.50/32"
```

**What does `/32` mean?** It means "only this exact IP address". This is a security feature.

### 7.7 Set RDS Database Password

Set a secure password for the database (this is stored encrypted):

```bash
# Generate a random secure password
pulumi config set --secret rds:password "$(openssl rand -base64 32)"
```

**What this does:**
- Generates a random 32-character password
- Stores it encrypted in Pulumi's secret store
- This password will be used for the PostgreSQL database

**Alternative (if openssl not available):**
```bash
# Use a password generator or create your own
pulumi config set --secret rds:password "YourSecurePassword123!"
```

### 7.8 Verify Configuration

Check that everything is configured:

```bash
# View all configuration
pulumi config

# View non-secret config
pulumi config --show-secrets=false

# Check specific values
pulumi config get aws:region
pulumi config get project:environment
```

---

## Step 8: First Deployment

Now let's deploy your infrastructure!

### 8.1 Preview Changes

Before deploying, see what Pulumi will create:

```bash
pulumi preview
```

This will:
- Show you all resources that will be created
- Show estimated costs (if available)
- **Not make any changes yet**

**What to expect:**
- You'll see a list of resources: VPC, Subnets, EC2, RDS, S3, etc.
- Each will show `+ create` (new resource)
- Review the list to understand what's being created

### 8.2 Deploy Infrastructure

If the preview looks good, deploy:

```bash
pulumi up
```

**What happens:**
1. Pulumi will show you a summary
2. Ask: **"Do you want to perform this update?"**
3. Type **`yes`** and press Enter
4. Pulumi will start creating resources (this takes 10-15 minutes)
5. You'll see progress as resources are created

**First-time deployment takes longer because:**
- VPC and networking setup
- EC2 instance launch
- RDS database creation (slowest part)
- Security group configuration

**Be patient!** This is normal.

### 8.3 View Outputs

After deployment completes, view what was created:

```bash
pulumi stack output
```

This shows important information like:
- EC2 instance IP address
- RDS database endpoint
- S3 bucket name
- ECR repository URL

### 8.4 Verify in AWS Console

1. Go to [AWS Console](https://console.aws.amazon.com/)
2. Check these services to see your resources:
   - **EC2** → Instances (should see your server)
   - **RDS** → Databases (should see PostgreSQL database)
   - **S3** → Buckets (should see your bucket)
   - **ECR** → Repositories (should see your container repo)
   - **VPC** → Your VPCs (should see your network)

---

## 🔧 Troubleshooting

### Problem: "Access Denied" or "UnauthorizedOperation"

**Solution:**
- Your IAM user might not have enough permissions
- Go to IAM → Users → Your user → Permissions
- Ensure "AdministratorAccess" policy is attached

### Problem: "Region not found" or "Invalid region"

**Solution:**
```bash
# Check your region
pulumi config get aws:region

# Set correct region
pulumi config set aws:region us-east-1
```

### Problem: "rds:password is required"

**Solution:**
```bash
# Set the password
pulumi config set --secret rds:password "$(openssl rand -base64 32)"
```

### Problem: "compute:allowedSshCidrs must contain at least one CIDR block"

**Solution:**
- Open `Pulumi.dev.yaml`
- Add your IP address to `compute:allowedSshCidrs`:
  ```yaml
  compute:allowedSshCidrs:
    - "YOUR_IP/32"
  ```

### Problem: Deployment fails partway through

**Solution:**
```bash
# Check what failed
pulumi stack --show-urns

# Try again (Pulumi is idempotent - safe to retry)
pulumi up

# If stuck, refresh state
pulumi refresh
```

### Problem: "Pulumi login" doesn't work

**Solution:**
```bash
# Try manual login
pulumi login --save
# Then paste token from: https://app.pulumi.com/account/tokens
```

### Problem: AWS CLI not found

**Solution:**
- Verify installation: `aws --version`
- If not found, reinstall: `brew install awscli`
- Ensure Homebrew paths are in your PATH

---

## 🎉 Next Steps

Congratulations! You've deployed your first infrastructure. Now:

### 1. Understand What You Created

- Read `README.md` for architecture overview
- Check `docs/9_PULUMI.md` for deeper understanding
- Explore AWS Console to see your resources

### 2. Learn More

- [Pulumi AWS Documentation](https://www.pulumi.com/docs/clouds/aws/)
- [AWS Free Tier Guide](https://aws.amazon.com/free/)
- [Pulumi Getting Started](https://www.pulumi.com/docs/get-started/)

### 3. Make Changes

Try modifying `Pulumi.dev.yaml`:
- Change EC2 instance type
- Adjust RDS storage size
- Then run `pulumi preview` to see changes

### 4. Clean Up (When Done Learning)

**⚠️ Important**: AWS resources cost money (though free tier covers most of this for 12 months).

To destroy everything:

```bash
pulumi destroy
# Type 'yes' when prompted
```

This will delete all resources and stop charges.

---

## 📚 Additional Resources

- **AWS Console**: [console.aws.amazon.com](https://console.aws.amazon.com/)
- **Pulumi Console**: [app.pulumi.com](https://app.pulumi.com/)
- **AWS Free Tier**: [aws.amazon.com/free](https://aws.amazon.com/free/)
- **Pulumi Docs**: [pulumi.com/docs](https://www.pulumi.com/docs/)

---

## 💡 Key Concepts You Learned

1. **AWS Account** = Your cloud account
2. **IAM User** = Identity with permissions
3. **Access Keys** = Credentials for programmatic access
4. **AWS CLI** = Command-line tool for AWS
5. **Pulumi** = Infrastructure as Code tool
6. **Stack** = Isolated environment (dev/stg/prod)
7. **Config** = Settings for your infrastructure
8. **Secrets** = Encrypted sensitive values
9. **Deployment** = Creating resources in AWS

---

**Remember**: Infrastructure as Code means you can recreate everything with a single command. Experiment, learn, and don't be afraid to destroy and recreate!

Good luck! 🚀

import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { type InfrastructureConfig, resourceName } from "./config.ts";
import type { NetworkResources } from "./network.ts";
import { createSecretsReadPolicy, type SecretsResources } from "./secrets.ts";
import type { SecurityResources } from "./security.ts";

export interface ComputeResources {
	readonly ec2Instance: aws.ec2.Instance;
	readonly iamRole: aws.iam.Role;
	readonly instanceProfile: aws.iam.InstanceProfile;
}

interface CreateComputeOptions {
	readonly config: InfrastructureConfig;
	readonly network: NetworkResources;
	readonly security: SecurityResources;
	readonly secrets: SecretsResources;
	readonly s3BucketName: pulumi.Output<string>;
	readonly ecrRepositoryUri: pulumi.Output<string>;
}

/**
 * Creates EC2 instance with IAM role for S3, ECR, and Secrets Manager access
 */
export const createCompute = (options: CreateComputeOptions): ComputeResources => {
	const { config, network, security, secrets, s3BucketName, ecrRepositoryUri } = options;
	const { compute, project } = config;

	// Get latest Amazon Linux 2023 AMI
	const ami = aws.ec2.getAmi({
		filters: [
			{
				name: "name",
				values: ["al2023-ami-*-x86_64"],
			},
		],
		owners: ["amazon"],
		mostRecent: true,
	});

	// Create IAM role for EC2
	const iamRole = new aws.iam.Role(resourceName(project, "iam-ec2-role"), {
		name: resourceName(project, "iam-ec2-role"),
		assumeRolePolicy: JSON.stringify({
			Version: "2012-10-17",
			Statement: [
				{
					Effect: "Allow",
					Principal: {
						Service: "ec2.amazonaws.com",
					},
					Action: "sts:AssumeRole",
				},
			],
		}),
		tags: {
			Name: resourceName(project, "iam-ec2-role"),
			Project: project.name,
			Environment: project.environment,
		},
	});

	// Policy for S3 access to assets bucket
	void new aws.iam.RolePolicy(resourceName(project, "iam-ec2-s3-policy"), {
		role: iamRole.id,
		policy: pulumi.all([s3BucketName]).apply(([bucketName]) =>
			JSON.stringify({
				Version: "2012-10-17",
				Statement: [
					{
						Effect: "Allow",
						Action: ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
						Resource: `arn:aws:s3:::${bucketName}/*`,
					},
					{
						Effect: "Allow",
						Action: ["s3:ListBucket"],
						Resource: `arn:aws:s3:::${bucketName}`,
					},
				],
			}),
		),
	});

	// Policy for ECR access
	void new aws.iam.RolePolicy(resourceName(project, "iam-ec2-ecr-policy"), {
		role: iamRole.id,
		policy: pulumi.all([ecrRepositoryUri]).apply(([repoUri]) => {
			const repoName = repoUri.split("/").pop() ?? "";
			return JSON.stringify({
				Version: "2012-10-17",
				Statement: [
					{
						Effect: "Allow",
						Action: [
							"ecr:GetAuthorizationToken",
							"ecr:BatchCheckLayerAvailability",
							"ecr:GetDownloadUrlForLayer",
							"ecr:BatchGetImage",
						],
						Resource: "*",
					},
					{
						Effect: "Allow",
						Action: ["ecr:DescribeRepositories"],
						Resource: `arn:aws:ecr:*:*:repository/${repoName}`,
					},
				],
			});
		}),
	});

	// Policy for Secrets Manager access (RDS credentials)
	void new aws.iam.RolePolicy(resourceName(project, "iam-ec2-secrets-policy"), {
		role: iamRole.id,
		policy: createSecretsReadPolicy(secrets.rdsSecret.arn),
	});

	// Create instance profile
	const instanceProfile = new aws.iam.InstanceProfile(resourceName(project, "iam-ec2-profile"), {
		name: resourceName(project, "iam-ec2-profile"),
		role: iamRole.name,
	});

	// User data for EC2 instance setup
	// Includes setup for Docker, AWS CLI, and Secrets Manager integration
	const userData = `#!/bin/bash
set -e

# Update system
dnf update -y

# Install Docker
dnf install -y docker
systemctl start docker
systemctl enable docker

# Add ec2-user to docker group
usermod -a -G docker ec2-user

# Install AWS CLI v2 (already installed on AL2023, but ensure latest)
dnf install -y awscli

# Install SSM agent for remote management
dnf install -y amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent

# Log completion
echo "EC2 instance initialization completed" | logger

# Placeholder for application-specific setup
# The application should use AWS SDK to retrieve secrets from Secrets Manager
# Example: aws secretsmanager get-secret-value --secret-id <secret-name>
`;

	// Create EC2 instance
	const ec2Instance = new aws.ec2.Instance(resourceName(project, "ec2-app"), {
		ami: ami.then((a) => a.id),
		instanceType: compute.instanceType,
		subnetId: network.publicSubnets[0].id,
		vpcSecurityGroupIds: [security.appSecurityGroup.id],
		iamInstanceProfile: instanceProfile.name,
		userData: userData,
		rootBlockDevice: {
			volumeType: "gp3",
			volumeSize: compute.diskSize,
			encrypted: true, // Enable EBS encryption
			deleteOnTermination: true,
		},
		// Enable detailed monitoring in production
		monitoring: project.environment === "prod",
		// Disable instance metadata v1 for security
		metadataOptions: {
			httpEndpoint: "enabled",
			httpTokens: "required", // Require IMDSv2
			httpPutResponseHopLimit: 1,
		},
		tags: {
			Name: resourceName(project, "ec2-app"),
			Project: project.name,
			Environment: project.environment,
		},
	});

	return {
		ec2Instance,
		iamRole,
		instanceProfile,
	};
};

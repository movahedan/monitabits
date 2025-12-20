import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { type InfrastructureConfig, resourceName } from "./config.ts";

export interface CiCdResources {
	readonly ecrRepository: aws.ecr.Repository;
	readonly ecrLifecyclePolicy: aws.ecr.LifecyclePolicy;
	readonly ciCdRole: aws.iam.Role;
}

/**
 * Creates ECR repository and IAM role for CI/CD pipeline
 * Uses IAM roles instead of access keys for better security
 */
export const createCiCd = (config: InfrastructureConfig): CiCdResources => {
	const { project } = config;

	// Get current AWS account ID for trust policy
	const currentAccount = aws.getCallerIdentity({});

	// Create ECR repository
	const ecrRepository = new aws.ecr.Repository(resourceName(project, "ecr-app"), {
		name: resourceName(project, "ecr-app"),
		imageTagMutability: "IMMUTABLE",
		imageScanningConfiguration: {
			scanOnPush: true,
		},
		tags: {
			Name: resourceName(project, "ecr-app"),
			Project: project.name,
			Environment: project.environment,
		},
	});

	// Create lifecycle policy to keep only last 10 images
	const ecrLifecyclePolicy = new aws.ecr.LifecyclePolicy(
		resourceName(project, "ecr-app-lifecycle"),
		{
			repository: ecrRepository.name,
			policy: JSON.stringify({
				rules: [
					{
						rulePriority: 1,
						description: "Keep last 10 images",
						selection: {
							tagStatus: "any",
							countType: "imageCountMoreThan",
							countNumber: 10,
						},
						action: {
							type: "expire",
						},
					},
				],
			}),
		},
	);

	// Create IAM role for CI/CD (GitHub Actions, GitLab CI, etc.)
	// This uses OIDC federation for secure role assumption
	const ciCdRole = new aws.iam.Role(resourceName(project, "iam-cicd-role"), {
		name: resourceName(project, "iam-cicd-role"),
		description: "IAM role for CI/CD pipeline to deploy to ECR and EC2",
		assumeRolePolicy: pulumi.all([currentAccount]).apply(([account]) =>
			JSON.stringify({
				Version: "2012-10-17",
				Statement: [
					{
						Effect: "Allow",
						Principal: {
							// Allow assumption from GitHub Actions OIDC provider
							// Users should configure their own OIDC provider ARN
							Federated: `arn:aws:iam::${account.accountId}:oidc-provider/token.actions.githubusercontent.com`,
						},
						Action: "sts:AssumeRoleWithWebIdentity",
						Condition: {
							StringEquals: {
								"token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
							},
							StringLike: {
								// Allows any repo in the organization - should be restricted
								"token.actions.githubusercontent.com:sub": "repo:*:*",
							},
						},
					},
					{
						// Fallback: Allow assumption from same account (for manual testing)
						Effect: "Allow",
						Principal: {
							AWS: `arn:aws:iam::${account.accountId}:root`,
						},
						Action: "sts:AssumeRole",
						Condition: {
							Bool: {
								"aws:MultiFactorAuthPresent": "true",
							},
						},
					},
				],
			}),
		),
		maxSessionDuration: 3600, // 1 hour max session
		tags: {
			Name: resourceName(project, "iam-cicd-role"),
			Project: project.name,
			Environment: project.environment,
		},
	});

	// Policy for ECR push/pull
	void new aws.iam.RolePolicy(resourceName(project, "iam-cicd-ecr-policy"), {
		role: ciCdRole.id,
		policy: pulumi.all([ecrRepository.arn]).apply(([repoArn]) =>
			JSON.stringify({
				Version: "2012-10-17",
				Statement: [
					{
						Effect: "Allow",
						Action: ["ecr:GetAuthorizationToken"],
						Resource: "*",
					},
					{
						Effect: "Allow",
						Action: [
							"ecr:BatchCheckLayerAvailability",
							"ecr:GetDownloadUrlForLayer",
							"ecr:BatchGetImage",
							"ecr:PutImage",
							"ecr:InitiateLayerUpload",
							"ecr:UploadLayerPart",
							"ecr:CompleteLayerUpload",
							"ecr:DescribeRepositories",
							"ecr:DescribeImages",
							"ecr:ListImages",
						],
						Resource: repoArn,
					},
				],
			}),
		),
	});

	// Policy for EC2 deployment (SSM access for remote commands)
	void new aws.iam.RolePolicy(resourceName(project, "iam-cicd-deploy-policy"), {
		role: ciCdRole.id,
		policy: JSON.stringify({
			Version: "2012-10-17",
			Statement: [
				{
					Effect: "Allow",
					Action: ["ssm:SendCommand", "ssm:ListCommandInvocations", "ssm:GetCommandInvocation"],
					Resource: "*",
				},
				{
					Effect: "Allow",
					Action: ["ec2:DescribeInstances", "ec2:DescribeInstanceStatus"],
					Resource: "*",
				},
			],
		}),
	});

	return {
		ecrRepository,
		ecrLifecyclePolicy,
		ciCdRole,
	};
};

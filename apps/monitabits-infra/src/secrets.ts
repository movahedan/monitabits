import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { type InfrastructureConfig, resourceName } from "./config.ts";

export interface SecretsResources {
	readonly rdsSecret: aws.secretsmanager.Secret;
	readonly rdsSecretVersion: aws.secretsmanager.SecretVersion;
}

/**
 * Creates AWS Secrets Manager secrets for RDS and other sensitive data
 * This provides:
 * - Secrets encrypted at rest with KMS
 * - Centralized secret management
 * - Future support for automatic rotation
 */
export const createSecrets = (config: InfrastructureConfig): SecretsResources => {
	const { project, rds } = config;

	// Create secret for RDS credentials
	const rdsSecret = new aws.secretsmanager.Secret(resourceName(project, "rds-credentials"), {
		name: resourceName(project, "rds-credentials"),
		description: "RDS PostgreSQL credentials for Monitabits application",
		recoveryWindowInDays: project.environment === "prod" ? 30 : 0, // No recovery in non-prod
		tags: {
			Name: resourceName(project, "rds-credentials"),
			Project: project.name,
			Environment: project.environment,
		},
	});

	// Create initial secret version with RDS credentials
	const rdsSecretVersion = new aws.secretsmanager.SecretVersion(
		resourceName(project, "rds-credentials-version"),
		{
			secretId: rdsSecret.id,
			secretString: pulumi.all([rds.password]).apply(([password]) =>
				JSON.stringify({
					username: "monitabits",
					password: password,
					engine: "postgres",
					port: 5432,
					dbname: "monitabits",
				}),
			),
		},
	);

	return {
		rdsSecret,
		rdsSecretVersion,
	};
};

/**
 * Creates IAM policy document for reading secrets from Secrets Manager
 * Use this to grant EC2 or other services access to secrets
 */
export const createSecretsReadPolicy = (
	secretArn: pulumi.Output<string>,
): pulumi.Output<string> => {
	return secretArn.apply((arn) =>
		JSON.stringify({
			Version: "2012-10-17",
			Statement: [
				{
					Effect: "Allow",
					Action: ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"],
					Resource: arn,
				},
			],
		}),
	);
};

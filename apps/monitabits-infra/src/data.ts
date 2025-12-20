import * as aws from "@pulumi/aws";
import { type InfrastructureConfig, resourceName } from "./config.ts";
import type { NetworkResources } from "./network.ts";
import type { SecretsResources } from "./secrets.ts";
import type { SecurityResources } from "./security.ts";

export interface DataResources {
	readonly rdsInstance: aws.rds.Instance;
	readonly dbSubnetGroup: aws.rds.SubnetGroup;
	readonly parameterGroup: aws.rds.ParameterGroup;
}

/**
 * Creates RDS PostgreSQL instance in private subnets
 * Uses AWS Secrets Manager for credential management
 */
export const createData = (
	config: InfrastructureConfig,
	network: NetworkResources,
	security: SecurityResources,
	secrets: SecretsResources,
): DataResources => {
	const { rds, project } = config;

	// Create DB subnet group
	const dbSubnetGroup = new aws.rds.SubnetGroup(resourceName(project, "db-subnet-group"), {
		name: resourceName(project, "db-subnet-group"),
		subnetIds: network.privateSubnets.map((subnet: aws.ec2.Subnet) => subnet.id),
		tags: {
			Name: resourceName(project, "db-subnet-group"),
			Project: project.name,
			Environment: project.environment,
		},
	});

	// Create parameter group for PostgreSQL 16
	const parameterGroup = new aws.rds.ParameterGroup(resourceName(project, "db-parameter-group"), {
		family: "postgres16",
		name: resourceName(project, "db-parameter-group"),
		description: "Parameter group for Monitabits PostgreSQL database",
		tags: {
			Name: resourceName(project, "db-parameter-group"),
			Project: project.name,
			Environment: project.environment,
		},
	});

	// Create RDS instance with Secrets Manager integration
	const rdsInstance = new aws.rds.Instance(
		resourceName(project, "rds"),
		{
			identifier: resourceName(project, "rds"),
			engine: "postgres",
			engineVersion: "16.6", // Use latest PostgreSQL 16 minor version
			instanceClass: rds.instanceClass,
			allocatedStorage: rds.allocatedStorage,
			storageType: "gp3",
			storageEncrypted: true, // Enable storage encryption
			dbName: "monitabits",
			username: "monitabits",
			// Use password from Secrets Manager secret (initial password)
			password: rds.password,
			dbSubnetGroupName: dbSubnetGroup.name,
			vpcSecurityGroupIds: [security.dbSecurityGroup.id],
			parameterGroupName: parameterGroup.name,
			backupRetentionPeriod: rds.backupRetentionDays,
			multiAz: rds.multiAz,
			publiclyAccessible: false,
			skipFinalSnapshot: project.environment !== "prod",
			finalSnapshotIdentifier:
				project.environment === "prod"
					? `${resourceName(project, "rds")}-final-${Date.now()}`
					: undefined,
			enabledCloudwatchLogsExports: ["postgresql", "upgrade"],
			performanceInsightsEnabled: project.environment === "prod",
			// Enable deletion protection in production
			deletionProtection: project.environment === "prod",
			// Enable auto minor version upgrades for security patches
			autoMinorVersionUpgrade: true,
			// Copy tags to snapshots
			copyTagsToSnapshot: true,
			tags: {
				Name: resourceName(project, "rds"),
				Project: project.name,
				Environment: project.environment,
			},
		},
		{
			// Ensure secrets are created before RDS instance
			dependsOn: [secrets.rdsSecretVersion],
		},
	);

	return {
		rdsInstance,
		dbSubnetGroup,
		parameterGroup,
	};
};

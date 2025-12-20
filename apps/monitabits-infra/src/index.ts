import type * as pulumi from "@pulumi/pulumi";
import { createCiCd } from "./ci_cd.ts";
import { createCompute } from "./compute.ts";
import { loadConfig } from "./config.ts";
import { createData } from "./data.ts";
import { createNetwork } from "./network.ts";
import { createSecrets } from "./secrets.ts";
import { createSecurity } from "./security.ts";
import { createStorage } from "./storage.ts";

/**
 * Main entry point for Pulumi infrastructure
 * Creates all AWS resources for Monitabits application
 *
 * Security features:
 * - AWS Secrets Manager for RDS credentials
 * - IAM roles for CI/CD (no access keys)
 * - Required secret validation
 * - No sensitive data in outputs
 */
const config = loadConfig();
const network = createNetwork(config);
const security = createSecurity(config, network);
const secrets = createSecrets(config);
const storage = createStorage(config);
const ciCd = createCiCd(config);
const data = createData(config, network, security, secrets);
const compute = createCompute({
	config,
	network,
	security,
	secrets,
	s3BucketName: storage.s3Bucket.bucket,
	ecrRepositoryUri: ciCd.ecrRepository.repositoryUrl,
});

// ============================================================================
// Stack Outputs
// ============================================================================
// Note: Sensitive outputs are NOT exported to prevent accidental exposure.
// Use AWS Console, CLI, or Secrets Manager to access sensitive values.
// ============================================================================

// Network outputs
export const vpcId: pulumi.Output<string> = network.vpc.id;
export const publicSubnetIds: pulumi.Output<string>[] = network.publicSubnets.map(
	(subnet) => subnet.id,
);
export const privateSubnetIds: pulumi.Output<string>[] = network.privateSubnets.map(
	(subnet) => subnet.id,
);

// Compute outputs
export const ec2InstanceId: pulumi.Output<string> = compute.ec2Instance.id;
export const ec2InstancePublicIp: pulumi.Output<string> = compute.ec2Instance.publicIp;
export const ec2InstancePrivateIp: pulumi.Output<string> = compute.ec2Instance.privateIp;
export const ec2IamRoleArn: pulumi.Output<string> = compute.iamRole.arn;

// Database outputs (non-sensitive)
export const rdsEndpoint: pulumi.Output<string> = data.rdsInstance.endpoint;
export const rdsPort: pulumi.Output<number> = data.rdsInstance.port;
export const rdsAddress: pulumi.Output<string> = data.rdsInstance.address;

// Storage outputs
export const s3BucketName: pulumi.Output<string> = storage.s3Bucket.bucket;
export const s3BucketArn: pulumi.Output<string> = storage.s3Bucket.arn;

// ECR outputs
export const ecrRepositoryUri: pulumi.Output<string> = ciCd.ecrRepository.repositoryUrl;
export const ecrRepositoryName: pulumi.Output<string> = ciCd.ecrRepository.name;

// CI/CD outputs (IAM Role ARN, not access keys)
export const ciCdRoleArn: pulumi.Output<string> = ciCd.ciCdRole.arn;

// Secrets Manager outputs (ARNs only, not values)
export const rdsSecretArn: pulumi.Output<string> = secrets.rdsSecret.arn;
export const rdsSecretName: pulumi.Output<string> = secrets.rdsSecret.name;

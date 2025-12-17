import * as aws from "@pulumi/aws";
import { type InfrastructureConfig, resourceName } from "./config.ts";

export interface StorageResources {
	readonly s3Bucket: aws.s3.Bucket;
	readonly s3BucketVersioning: aws.s3.BucketVersioning;
	readonly s3BucketPublicAccessBlock: aws.s3.BucketPublicAccessBlock;
	readonly s3BucketServerSideEncryption: aws.s3.BucketServerSideEncryptionConfiguration;
}

/**
 * Creates S3 bucket for application assets
 */
export const createStorage = (config: InfrastructureConfig): StorageResources => {
	const { storage, project } = config;

	const bucketName = `${project.name}-${project.environment}-assets-${storage.bucketSuffix}`;

	// Create S3 bucket
	const s3Bucket = new aws.s3.Bucket(resourceName(project, `s3-assets-${storage.bucketSuffix}`), {
		bucket: bucketName,
		tags: {
			Name: bucketName,
			Project: project.name,
			Environment: project.environment,
		},
	});

	// Enable versioning
	const s3BucketVersioning = new aws.s3.BucketVersioning(
		resourceName(project, `s3-assets-${storage.bucketSuffix}-versioning`),
		{
			bucket: s3Bucket.id,
			versioningConfiguration: {
				status: "Enabled",
			},
		},
	);

	// Block public access
	const s3BucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
		resourceName(project, `s3-assets-${storage.bucketSuffix}-public-block`),
		{
			bucket: s3Bucket.id,
			blockPublicAcls: true,
			blockPublicPolicy: true,
			ignorePublicAcls: true,
			restrictPublicBuckets: true,
		},
	);

	// Enable server-side encryption
	const s3BucketServerSideEncryption = new aws.s3.BucketServerSideEncryptionConfiguration(
		resourceName(project, `s3-assets-${storage.bucketSuffix}-encryption`),
		{
			bucket: s3Bucket.id,
			rules: [
				{
					applyServerSideEncryptionByDefault: {
						sseAlgorithm: "AES256",
					},
					bucketKeyEnabled: true,
				},
			],
		},
	);

	return {
		s3Bucket,
		s3BucketVersioning,
		s3BucketPublicAccessBlock,
		s3BucketServerSideEncryption,
	};
};

#!/usr/bin/env bun
import { $ } from "bun";
import { EntityCompose, EntityPackage } from "intershell/entities";

interface PulumiOutputs {
	ecrRepo: string;
	ec2InstanceId: string;
	rdsSecretName: string;
}

interface RdsSecret {
	host: string;
	port: string;
	dbname: string;
	username: string;
	password: string;
}

const INFRA_DIR = new URL(".", import.meta.url).pathname;
const ROOT_DIR = new URL("../../..", import.meta.url).pathname;

async function getPulumiOutputs(stack: string): Promise<PulumiOutputs> {
	console.log(`📦 Getting Pulumi stack outputs (${stack})...`);
	const ecrRepo = (
		await $`cd ${INFRA_DIR} && pulumi stack output ecrRepositoryUri -s ${stack} --show-secrets`.text()
	).trim();
	const ec2InstanceId = (
		await $`cd ${INFRA_DIR} && pulumi stack output ec2InstanceId -s ${stack} --show-secrets`.text()
	).trim();
	const rdsSecretName = (
		await $`cd ${INFRA_DIR} && pulumi stack output rdsSecretName -s ${stack} --show-secrets`.text()
	).trim();

	console.log(`  ECR Repository: ${ecrRepo}`);
	console.log(`  EC2 Instance ID: ${ec2InstanceId}`);
	console.log(`  RDS Secret Name: ${rdsSecretName}`);

	return { ecrRepo, ec2InstanceId, rdsSecretName };
}

async function buildAndPushImages(ecrRepo: string, imageTag: string): Promise<string[]> {
	console.log("🏗️ Building and pushing Docker images...");
	const builtServices: string[] = [];

	const compose = new EntityCompose(`${ROOT_DIR}/docker-compose.yml`);
	const services = await compose.getServices();

	for (const service of services) {
		try {
			new EntityPackage(service.name);
		} catch (error) {
			if (error instanceof Error) {
				console.error(`  Skipping ${service.name} (no package): ${error.message}`);
			} else {
				console.error(`  Skipping ${service.name} (no package): ${error}`);
			}
			console.error(`  Skipping ${service.name} (no package)`);
			continue;
		}

		const pkgEntity = new EntityPackage(service.name);
		const packageName = pkgEntity.getName();
		const packagePath = pkgEntity.getPath();
		const file = Bun.file(`${packagePath}/Dockerfile`);

		if (!(await file.exists())) {
			console.log(`  Skipping ${packageName} (no Dockerfile)`);
			continue;
		}

		const imageUri = `${ecrRepo}/${packageName}:${imageTag}`;
		const imageUriLatest = `${ecrRepo}/${packageName}:latest`;

		console.log(`  Building ${packageName}...`);
		await $`docker build -t ${imageUri} -t ${imageUriLatest} ${packagePath}`;
		await $`docker push ${imageUri}`;
		await $`docker push ${imageUriLatest}`;
		console.log(`  ✅ Pushed ${imageUri}`);
		builtServices.push(packageName);
	}

	return builtServices;
}

async function getRdsSecret(secretName: string, region: string): Promise<RdsSecret> {
	console.log("📋 Getting RDS connection details...");
	const secretJson =
		await $`aws secretsmanager get-secret-value --secret-id ${secretName} --region ${region} --query SecretString --output text`.text();
	return JSON.parse(secretJson);
}

function buildDatabaseUrl(rds: RdsSecret): string {
	return `postgresql://${rds.username}:${rds.password}@${rds.host}:${rds.port}/${rds.dbname}?schema=public`;
}

async function deployToEc2(
	ec2InstanceId: string,
	ecrRepo: string,
	rdsSecret: RdsSecret,
	region: string,
	imageTag: string,
): Promise<void> {
	console.log("🚀 Deploying to EC2...");

	if (!ec2InstanceId) {
		throw new Error("❌ EC2 Instance ID not found. Make sure infrastructure is deployed.");
	}

	// Wait for SSM agent
	console.log("⏳ Waiting for SSM agent to be ready...");
	await $`aws ssm wait instance-in-status --instance-ids ${ec2InstanceId} --status-type Online --region ${region}`.nothrow();

	// Read docker-compose.yml and base64 encode it
	const composeFile = await Bun.file(`${ROOT_DIR}/docker-compose.yml`).text();
	const composeBase64 = Buffer.from(composeFile).toString("base64");

	const databaseUrl = buildDatabaseUrl(rdsSecret);

	const commandsJson = JSON.stringify({
		commands: [
			// Set up environment
			`export ECR_REPO="${ecrRepo}"`,
			`export IMAGE_TAG="${imageTag}"`,
			`export DATABASE_URL="${databaseUrl}"`,
			`export AWS_REGION="${region}"`,

			// Login to ECR
			"aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPO",

			// Write docker-compose.yml
			"mkdir -p /opt/monitabits",
			"cd /opt/monitabits",
			`echo "${composeBase64}" | base64 -d > docker-compose.yml`,

			// Pull and deploy
			"docker-compose pull",
			"docker-compose up -d --remove-orphans",
			"docker-compose ps",
		],
	});

	console.log("🚀 Executing deployment on EC2 instance...");
	const commandId = (
		await $`aws ssm send-command --instance-ids ${ec2InstanceId} --document-name "AWS-RunShellScript" --cli-input-json ${commandsJson} --region ${region} --query "Command.CommandId" --output text`.text()
	).trim();

	console.log("⏳ Waiting for deployment to complete...");
	await $`aws ssm wait command-executed --command-id ${commandId} --instance-id ${ec2InstanceId} --region ${region}`;

	const output =
		await $`aws ssm get-command-invocation --command-id ${commandId} --instance-id ${ec2InstanceId} --region ${region}`.json();

	const status = output.Status;
	const exitCode = output.ResponseCode;

	console.log(`📋 Deployment Status: ${status} (Exit Code: ${exitCode})`);
	console.log(output.StandardOutputContent);

	if (status !== "Success" || exitCode !== 0) {
		console.error("❌ Deployment failed!");
		console.error(output.StandardErrorContent);
		process.exit(1);
	}

	console.log("✅ Deployment completed successfully!");
}

function parseArgs(): { env: string } {
	const args = process.argv.slice(2);
	let env = "dev";

	for (let i = 0; i < args.length; i++) {
		if (args[i] === "--env" && args[i + 1]) {
			env = args[i + 1];
		}
	}

	return { env };
}

async function main() {
	const { env } = parseArgs();
	const imageTag = process.env.IMAGE_TAG || process.env.GITHUB_SHA || "latest";
	const region = process.env.AWS_REGION || "us-east-1";
	const stack = process.env.PULUMI_STACK || env;

	try {
		const outputs = await getPulumiOutputs(stack);
		const builtServices = await buildAndPushImages(outputs.ecrRepo, imageTag);

		if (builtServices.length === 0) {
			console.log("📦 No services to deploy, skipping EC2 deployment");
			return;
		}

		const rdsSecret = await getRdsSecret(outputs.rdsSecretName, region);
		await deployToEc2(outputs.ec2InstanceId, outputs.ecrRepo, rdsSecret, region, imageTag);
	} catch (error) {
		if (error instanceof Error) {
			console.error("Error:", error.message, error.stack, error.cause);
		} else {
			console.error("Error:", error);
		}
		process.exit(1);
	}
}

await main();

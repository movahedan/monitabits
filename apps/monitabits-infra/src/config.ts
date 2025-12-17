import * as pulumi from "@pulumi/pulumi";

export interface ProjectConfig {
	readonly name: string;
	readonly environment: string;
}
export interface StorageConfig {
	readonly bucketSuffix: string;
}

export interface NetworkConfig {
	readonly vpcCidr: string;
	readonly publicSubnetCidrs: string[];
	readonly privateSubnetCidrs: string[];
	readonly availabilityZones: string[];
}

export interface RdsConfig {
	readonly instanceClass: string;
	readonly allocatedStorage: number;
	readonly backupRetentionDays: number;
	readonly multiAz: boolean;
	readonly password: pulumi.Output<string>;
}

export interface ComputeConfig {
	readonly instanceType: string;
	readonly diskSize: number;
	readonly allowedSshCidrs: string[];
}

export interface InfrastructureConfig {
	readonly project: ProjectConfig;
	readonly storage: StorageConfig;
	readonly network: NetworkConfig;
	readonly rds: RdsConfig;
	readonly compute: ComputeConfig;
}

interface Validators {
	readonly validateSshCidrs: (cidrs: string[]) => void;
	readonly validateVpcCidr: (cidr: string) => void;
	readonly validateSubnetCidrs: (cidrs: string[], type: "public" | "private") => void;
	readonly validateRdsConfig: (env: string, multiAz: boolean, backupRetention: number) => void;
	readonly tools: {
		readonly isValidCidr: (cidr: string) => boolean;
		readonly isValidIpv4: (ip: string) => boolean;
		readonly getEnvironmentRules: (environment: string) => {
			readonly requireMultiAz: boolean;
			readonly minBackupRetention: number;
			readonly allowSkipFinalSnapshot: boolean;
		};
	};
}

export const resourceName = (config: ProjectConfig, suffix: string): string => {
	return `${config.name}-${config.environment}-${suffix}`;
};

export const loadConfig = (): InfrastructureConfig => {
	// Access config by namespace - YAML has keys like "project:environment", "vpc:cidr", etc.
	// Use the namespace part (before colon) when creating Config, then access key part (after colon)
	const projectConfig = new pulumi.Config("project");
	const vpcConfig = new pulumi.Config("vpc");
	const computeConfig = new pulumi.Config("compute");
	const rdsConfig = new pulumi.Config("rds");
	const s3Config = new pulumi.Config("s3");

	const project: ProjectConfig = {
		name: projectConfig.get("name") ?? "monitabits",
		environment: projectConfig.require("environment"),
	};

	const storage: StorageConfig = {
		bucketSuffix: s3Config.require("bucketSuffix"),
	};

	const network: NetworkConfig = {
		vpcCidr: vpcConfig.require("cidr"),
		publicSubnetCidrs: vpcConfig.requireObject<string[]>("publicSubnetCidrs"),
		privateSubnetCidrs: vpcConfig.requireObject<string[]>("privateSubnetCidrs"),
		availabilityZones: vpcConfig.getObject<string[]>("availabilityZones") ?? [],
	};
	validators.validateVpcCidr(network.vpcCidr);
	validators.validateSubnetCidrs(network.publicSubnetCidrs, "public");
	validators.validateSubnetCidrs(network.privateSubnetCidrs, "private");

	const compute: ComputeConfig = {
		instanceType: computeConfig.get("instanceType") ?? "t3.medium",
		diskSize: computeConfig.getNumber("diskSize") ?? 20,
		allowedSshCidrs: computeConfig.requireObject<string[]>("allowedSshCidrs"),
	};
	validators.validateSshCidrs(compute.allowedSshCidrs);

	const rds: RdsConfig = {
		instanceClass: rdsConfig.get("instanceClass") ?? "db.t3.micro",
		allocatedStorage: rdsConfig.getNumber("allocatedStorage") ?? 20,
		backupRetentionDays: rdsConfig.getNumber("backupRetentionDays") ?? 7,
		multiAz: rdsConfig.getBoolean("multiAz") ?? project.environment === "prod",
		password: rdsConfig.requireSecret("password"), // MUST be set as a secret, no fallback
	};
	validators.validateRdsConfig(project.environment, rds.multiAz, rds.backupRetentionDays);

	return {
		project,
		network,
		rds,
		storage,
		compute,
	};
};

const validators: Validators = {
	/**
	 * Validates an array of SSH CIDR blocks for security
	 * - Must not include 0.0.0.0/0
	 * - Must be valid CIDR notation
	 * @param cidrs - Array of CIDR strings
	 * @throws Error if validation fails
	 */
	validateSshCidrs: (cidrs: string[]): void => {
		if (cidrs.length === 0) {
			throw new Error("Security: compute:allowedSshCidrs must contain at least one CIDR block.");
		}

		for (const cidr of cidrs) {
			if (!validators.tools.isValidCidr(cidr)) {
				throw new Error(
					`Security: Invalid CIDR notation "${cidr}". Expected format: "x.x.x.x/y" (e.g., "10.0.0.0/16").`,
				);
			}

			// Checks if the CIDR represents "open to the world" (0.0.0.0/0)
			if (cidr === "0.0.0.0/0") {
				throw new Error(
					"Security: compute:allowedSshCidrs must not include 0.0.0.0/0. " +
						"Configure specific CIDR blocks for SSH access.",
				);
			}
		}
	},

	/**
	 * Validates VPC CIDR block
	 * @param cidr - VPC CIDR string
	 * @throws Error if validation fails
	 */
	validateVpcCidr: (cidr: string): void => {
		if (!validators.tools.isValidCidr(cidr)) {
			throw new Error(
				`Security: Invalid VPC CIDR notation "${cidr}". Expected format: "x.x.x.x/y" (e.g., "10.0.0.0/16").`,
			);
		}

		// Check for reasonable VPC CIDR ranges (/16 to /28)
		const prefix = Number.parseInt(cidr.split("/")[1], 10);
		if (prefix < 16 || prefix > 28) {
			throw new Error(
				`Security: VPC CIDR prefix /${prefix} is outside recommended range. Use /16 to /28.`,
			);
		}
	},

	/**
	 * Validates subnet CIDR blocks
	 * @param cidrs - Array of subnet CIDR strings
	 * @param type - Type of subnet (public/private) for error messages
	 * @throws Error if validation fails
	 */
	validateSubnetCidrs: (cidrs: string[], type: "public" | "private"): void => {
		if (cidrs.length === 0) {
			throw new Error(`Security: At least one ${type} subnet CIDR is required.`);
		}

		for (const cidr of cidrs) {
			if (!validators.tools.isValidCidr(cidr)) {
				throw new Error(
					`Security: Invalid ${type} subnet CIDR notation "${cidr}". Expected format: "x.x.x.x/y".`,
				);
			}
		}
	},

	/**
	 * Validates environment-specific RDS configuration
	 * @param environment - Environment name
	 * @param multiAz - Multi-AZ setting
	 * @param backupRetention - Backup retention days
	 */
	validateRdsConfig: (environment: string, multiAz: boolean, backupRetention: number): void => {
		const rules = validators.tools.getEnvironmentRules(environment);

		if (rules.requireMultiAz && !multiAz) {
			console.warn(
				`Warning: Multi-AZ is recommended for ${environment} environment but is disabled.`,
			);
		}

		if (backupRetention < rules.minBackupRetention) {
			throw new Error(
				`Security: Backup retention for ${environment} must be at least ${rules.minBackupRetention} days, got ${backupRetention}.`,
			);
		}
	},

	tools: {
		/**
		 * Validates an IPv4 CIDR notation string
		 * @param cidr - CIDR string (e.g., "10.0.0.0/16", "192.168.1.0/24")
		 * @returns true if valid CIDR notation
		 */
		isValidCidr: (cidr: string): boolean => {
			const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/(\d|[1-2]\d|3[0-2])$/;
			if (!cidrRegex.test(cidr)) {
				return false;
			}

			const [ip, prefixStr] = cidr.split("/");
			const prefix = Number.parseInt(prefixStr, 10);

			// Validate prefix length
			if (prefix < 0 || prefix > 32) {
				return false;
			}

			// Validate IP octets
			const octets = ip.split(".").map((o) => Number.parseInt(o, 10));
			return octets.every((octet) => octet >= 0 && octet <= 255);
		},

		/**
		 * Validates an IPv4 address
		 * @param ip - IP address string (e.g., "192.168.1.1")
		 * @returns true if valid IPv4 address
		 */
		isValidIpv4: (ip: string): boolean => {
			const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
			if (!ipRegex.test(ip)) {
				return false;
			}

			const octets = ip.split(".").map((o) => Number.parseInt(o, 10));
			return octets.every((octet) => octet >= 0 && octet <= 255);
		},

		/**
		 * Gets validation rules based on environment
		 * @param environment - Environment name (dev, stg, prod)
		 * @returns Validation rules for the environment
		 */
		getEnvironmentRules: (environment: string) => {
			switch (environment) {
				case "prod":
					return {
						requireMultiAz: true,
						minBackupRetention: 14,
						allowSkipFinalSnapshot: false,
					};
				case "stg":
					return {
						requireMultiAz: false,
						minBackupRetention: 7,
						allowSkipFinalSnapshot: true,
					};
				default: // dev and others
					return {
						requireMultiAz: false,
						minBackupRetention: 1,
						allowSkipFinalSnapshot: true,
					};
			}
		},
	},
};

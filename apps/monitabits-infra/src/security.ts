import * as aws from "@pulumi/aws";
import { type InfrastructureConfig, resourceName } from "./config.ts";
import type { NetworkResources } from "./network.ts";

export interface SecurityResources {
	readonly appSecurityGroup: aws.ec2.SecurityGroup;
	readonly dbSecurityGroup: aws.ec2.SecurityGroup;
}

/**
 * Creates security groups and network ACLs
 */
export const createSecurity = (
	config: InfrastructureConfig,
	network: NetworkResources,
): SecurityResources => {
	const { compute, project } = config;

	// App Security Group
	const appSecurityGroup = new aws.ec2.SecurityGroup(resourceName(project, "sg-app"), {
		name: resourceName(project, "sg-app"),
		description: "Security group for application EC2 instance",
		vpcId: network.vpc.id,
		ingress: [
			{
				description: "HTTP from internet",
				protocol: "tcp",
				fromPort: 80,
				toPort: 80,
				cidrBlocks: ["0.0.0.0/0"],
			},
			{
				description: "HTTPS from internet",
				protocol: "tcp",
				fromPort: 443,
				toPort: 443,
				cidrBlocks: ["0.0.0.0/0"],
			},
			{
				description: "SSH from allowed CIDRs",
				protocol: "tcp",
				fromPort: 22,
				toPort: 22,
				cidrBlocks: compute.allowedSshCidrs,
			},
		],
		egress: [
			{
				description: "Allow all outbound traffic",
				protocol: "-1",
				fromPort: 0,
				toPort: 0,
				cidrBlocks: ["0.0.0.0/0"],
			},
		],
		tags: {
			Name: resourceName(project, "sg-app"),
			Project: project.name,
			Environment: project.environment,
			Type: "application",
		},
	});

	// Database Security Group
	const dbSecurityGroup = new aws.ec2.SecurityGroup(resourceName(project, "sg-db"), {
		name: resourceName(project, "sg-db"),
		description: "Security group for RDS PostgreSQL database",
		vpcId: network.vpc.id,
		ingress: [
			{
				description: "PostgreSQL from app security group",
				protocol: "tcp",
				fromPort: 5432,
				toPort: 5432,
				securityGroups: [appSecurityGroup.id],
			},
		],
		egress: [
			{
				description: "Allow all outbound traffic",
				protocol: "-1",
				fromPort: 0,
				toPort: 0,
				cidrBlocks: ["0.0.0.0/0"],
			},
		],
		tags: {
			Name: resourceName(project, "sg-db"),
			Project: project.name,
			Environment: project.environment,
			Type: "database",
		},
	});

	// Create simplified NACLs (permissive for v1)
	// Default NACLs are already permissive, but we create custom ones for future tightening
	const publicNacl = new aws.ec2.NetworkAcl(resourceName(project, "nacl-public"), {
		vpcId: network.vpc.id,
		ingress: [
			{
				protocol: "-1",
				ruleNo: 100,
				action: "allow",
				cidrBlock: "0.0.0.0/0",
				fromPort: 0,
				toPort: 0,
			},
		],
		egress: [
			{
				protocol: "-1",
				ruleNo: 100,
				action: "allow",
				cidrBlock: "0.0.0.0/0",
				fromPort: 0,
				toPort: 0,
			},
		],
		tags: {
			Name: resourceName(project, "nacl-public"),
			Project: project.name,
			Environment: project.environment,
		},
	});

	const privateNacl = new aws.ec2.NetworkAcl(resourceName(project, "nacl-private"), {
		vpcId: network.vpc.id,
		ingress: [
			{
				protocol: "-1",
				ruleNo: 100,
				action: "allow",
				cidrBlock: "0.0.0.0/0",
				fromPort: 0,
				toPort: 0,
			},
		],
		egress: [
			{
				protocol: "-1",
				ruleNo: 100,
				action: "allow",
				cidrBlock: "0.0.0.0/0",
				fromPort: 0,
				toPort: 0,
			},
		],
		tags: {
			Name: resourceName(project, "nacl-private"),
			Project: project.name,
			Environment: project.environment,
		},
	});

	// Associate NACLs with subnets
	network.publicSubnets.forEach((subnet: aws.ec2.Subnet, index: number) => {
		new aws.ec2.NetworkAclAssociation(resourceName(project, `nacl-assoc-public-${index}`), {
			networkAclId: publicNacl.id,
			subnetId: subnet.id,
		});
	});

	network.privateSubnets.forEach((subnet: aws.ec2.Subnet, index: number) => {
		new aws.ec2.NetworkAclAssociation(resourceName(project, `nacl-assoc-private-${index}`), {
			networkAclId: privateNacl.id,
			subnetId: subnet.id,
		});
	});

	return {
		appSecurityGroup,
		dbSecurityGroup,
	};
};

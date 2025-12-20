import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { type InfrastructureConfig, resourceName } from "./config.ts";

export interface NetworkResources {
	readonly vpc: aws.ec2.Vpc;
	readonly internetGateway: aws.ec2.InternetGateway;
	readonly publicSubnets: aws.ec2.Subnet[];
	readonly privateSubnets: aws.ec2.Subnet[];
	readonly natGateway: aws.ec2.NatGateway;
	readonly elasticIp: aws.ec2.Eip;
	readonly publicRouteTable: aws.ec2.RouteTable;
	readonly privateRouteTable: aws.ec2.RouteTable;
}

/**
 * Creates VPC, subnets, Internet Gateway, NAT Gateway, and route tables
 */
export const createNetwork = (config: InfrastructureConfig): NetworkResources => {
	const { network, project } = config;

	// Get availability zones as Output
	const availabilityZonesOutput: pulumi.Output<string[]> =
		network.availabilityZones.length > 0
			? pulumi.output(network.availabilityZones)
			: pulumi
					.output(aws.getAvailabilityZones({ state: "available" }))
					.apply((zones) => zones.names.slice(0, 2));

	// Create VPC
	const vpc = new aws.ec2.Vpc(resourceName(project, "vpc"), {
		cidrBlock: network.vpcCidr,
		enableDnsHostnames: true,
		enableDnsSupport: true,
		tags: {
			Name: resourceName(project, "vpc"),
			Project: project.name,
			Environment: project.environment,
		},
	});

	// Create Internet Gateway
	const internetGateway = new aws.ec2.InternetGateway(resourceName(project, "igw"), {
		vpcId: vpc.id,
		tags: {
			Name: resourceName(project, "igw"),
			Project: project.name,
			Environment: project.environment,
		},
	});

	// Create public subnets
	const publicSubnets: aws.ec2.Subnet[] = network.publicSubnetCidrs.map((cidr, index) => {
		const azSuffix = index === 0 ? "a" : "b"; // Default AZ suffixes
		return new aws.ec2.Subnet(resourceName(project, `subnet-public-${azSuffix}`), {
			vpcId: vpc.id,
			cidrBlock: cidr,
			availabilityZone: availabilityZonesOutput.apply((azs) => azs[index] ?? azs[0]),
			mapPublicIpOnLaunch: true,
			tags: {
				Name: resourceName(project, `subnet-public-${azSuffix}`),
				Project: project.name,
				Environment: project.environment,
				Type: "public",
			},
		});
	});

	// Create Elastic IP for NAT Gateway
	const elasticIp = new aws.ec2.Eip(resourceName(project, "nat-eip"), {
		domain: "vpc",
		tags: {
			Name: resourceName(project, "nat-eip"),
			Project: project.name,
			Environment: project.environment,
		},
	});

	// Create NAT Gateway in first public subnet
	const natGateway = new aws.ec2.NatGateway(
		resourceName(project, "nat-gw"),
		{
			allocationId: elasticIp.id,
			subnetId: publicSubnets[0].id,
			tags: {
				Name: resourceName(project, "nat-gw"),
				Project: project.name,
				Environment: project.environment,
			},
		},
		{
			dependsOn: [internetGateway],
		},
	);

	// Create public route table
	const publicRouteTable = new aws.ec2.RouteTable(resourceName(project, "rt-public"), {
		vpcId: vpc.id,
		routes: [
			{
				cidrBlock: "0.0.0.0/0",
				gatewayId: internetGateway.id,
			},
		],
		tags: {
			Name: resourceName(project, "rt-public"),
			Project: project.name,
			Environment: project.environment,
		},
	});

	// Associate public subnets with public route table
	publicSubnets.forEach((subnet, index) => {
		new aws.ec2.RouteTableAssociation(resourceName(project, `rta-public-${index}`), {
			subnetId: subnet.id,
			routeTableId: publicRouteTable.id,
		});
	});

	// Create private subnets
	const privateSubnets: aws.ec2.Subnet[] = network.privateSubnetCidrs.map((cidr, index) => {
		const azSuffix = index === 0 ? "a" : "b"; // Default AZ suffixes
		return new aws.ec2.Subnet(resourceName(project, `subnet-private-${azSuffix}`), {
			vpcId: vpc.id,
			cidrBlock: cidr,
			availabilityZone: availabilityZonesOutput.apply((azs) => azs[index] ?? azs[0]),
			tags: {
				Name: resourceName(project, `subnet-private-${azSuffix}`),
				Project: project.name,
				Environment: project.environment,
				Type: "private",
			},
		});
	});

	// Create private route table
	const privateRouteTable = new aws.ec2.RouteTable(resourceName(project, "rt-private"), {
		vpcId: vpc.id,
		routes: [
			{
				cidrBlock: "0.0.0.0/0",
				natGatewayId: natGateway.id,
			},
		],
		tags: {
			Name: resourceName(project, "rt-private"),
			Project: project.name,
			Environment: project.environment,
		},
	});

	// Associate private subnets with private route table
	privateSubnets.forEach((subnet, index) => {
		new aws.ec2.RouteTableAssociation(resourceName(project, `rta-private-${index}`), {
			subnetId: subnet.id,
			routeTableId: privateRouteTable.id,
		});
	});

	return {
		vpc,
		internetGateway,
		publicSubnets,
		privateSubnets,
		natGateway,
		elasticIp,
		publicRouteTable,
		privateRouteTable,
	};
};

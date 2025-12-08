import { Injectable, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
	constructor() {
		const adapter = new PrismaPg({
			connectionString: process.env.DATABASE_URL,
		});
		super({ adapter });
	}

	async onModuleInit(): Promise<void> {
		// Skip connection during OpenAPI generation (when DATABASE_URL points to dummy)
		if (process.env.DATABASE_URL?.includes("dummy")) {
			return;
		}
		try {
			await this.$connect();
		} catch (error) {
			// Silently fail if database is not available (e.g., during OpenAPI generation)
			if (process.env.NODE_ENV !== "production") {
				console.warn(
					"Prisma connection skipped:",
					error instanceof Error ? error.message : String(error),
				);
			}
		}
	}

	async onModuleDestroy(): Promise<void> {
		try {
			await this.$disconnect();
		} catch (_error) {
			// Ignore disconnection errors
		}
	}
}

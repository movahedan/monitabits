#!/usr/bin/env bun

import { existsSync } from "node:fs";
import { join } from "node:path";
import { $ } from "bun";

async function main(): Promise<void> {
	console.log("Running database migrations...");

	const prismaDir = "/app/apps/monitabits-api";
	const migrationsDir = join(prismaDir, "prisma/migrations");

	if (existsSync(migrationsDir)) {
		try {
			await $`cd ${prismaDir} && bunx --bun prisma migrate deploy`.quiet();
			console.log("Migrations applied successfully");
		} catch (error) {
			console.error("Migration failed:", error);
			process.exit(1);
		}
	} else {
		console.warn("Warning: No migrations directory found. Skipping migrations.");
	}

	console.log("Starting application...");
	await $`bun run /app/apps/monitabits-api/dist/index.js`.quiet();
}

main().catch((error) => {
	console.error("Entrypoint failed:", error);
	process.exit(1);
});

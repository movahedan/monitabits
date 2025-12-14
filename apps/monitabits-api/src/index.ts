import "reflect-metadata";
import { type NestApplication, NestFactory } from "@nestjs/core";
import { logger } from "@repo/utils/logger";
import type { Request, Response } from "express";
import { AppModule } from "./app.module";
import { swaggerSetup } from "./swagger.setup";

async function bootstrap(): Promise<void> {
	const app = await NestFactory.create<NestApplication>(AppModule, { logger });

	// Alias endpoint for infra/health checks that hit `/status` (without global `/api` prefix).
	// The canonical, documented endpoint remains: GET `/api/status`.
	const server = app.getHttpAdapter().getInstance();

	server.get("/status", (_req: Request, res: Response) => {
		res.status(200).json({
			success: true,
			data: { ok: true },
			timestamp: new Date().toISOString(),
		});
	});

	app.enableCors({
		origin: process.env.ALLOWED_ORIGINS?.split(",") || [
			"http://localhost:3002",
			"http://localhost:3005",
		],
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
		allowedHeaders: [
			"Content-Type",
			"Authorization",
			"X-Device-Id",
			"X-Client-Time",
			"X-Timezone-Offset",
			"X-Timezone-Name",
		],
	});

	app.setGlobalPrefix("api");

	// Always set up Swagger (serves /api-docs and /api-docs-json)
	// File generation and Kubb only run in development (handled in swaggerSetup)
	await swaggerSetup(app);

	const host = process.env.HOST || "localhost";
	const port = process.env.PORT ? Number(process.env.PORT) : 3003;

	await app.listen(port, host);
	logger.info(`API running on ${host}:${port}`);
}

bootstrap().catch((error) => {
	console.error("Failed to start server:", error);
	process.exit(1);
});

import "reflect-metadata";
import { type NestApplication, NestFactory } from "@nestjs/core";
import { log } from "@repo/utils/logger";
import { AppModule } from "./app.module";
import { swaggerSetup } from "./swagger.setup";

async function bootstrap(): Promise<void> {
	const app = await NestFactory.create<NestApplication>(AppModule);

	app.enableCors({
		origin: process.env.ALLOWED_ORIGINS?.split(",") || [
			"http://localhost:3000",
			"http://localhost:3001",
			"http://localhost:3002",
			"http://localhost:3003",
			"http://localhost:3004",
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

	const isDev = process.env.NODE_ENV === "development";
	const host = process.env.HOST || "localhost";
	const port = process.env.PORT ? Number(process.env.PORT) : 3003;

	if (isDev) {
		await swaggerSetup(app);
	}
	await app.listen(port, host);
	log(`API running on ${host}:${port}`);
	console.log(`API running on ${host}:${port}`);
}

bootstrap().catch((error) => {
	console.error("Failed to start server:", error);
	process.exit(1);
});

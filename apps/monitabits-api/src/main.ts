import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { log } from "@repo/utils/logger";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
	const app = await NestFactory.create(AppModule);

	const host = process.env.HOST || "localhost";
	const port = process.env.PORT ? Number(process.env.PORT) : 3003;

	await app.listen(port, host);
	log(`API running on ${host}:${port}`);
	console.log(`API running on ${port}`);
}

bootstrap().catch((error) => {
	console.error("Failed to start server:", error);
	process.exit(1);
});

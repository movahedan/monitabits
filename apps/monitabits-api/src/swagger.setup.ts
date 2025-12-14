import { spawn } from "node:child_process";
import { resolve } from "node:path";
import type { NestApplication } from "@nestjs/core";
import { DocumentBuilder, type OpenAPIObject, SwaggerModule } from "@nestjs/swagger";
import { logger } from "@repo/utils/logger";
import { BaseDto } from "./common/models/dto.model";
import * as ResponseModels from "./common/models/response.model";
import * as SettingsModels from "./settings/settings.model";
import * as StatisticsModels from "./statistics/statistics.model";
import * as TimerModels from "./timer/timer.model";

const isDevelopment = process.env.NODE_ENV === "development";

const customSiteTitle = "Monitabits Pomodoro Timer API";
const allDtoModules = [ResponseModels, SettingsModels, StatisticsModels, TimerModels] as const;

type AnyConstructor = new (...args: Array<unknown>) => unknown;
function isDtoClass(value: unknown): value is AnyConstructor {
	if (typeof value !== "function") return false;
	if (!(value.prototype instanceof BaseDto)) return false;
	// Must have Swagger/OpenAPI metadata generated from @ApiProperty decorators
	return Object.hasOwn(value, "_OPENAPI_METADATA_FACTORY");
}

export async function swaggerSetup(app: NestApplication): Promise<OpenAPIObject> {
	const extraModels = allDtoModules.flatMap((m) => Object.values(m)).filter(isDtoClass);
	const document = SwaggerModule.createDocument(app, swaggerConfig, { extraModels });
	// Setup at `/api/docs` and `/api/docs-json` so it's under the global `/api` prefix
	SwaggerModule.setup("api/docs", app, document, { customSiteTitle });

	isDevelopment &&
		(await generateSwaggerFile(document)
			.then(() => logger.info("[swagger] ✅ openapi.yaml generated"))
			.then(() => generateKubbPackage())
			.then(() => logger.info("[swagger] ✅ Kubb generation complete"))
			.catch((error) => logger.error(`[swagger] ❌ Failed to generate Swagger: ${error}`)));

	return document;
}

const KUBB_PACKAGE_PATH = resolve(process.cwd(), "../../packages/monitabits-kubb");
const OPENAPI_YAML_PATH = resolve(KUBB_PACKAGE_PATH, "src/openapi.yaml");
async function generateSwaggerFile(document: OpenAPIObject): Promise<void> {
	const currentContent = await Bun.file(OPENAPI_YAML_PATH).text();
	if (currentContent.trim() === Bun.YAML.stringify(document, null, 2).trim()) return;
	await Bun.write(OPENAPI_YAML_PATH, Bun.YAML.stringify(document, null, 2));
}

async function generateKubbPackage(): Promise<void> {
	return new Promise((resolve, reject) => {
		const kubb = spawn("bun", ["run", "kubb"], { cwd: KUBB_PACKAGE_PATH, stdio: "inherit" });
		kubb.on("close", (code: number) => (code === 0 ? resolve() : reject(code)));
		kubb.on("error", (error: Error) => reject(error));
	});
}

const swaggerConfig = new DocumentBuilder()
	.setTitle(customSiteTitle)
	.setDescription(
		`API for the Pomodoro timer application.

This API uses device-based authentication where each device has a unique ID.
Each device can manage its own Pomodoro timer sessions and track completed work sessions.

**Security**: All requests must include device ID header for authentication.`,
	)
	.setVersion("1.0.0")
	.addApiKey(
		{
			type: "apiKey",
			in: "header",
			name: "X-Device-Id",
			description: "Device ID for authentication",
		},
		"DeviceAuth",
	)
	.addServer("http://localhost:3003", "Development server")
	.addServer("https://api.monitabits.com", "Production server")
	.addTag("Timer", "Pomodoro timer management (start, pause, resume, reset)")
	.addTag("Settings", "Timer duration settings (work, short break, long break)")
	.addTag("Statistics", "Completed Pomodoro session statistics")
	.build();

import { spawn } from "node:child_process";
import { resolve } from "node:path";
import type { NestApplication } from "@nestjs/core";
import { DocumentBuilder, type OpenAPIObject, SwaggerModule } from "@nestjs/swagger";
import { logger } from "@repo/utils/logger";
import * as ActionModels from "./actions/action.model";
import { BaseDto } from "./common/models/dto.model";
import * as ResponseModels from "./common/models/response.model";
import * as SessionModels from "./sessions/session.model";
import * as SettingsModels from "./settings/settings.model";
import * as StatisticsModels from "./statistics/statistics.model";

const isDevelopment = process.env.NODE_ENV === "development";

const customSiteTitle = "Monitabits Quit Smoking API";
const allDtoModules = [
	ActionModels,
	ResponseModels,
	SessionModels,
	SettingsModels,
	StatisticsModels,
] as const;

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
		`API for the cigarette quitting accountability application.

This API uses device-based authentication where each device has a unique ID.
All time-sensitive operations are validated server-side to prevent cheating.

**Security**: All requests must include time validation headers to prevent time manipulation.
The server handles all timezone calculations internally based on the user's request context.`,
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
	.addApiKey(
		{
			type: "apiKey",
			in: "header",
			name: "X-Client-Time",
			description: "Client-reported timestamp (ISO-8601)",
		},
		"TimeValidation",
	)
	.addServer("http://localhost:3003", "Development server")
	.addServer("https://api.monitabits.com", "Production server")
	.addTag("Sessions", "Session management and check-ins")
	.addTag("Actions", "User actions (cheat, harm, follow-up)")
	.addTag("Settings", "User settings management")
	.addTag("Statistics", "User statistics and progress")
	.build();

import { spawn } from "node:child_process";
import { resolve } from "node:path";
import type { NestApplication } from "@nestjs/core";
import { DocumentBuilder, type OpenAPIObject, SwaggerModule } from "@nestjs/swagger";
import * as ActionModels from "./actions/action.model";
import * as ResponseModels from "./common/models/response.model";
import * as SessionModels from "./sessions/session.model";
import * as SettingsModels from "./settings/settings.model";
import * as StatisticsModels from "./statistics/statistics.model";

const allDtoModules = [
	ActionModels,
	ResponseModels,
	SessionModels,
	SettingsModels,
	StatisticsModels,
] as const;

function extractDtoClasses(): Array<new () => unknown> {
	const dtoClasses: Array<new () => unknown> = [];

	for (const module of allDtoModules) {
		for (const [name, exportValue] of Object.entries(module)) {
			if (
				typeof exportValue === "function" &&
				"_OPENAPI_METADATA_FACTORY" in exportValue &&
				name.endsWith("Dto")
			) {
				dtoClasses.push(exportValue as new () => unknown);
			}
		}
	}

	return dtoClasses;
}

export async function swaggerSetup(app: NestApplication): Promise<OpenAPIObject> {
	const extraModels = extractDtoClasses();

	const document = SwaggerModule.createDocument(app, config, {
		extraModels,
	});

	SwaggerModule.setup("api-docs", app, document, {
		customSiteTitle: "Monitabits API Documentation",
	});

	if (process.env.NODE_ENV === "development") {
		await generateSchema(document);
	}

	return document;
}

const KUBB_PACKAGE_PATH = resolve(process.cwd(), "../../packages/monitabits-kubb");
const OPENAPI_YAML_PATH = resolve(KUBB_PACKAGE_PATH, "src/openapi.yaml");

const generateSchema = async (document: OpenAPIObject): Promise<void> => {
	try {
		await Bun.write(OPENAPI_YAML_PATH, Bun.YAML.stringify(document, null, 2));
		console.log("[swagger] ✅ openapi.yaml generated");
		runKubb();
	} catch (error) {
		console.error("[swagger] ❌ Failed to write openapi.yaml:", error);
	}
};

const runKubb = (): void => {
	const kubb = spawn("bun", ["run", "kubb"], {
		cwd: KUBB_PACKAGE_PATH,
		stdio: "inherit",
	});

	kubb.on("close", (code) => {
		if (code === 0) {
			console.log("[swagger] ✅ Kubb generation complete");
		} else {
			console.error(`[swagger] ❌ Kubb failed with code ${code}`);
		}
	});

	kubb.on("error", (error) => {
		console.error("[swagger] ❌ Failed to run Kubb:", error);
	});
};

const config = new DocumentBuilder()
	.setTitle("Monitabits Quit Smoking API")
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

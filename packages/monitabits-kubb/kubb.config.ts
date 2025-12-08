import { defineConfig } from "@kubb/core";
import { pluginClient } from "@kubb/plugin-client";
import { pluginOas } from "@kubb/plugin-oas";
import { pluginSwr } from "@kubb/plugin-swr";
import { pluginTs } from "@kubb/plugin-ts";
import { pluginZod } from "@kubb/plugin-zod";

// https://kubb.dev/getting-started/configure
const config: ReturnType<typeof defineConfig> = defineConfig({
	input: { path: "./src/openapi.yaml" },
	output: {
		path: "./src/gen",
		clean: true,
		lint: "biome",
		format: "biome",
		barrelType: false,
		extension: { ".ts": "" },
	},
	plugins: [
		pluginOas(),
		pluginTs({ output: { path: "./types" } }),
		pluginZod({
			output: { path: "./zod" },
			group: { type: "tag" },
		}),
		pluginClient({
			output: { path: "./server" },
			importPath: "../../mutator.server",
			client: "fetch",
			dataReturnType: "data",
		}),
		pluginSwr({
			output: { path: "./hooks" },
			group: { type: "tag" },
			client: {
				importPath: "../../../mutator.client",
				dataReturnType: "data",
			},
			parser: "client",
		}),
	],
});

export default config;

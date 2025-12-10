import { esbuildDecorators } from "@anatine/esbuild-decorators";
import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["esm"],
	target: "es2022",
	outDir: "dist",
	clean: true,
	sourcemap: true,
	splitting: false,
	bundle: true,
	treeshake: true,
	platform: "node",
	// Bundle all workspace packages to include their code and environment variable access
	noExternal: [/^@repo\//],
	esbuildPlugins: [esbuildDecorators({ tsconfig: "./tsconfig.json" })],
	esbuildOptions(options) {
		options.keepNames = true;
		options.platform = "node";
		// Preserve environment variable access
		options.define = {
			"process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"),
		};
	},
	external: [
		"@nestjs/core",
		"@nestjs/common",
		"@nestjs/platform-express",
		"reflect-metadata",
		"rxjs",
		"@prisma/client",
		"dotenv",
	],
});

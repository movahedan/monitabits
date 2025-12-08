import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react()],
	root: "src",
	publicDir: false,
	server: {
		port: Number(process.env.PORT) || 3005,
		host: process.env.HOST || "localhost",
	},
	build: {
		outDir: resolve(__dirname, "dist"),
		sourcemap: true,
		emptyOutDir: true,
		rollupOptions: {
			input: resolve(__dirname, "src/index.html"),
		},
	},
	assetsInclude: ["**/*.yaml", "**/*.yml"],
});

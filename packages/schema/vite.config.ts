import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react()],
	server: {
		port: Number(process.env.PORT) || 3005,
		host: process.env.HOST || "localhost",
	},
	build: {
		outDir: "dist",
		sourcemap: true,
	},
	assetsInclude: ["**/*.yaml", "**/*.yml"],
});

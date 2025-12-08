import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	typescript: {
		ignoreBuildErrors: true,
	},

	// Turbopack is the default bundler in Next.js 16
	turbopack: {},

	// Webpack config for Docker development with polling (use with `next dev --webpack`)
	webpack: (
		config: { watchOptions: { poll: number; aggregateTimeout: number } },
		{ dev }: { dev: boolean },
	) => {
		if (dev) {
			config.watchOptions = {
				poll: 1000,
				aggregateTimeout: 300,
			};
		}
		return config;
	},
};

export default nextConfig;

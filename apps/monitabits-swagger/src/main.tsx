import "./swagger-ui.css";
import "swagger-ui-react/swagger-ui.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import SwaggerUI from "swagger-ui-react";
import localOpenApiSpec from "../../../packages/monitabits-kubb/src/openapi.yaml?url";

/**
 * Get the OpenAPI spec URL based on environment.
 * In production, use VITE_API_URL to fetch from API server.
 * In development, use the local YAML file.
 */
const getOpenApiSpecUrl = (): string => {
	const apiUrl = import.meta.env.VITE_API_URL;
	if (apiUrl) {
		// Production: fetch from API server (NestJS serves JSON at /api-docs-json)
		return `${apiUrl}/api-docs-json`;
	}
	// Development: use local YAML file
	return localOpenApiSpec;
};

const root = document.getElementById("root");
if (!root) {
	throw new Error("Root element not found");
}

createRoot(root).render(
	<StrictMode>
		<div className="swagger-container">
			<SwaggerUI url={getOpenApiSpecUrl()} deepLinking />
		</div>
	</StrictMode>,
);

import "./swagger-ui.css";
import "swagger-ui-react/swagger-ui.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import SwaggerUI from "swagger-ui-react";
// @ts-expect-error - Vite dynamic import
import openApiSpec from "../../../packages/monitabits-kubb/src/openapi.yaml?url";

const root = document.getElementById("root");
if (!root) {
	throw new Error("Root element not found");
}

createRoot(root).render(
	<StrictMode>
		<div className="swagger-container">
			<SwaggerUI url={openApiSpec} deepLinking />
		</div>
	</StrictMode>,
);

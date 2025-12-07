import "swagger-ui-react/swagger-ui.css";
import SwaggerUI from "swagger-ui-react";
import openApiSpec from "../openapi.yaml?url";

export default function App() {
	return (
		<div className="swagger-container">
			<SwaggerUI url={openApiSpec} deepLinking />
		</div>
	);
}

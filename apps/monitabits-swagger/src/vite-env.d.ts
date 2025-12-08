/// <reference types="vite/client" />

interface ImportMetaEnv {
	/** API URL for fetching OpenAPI spec in production */
	readonly VITE_API_URL?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

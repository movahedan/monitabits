import { logger } from "@repo/utils/logger";
/**
 * Request configuration type expected by Kubb-generated hooks
 */
export interface RequestConfig<TRequest = unknown> {
	readonly method?: string;
	readonly url?: string;
	readonly params?: Record<string, unknown>;
	readonly headers?: Record<string, string>;
	readonly data?: TRequest;
}

/**
 * Response error configuration type expected by Kubb-generated hooks
 */
export type ResponseErrorConfig<TError = unknown> = TError;

/**
 * Get API base URL from environment variables
 * Ensures the URL always has a protocol (http:// or https://)
 */
function getApiBaseUrl(): string {
	const DEFAULT_HOST = "localhost";
	const DEFAULT_PORT = 3000;
	const DEFAULT_BASE_URL = `http://${DEFAULT_HOST}:${DEFAULT_PORT}`;

	const rawBaseUrl = (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "").trim();

	// Rule:
	// - If env includes protocol (http/https): use it as-is
	// - Otherwise: fall back to the default base URL
	if (/^https?:\/\//i.test(rawBaseUrl)) return rawBaseUrl.replace(/\/$/, "");
	return DEFAULT_BASE_URL;
}

/**
 * Get client time information for headers
 */
function getClientTimeInfo(): {
	clientTime: string;
	timezoneOffset: number;
	timezoneName: string;
} {
	const now = new Date();
	return {
		clientTime: now.toISOString(),
		timezoneOffset: -now.getTimezoneOffset(),
		timezoneName: Intl.DateTimeFormat().resolvedOptions().timeZone,
	};
}

/**
 * Get device ID from cookie (client-side only).
 * On server-side, returns empty string - headers must be passed explicitly.
 */
function getDeviceIdFromCookie(): string {
	if (typeof document === "undefined") return "";
	const match = document.cookie.match(/monitabits_device_id=([^;]+)/);
	return match?.[1] ?? "";
}

/**
 * Custom fetch function with automatic headers.
 * - On client-side: Auto-injects device ID from cookies
 * - On server-side: Device ID must be passed via options.headers
 */
export async function customFetch<TData = unknown>(
	url: string,
	options?: RequestInit,
): Promise<TData> {
	const timeInfo = getClientTimeInfo();
	const apiBaseUrl = getApiBaseUrl();
	const fullUrl = url.startsWith("http") ? url : `${apiBaseUrl}${url}`;

	const headers = new Headers(options?.headers);
	headers.set("Content-Type", "application/json");
	headers.set("X-Client-Time", timeInfo.clientTime);
	headers.set("X-Timezone-Offset", String(timeInfo.timezoneOffset));
	headers.set("X-Timezone-Name", timeInfo.timezoneName);
	if (!headers.has("X-Device-Id")) {
		const deviceId = getDeviceIdFromCookie();
		if (deviceId) {
			headers.set("X-Device-Id", deviceId);
		}
	}
	const fetchOptions = { ...options, headers };

	logger.debug("Fetching URL", { url: fullUrl, options: fetchOptions });
	const res = await fetch(fullUrl, fetchOptions);
	const jsonRes = await res.json().catch(() => ({
		success: false,
		error: "UNKNOWN_ERROR",
		message: `HTTP ${res.status}: ${res.statusText}`,
		statusCode: res.status,
		timestamp: new Date().toISOString(),
		path: url,
	}));

	if (!res.ok) {
		logger.error("Request failed", { status: res.status, statusText: res.statusText, jsonRes });
		throw new Error(jsonRes.message || `Request failed with status ${res.status}`);
	}

	if (jsonRes.success === false) {
		logger.error("API error response", { status: res.status, statusText: res.statusText, jsonRes });
		throw new Error(jsonRes.message || jsonRes.error || "Request failed");
	}

	logger.debug("Request successful", { status: res.status, statusText: res.statusText, jsonRes });
	return jsonRes.data as TData;
}

export const client = async <TData = unknown, _TError = unknown, TRequest = unknown>(config: {
	method: string;
	url: string;
	params?: Record<string, unknown>;
	headers?: Record<string, string | number | boolean>;
	data?: TRequest;
}): Promise<{ data: TData }> => {
	const { method, url, params, headers: customHeaders, data } = config;

	// Build URL with query parameters
	let fullUrl = url;
	if (params) {
		const searchParams = new URLSearchParams();
		for (const [key, value] of Object.entries(params)) {
			if (value !== undefined && value !== null) {
				searchParams.append(key, String(value));
			}
		}
		const queryString = searchParams.toString();
		if (queryString) {
			fullUrl += `?${queryString}`;
		}
	}

	// Prepare request options
	const options: RequestInit = {
		method,
		headers: customHeaders as HeadersInit,
	};

	// Add body for POST, PUT, PATCH
	if (data && ["POST", "PUT", "PATCH"].includes(method.toUpperCase())) {
		options.body = JSON.stringify(data);
	}

	const responseData = await customFetch<TData>(fullUrl, options);
	return { data: responseData };
};

/**
 * Export default client as fetch for Kubb-generated hooks
 * This is what the generated hooks import as "fetch"
 */
export default client;

/**
 * Named export of client as fetch for backward compatibility
 */
export { client as fetch };

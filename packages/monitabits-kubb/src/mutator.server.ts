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
 */
function getApiBaseUrl(): string {
	if (typeof window === "undefined") {
		// Server-side: use environment variable or default
		return process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";
	}
	// Client-side: use public environment variable
	return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";
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
	const apiBaseUrl = getApiBaseUrl();
	const fullUrl = url.startsWith("http") ? url : `${apiBaseUrl}${url}`;

	// Get time info
	const timeInfo = getClientTimeInfo();

	// Merge headers
	const headers = new Headers(options?.headers);
	headers.set("Content-Type", "application/json");
	headers.set("X-Client-Time", timeInfo.clientTime);
	headers.set("X-Timezone-Offset", String(timeInfo.timezoneOffset));
	headers.set("X-Timezone-Name", timeInfo.timezoneName);

	// Auto-inject device ID from cookie on client-side (if not already set)
	if (!headers.has("X-Device-Id")) {
		const deviceId = getDeviceIdFromCookie();
		if (deviceId) {
			headers.set("X-Device-Id", deviceId);
		}
	}

	// Make request
	const response = await fetch(fullUrl, {
		...options,
		headers,
	});

	// Handle errors
	if (!response.ok) {
		const error = await response.json().catch(() => ({
			success: false,
			error: "UNKNOWN_ERROR",
			message: `HTTP ${response.status}: ${response.statusText}`,
			statusCode: response.status,
			timestamp: new Date().toISOString(),
			path: url,
		}));

		throw new Error(error.message || `Request failed with status ${response.status}`);
	}

	// Parse response
	const data = await response.json();

	// Handle API error responses
	if (data.success === false) {
		throw new Error(data.message || data.error || "Request failed");
	}

	// Return data from success response
	return data.data as TData;
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

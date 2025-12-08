import useSWR, { type SWRConfiguration } from "swr";

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
 * Generate a UUID v4
 */
function generateUUID(): string {
	if (typeof crypto !== "undefined" && crypto.randomUUID) {
		return crypto.randomUUID();
	}
	// Fallback for older browsers
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

/**
 * Get or create device ID from localStorage
 */
function getOrCreateDeviceId(): string {
	if (typeof window === "undefined") return "";

	const storageKey = "monitabits_device_id";
	let deviceId = localStorage.getItem(storageKey);

	if (!deviceId) {
		deviceId = generateUUID();
		localStorage.setItem(storageKey, deviceId);
	}

	return deviceId;
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
 * Custom fetch function with automatic headers
 */
async function customFetch<TData = unknown>(url: string, options?: RequestInit): Promise<TData> {
	const apiBaseUrl = getApiBaseUrl();
	const fullUrl = url.startsWith("http") ? url : `${apiBaseUrl}${url}`;

	// Get device ID and time info
	const deviceId = getOrCreateDeviceId();
	const timeInfo = getClientTimeInfo();

	// Merge headers
	const headers = new Headers(options?.headers);
	headers.set("Content-Type", "application/json");
	headers.set("X-Device-Id", deviceId);
	headers.set("X-Client-Time", timeInfo.clientTime);
	headers.set("X-Timezone-Offset", String(timeInfo.timezoneOffset));
	headers.set("X-Timezone-Name", timeInfo.timezoneName);

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

/**
 * SWR fetcher using custom fetch
 */
export const swrFetcher = <TData = unknown>(url: string): Promise<TData> => {
	return customFetch<TData>(url);
};

/**
 * HTTP client for Kubb-generated SWR hooks
 * This is the mutator that Kubb's SWR plugin expects
 *
 * The client function signature matches what @kubb/plugin-swr expects:
 * - Accepts a config object with method, url, params, headers, data
 * - Returns a Promise with an object containing the response data
 */
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
		Object.entries(params).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				searchParams.append(key, String(value));
			}
		});
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
 * SWR configuration with default options
 */
export const swrConfig: SWRConfiguration = {
	fetcher: swrFetcher,
	revalidateOnFocus: true,
	revalidateOnReconnect: true,
	shouldRetryOnError: true,
	errorRetryCount: 3,
	errorRetryInterval: 1000,
};

/**
 * Hook to use SWR with default configuration
 */
export function useSWRWithConfig<TData = unknown>(key: string | null, config?: SWRConfiguration) {
	return useSWR<TData>(key, {
		...swrConfig,
		...config,
	});
}

/**
 * Export default client as fetch for Kubb-generated hooks
 * This is what the generated hooks import as "fetch"
 */
export default client;

/**
 * Named export of client as fetch for backward compatibility
 */
export { client as fetch };

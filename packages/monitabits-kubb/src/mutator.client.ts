import useSWR, { type SWRConfiguration } from "swr";
import type { RequestConfig, ResponseErrorConfig } from "./mutator.server";
import { client, customFetch } from "./mutator.server";

/**
 * SWR fetcher using custom fetch (device ID auto-injected from cookies on client-side)
 */
export const swrFetcher = <TData = unknown>(url: string): Promise<TData> => {
	return customFetch<TData>(url);
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

// Re-export everything from server mutator
export { client, customFetch };
export type { RequestConfig, ResponseErrorConfig };

/**
 * Export default client for Kubb-generated hooks
 */
export default client;

/**
 * Named export of client as fetch for backward compatibility
 */
export { client as fetch };

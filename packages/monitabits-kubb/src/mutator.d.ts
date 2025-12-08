import type { SWRConfiguration } from "swr";
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
 * SWR fetcher using custom fetch
 */
export declare const swrFetcher: <TData = unknown>(url: string) => Promise<TData>;
/**
 * HTTP client for Kubb-generated SWR hooks
 * This is the mutator that Kubb's SWR plugin expects
 *
 * The client function signature matches what @kubb/plugin-swr expects:
 * - Accepts a config object with method, url, params, headers, data
 * - Returns a Promise with an object containing the response data
 */
export declare const client: <TData = unknown, _TError = unknown, TRequest = unknown>(config: {
	method: string;
	url: string;
	params?: Record<string, unknown>;
	headers?: Record<string, string>;
	data?: TRequest;
}) => Promise<{
	data: TData;
}>;
/**
 * SWR configuration with default options
 */
export declare const swrConfig: SWRConfiguration;
/**
 * Hook to use SWR with default configuration
 */
export declare function useSWRWithConfig<TData = unknown>(
	key: string | null,
	config?: SWRConfiguration,
): import("swr").SWRResponse<
	TData,
	unknown,
	SWRConfiguration<TData, unknown, import("swr").BareFetcher<TData>> | undefined
>;
/**
 * Export default client as fetch for Kubb-generated hooks
 * This is what the generated hooks import as "fetch"
 */
export default client;
/**
 * Named export of client as fetch for backward compatibility
 */
export { client as fetch };
//# sourceMappingURL=mutator.d.ts.map

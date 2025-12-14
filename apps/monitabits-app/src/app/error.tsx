"use client";

import { logger } from "@repo/utils/logger";
import { useEffect } from "react";

interface ErrorProps {
	readonly error: Error & { digest?: string };
	readonly reset: () => void;
}

/**
 * Root error boundary that catches errors from all routes.
 * Does not catch errors in the root layout (use global-error.tsx for that).
 */
export default function ErrorComponent({ error, reset }: ErrorProps) {
	useEffect(() => {
		// Log error to an error reporting service
		logger.error("Application error:", error);
	}, [error]);

	return (
		<div className="flex min-h-screen flex-col items-center justify-center p-4">
			<div className="w-full max-w-md text-center">
				<div className="mb-6 text-6xl">😕</div>
				<h1 className="mb-2 text-2xl font-bold">Something went wrong</h1>
				<p className="mb-6 text-muted-foreground">
					We encountered an error while loading this page. Please try again.
				</p>
				{process.env.NODE_ENV === "development" && (
					<pre className="mb-6 overflow-auto rounded-lg bg-gray-100 p-4 text-left text-sm dark:bg-gray-800">
						{error.message}
					</pre>
				)}
				<div className="flex justify-center gap-4">
					<a
						href="/"
						className="rounded-lg border border-gray-300 px-6 py-3 font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
					>
						Go home
					</a>
					<button
						type="button"
						onClick={reset}
						className="rounded-lg bg-gray-900 px-6 py-3 font-medium text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
					>
						Try again
					</button>
				</div>
			</div>
		</div>
	);
}

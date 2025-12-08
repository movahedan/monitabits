"use client";

interface GlobalErrorProps {
	readonly error: Error & { digest?: string };
	readonly reset: () => void;
}

/**
 * Global error boundary that catches errors in the root layout.
 * Must include own <html> and <body> tags since it replaces the entire document.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
	return (
		<html lang="en">
			<body className="min-h-screen bg-background font-sans antialiased">
				<div className="flex min-h-screen flex-col items-center justify-center p-4">
					<div className="w-full max-w-md text-center">
						<div className="mb-6 text-6xl">⚠️</div>
						<h1 className="mb-2 text-2xl font-bold">Something went wrong</h1>
						<p className="mb-6 text-muted-foreground">
							An unexpected error occurred. Please try again.
						</p>
						{process.env.NODE_ENV === "development" && (
							<pre className="mb-6 overflow-auto rounded-lg bg-gray-100 p-4 text-left text-sm dark:bg-gray-800">
								{error.message}
							</pre>
						)}
						<button
							type="button"
							onClick={reset}
							className="rounded-lg bg-gray-900 px-6 py-3 font-medium text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
						>
							Try again
						</button>
					</div>
				</div>
			</body>
		</html>
	);
}

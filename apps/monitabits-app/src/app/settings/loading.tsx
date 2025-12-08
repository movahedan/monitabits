/**
 * Settings loading skeleton.
 * Displayed while the server fetches settings data.
 */
export default function SettingsLoading() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center p-4">
			<div className="w-full max-w-md">
				{/* Back link skeleton */}
				<div className="mb-4 h-5 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />

				{/* Card skeleton */}
				<div className="rounded-xl border bg-card p-6 shadow-sm">
					{/* Header skeleton */}
					<div className="mb-6 space-y-2">
						<div className="h-6 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
						<div className="h-4 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
					</div>

					{/* Form skeleton */}
					<div className="space-y-6">
						<div className="space-y-2">
							<div className="h-4 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
							<div className="h-10 w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
							<div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
						</div>

						{/* Button skeleton */}
						<div className="h-10 w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
					</div>
				</div>
			</div>
		</main>
	);
}

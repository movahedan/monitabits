/**
 * Dashboard loading skeleton.
 * Displayed while the server fetches session data.
 */
export default function DashboardLoading() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center p-4">
			<div className="w-full max-w-md space-y-6">
				{/* Status Card Skeleton */}
				<div className="rounded-xl border bg-card p-6 shadow-sm">
					<div className="flex flex-col items-center space-y-4">
						{/* Timer/Time Ahead Skeleton */}
						<div className="h-16 w-40 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
						<div className="h-4 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
						{/* Button Skeleton */}
						<div className="mt-4 h-12 w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
					</div>
				</div>

				{/* Progress Metrics Skeleton */}
				<div className="rounded-xl border bg-card p-6 shadow-sm">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
							<div className="h-8 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
						</div>
						<div className="space-y-2">
							<div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
							<div className="h-8 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
						</div>
						<div className="space-y-2">
							<div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
							<div className="h-8 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
						</div>
						<div className="space-y-2">
							<div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
							<div className="h-8 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
						</div>
					</div>
				</div>

				{/* Settings Link Skeleton */}
				<div className="flex justify-center">
					<div className="h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
				</div>
			</div>
		</main>
	);
}

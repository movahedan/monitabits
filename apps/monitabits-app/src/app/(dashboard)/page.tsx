import {
	sessionsControllerGetCurrentSession,
	statisticsControllerGetSummary,
} from "@repo/monitabits-kubb/server";
import { ProgressMetrics } from "@repo/ui/molecules";
import { Suspense } from "react";
import { getApiHeaders } from "../../utils/api-headers";
import { DashboardClient } from "./_components/dashboard-client";

export const metadata = {
	title: "Monitabits | Quit Smoking Tracker",
	description: "A self-accountability application to help you quit smoking",
};

// Revalidate session data frequently for real-time updates
export const revalidate = 30;

/**
 * Async component to load statistics (streams in separately)
 */
async function StatsLoader() {
	try {
		const headers = await getApiHeaders();
		const stats = await statisticsControllerGetSummary({ headers });
		return (
			<ProgressMetrics
				totalTimeSaved={stats?.totalTimeSaved ?? 0}
				currentStreak={stats?.currentStreak ?? 0}
				longestStreak={stats?.longestStreak}
				lastRelapse={stats?.lastRelapse}
			/>
		);
	} catch (error) {
		console.error("Failed to load stats:", error);
		return null;
	}
}

/**
 * Stats loading skeleton
 */
function StatsSkeleton() {
	return (
		<div className="rounded-xl border bg-card p-6 shadow-sm">
			<div className="grid grid-cols-2 gap-4">
				{[1, 2, 3, 4].map((i) => (
					<div key={i} className="space-y-2">
						<div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
						<div className="h-8 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
					</div>
				))}
			</div>
		</div>
	);
}

/**
 * Dashboard page - Server Component
 * Fetches initial session data on the server for fast first paint.
 * Client components handle real-time updates and user interactions.
 */
export default async function DashboardPage() {
	// Fetch session data on the server with device ID from cookies
	const headers = await getApiHeaders();
	const data = await sessionsControllerGetCurrentSession({ headers });
	const session = data?.session ?? null;

	return (
		<main className="flex min-h-screen flex-col items-center justify-center p-4">
			<div className="w-full max-w-md space-y-6">
				{/* Interactive dashboard with real-time updates */}
				<DashboardClient initialSession={session} />

				{/* Progress metrics - streams in separately */}
				<Suspense fallback={<StatsSkeleton />}>
					<StatsLoader />
				</Suspense>

				{/* Settings Link */}
				<div className="text-center">
					<a href="/settings" className="text-sm text-muted-foreground hover:underline">
						Settings
					</a>
				</div>
			</div>
		</main>
	);
}

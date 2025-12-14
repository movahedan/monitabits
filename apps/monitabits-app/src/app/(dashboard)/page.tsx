import {
	statisticsControllerGetSummary,
	timerControllerGetCurrentTimer,
} from "@repo/monitabits-kubb/server";
import { logger } from "@repo/utils/logger";
import { Suspense } from "react";
import { getApiHeaders } from "../../utils/api-headers";
import { PomodoroTimer } from "./_components/pomodoro-timer";

export const metadata = {
	title: "Pomodoro Timer | Monitabits",
	description: "A simple Pomodoro timer application",
};

export const revalidate = 5;

async function StatsLoader() {
	try {
		const headers = await getApiHeaders();
		const stats = await statisticsControllerGetSummary({ headers });
		return (
			<div className="rounded-xl border bg-card p-6 shadow-sm">
				<div className="grid grid-cols-2 gap-4 text-center">
					<div>
						<div className="text-sm text-muted-foreground">Today</div>
						<div className="text-2xl font-bold">{stats?.todayCount ?? 0}</div>
					</div>
					<div>
						<div className="text-sm text-muted-foreground">Total</div>
						<div className="text-2xl font-bold">{stats?.totalWorkSessions ?? 0}</div>
					</div>
					<div>
						<div className="text-sm text-muted-foreground">Time</div>
						<div className="text-2xl font-bold">
							{Math.floor((stats?.totalTimeSeconds ?? 0) / 3600)}h
						</div>
					</div>
					<div>
						<div className="text-sm text-muted-foreground">Completed</div>
						<div className="text-2xl font-bold">{stats?.totalCompleted ?? 0}</div>
					</div>
				</div>
			</div>
		);
	} catch (error) {
		logger.error("Failed to load stats:", error);
		return null;
	}
}

function StatsSkeleton() {
	return (
		<div className="rounded-xl border bg-card p-6 shadow-sm">
			<div className="grid grid-cols-2 gap-4">
				{[1, 2, 3, 4].map((i) => (
					<div key={i} className="space-y-2 text-center">
						<div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700 mx-auto" />
						<div className="h-8 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700 mx-auto" />
					</div>
				))}
			</div>
		</div>
	);
}

export default async function DashboardPage() {
	let timer = null;
	try {
		const headers = await getApiHeaders();
		const data = await timerControllerGetCurrentTimer({ headers });
		timer = data?.timer ?? null;
	} catch (error) {
		logger.error("Failed to load timer:", error);
	}

	return (
		<main className="flex min-h-screen flex-col items-center justify-center p-4">
			<div className="w-full max-w-md space-y-6">
				<PomodoroTimer initialTimer={timer} />

				<Suspense fallback={<StatsSkeleton />}>
					<StatsLoader />
				</Suspense>

				<div className="text-center">
					<a href="/settings" className="text-sm text-muted-foreground hover:underline">
						Settings
					</a>
				</div>
			</div>
		</main>
	);
}

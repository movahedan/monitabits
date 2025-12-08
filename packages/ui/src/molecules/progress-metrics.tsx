"use client";

import { cn } from "@repo/utils/cn";

interface ProgressMetricsProps {
	/** Total time saved in seconds */
	readonly totalTimeSaved: number;
	/** Current consecutive lockdown periods completed */
	readonly currentStreak: number;
	/** Longest streak ever achieved */
	readonly longestStreak?: number;
	/** Last relapse timestamp (ISO string) */
	readonly lastRelapse?: string | null;
	/** Additional CSS classes */
	readonly className?: string;
}

/**
 * Formats seconds into a human-readable duration
 */
function formatDuration(totalSeconds: number): string {
	const days = Math.floor(totalSeconds / 86400);
	const hours = Math.floor((totalSeconds % 86400) / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);

	const parts: string[] = [];

	if (days > 0) parts.push(`${days}d`);
	if (hours > 0) parts.push(`${hours}h`);
	if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);

	return parts.join(" ");
}

/**
 * Formats a timestamp into a relative time string
 */
function formatRelativeTime(isoString: string): string {
	const date = new Date(isoString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffSeconds = Math.floor(diffMs / 1000);
	const diffMinutes = Math.floor(diffSeconds / 60);
	const diffHours = Math.floor(diffMinutes / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
	if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
	if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
	return "Just now";
}

interface MetricItemProps {
	readonly label: string;
	readonly value: string;
	readonly icon: string;
}

function MetricItem({ label, value, icon }: MetricItemProps) {
	return (
		<div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
			<span className="text-xl" aria-hidden="true">
				{icon}
			</span>
			<div>
				<p className="text-sm text-muted-foreground">{label}</p>
				<p className="font-semibold">{value}</p>
			</div>
		</div>
	);
}

/**
 * ProgressMetrics component for displaying user statistics
 * Shows time saved, current streak, and last relapse
 */
export function ProgressMetrics({
	totalTimeSaved,
	currentStreak,
	longestStreak,
	lastRelapse,
	className,
}: ProgressMetricsProps) {
	return (
		<div className={cn("space-y-3", className)}>
			<h2 className="text-lg font-semibold">Progress</h2>

			<div className="grid gap-3 sm:grid-cols-2">
				<MetricItem label="Total Time Saved" value={formatDuration(totalTimeSaved)} icon="⏱️" />
				<MetricItem
					label="Current Streak"
					value={`${currentStreak} period${currentStreak !== 1 ? "s" : ""}`}
					icon="🔥"
				/>
				{longestStreak !== undefined && (
					<MetricItem
						label="Longest Streak"
						value={`${longestStreak} period${longestStreak !== 1 ? "s" : ""}`}
						icon="🏆"
					/>
				)}
				{lastRelapse && (
					<MetricItem label="Last Relapse" value={formatRelativeTime(lastRelapse)} icon="📅" />
				)}
			</div>
		</div>
	);
}

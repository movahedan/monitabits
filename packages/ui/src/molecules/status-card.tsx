"use client";

import { cn } from "@repo/utils/cn";
import type * as React from "react";

type StatusType = "locked" | "active";

interface StatusCardProps {
	/** Current status - locked (in lockdown) or active (free to make choices) */
	readonly status: StatusType;
	/** Child elements to render inside the card */
	readonly children: React.ReactNode;
	/** Additional CSS classes */
	readonly className?: string;
}

const statusConfig = {
	locked: {
		icon: "🔒",
		title: "LOCKED DOWN",
		bgColor: "bg-red-50 dark:bg-red-950/30",
		borderColor: "border-red-200 dark:border-red-900",
		textColor: "text-red-700 dark:text-red-400",
		iconBg: "bg-red-100 dark:bg-red-900/50",
	},
	active: {
		icon: "✅",
		title: "You're Ahead!",
		bgColor: "bg-green-50 dark:bg-green-950/30",
		borderColor: "border-green-200 dark:border-green-900",
		textColor: "text-green-700 dark:text-green-400",
		iconBg: "bg-green-100 dark:bg-green-900/50",
	},
} as const;

/**
 * StatusCard component for displaying current session state
 * Uses color-coded styling based on locked/active status
 */
export function StatusCard({ status, children, className }: StatusCardProps) {
	const config = statusConfig[status];

	return (
		<div
			className={cn(
				"rounded-xl border-2 p-6 md:p-8",
				config.bgColor,
				config.borderColor,
				className,
			)}
		>
			<div className="flex flex-col items-center space-y-4">
				{/* Header with icon and title */}
				<div className="flex items-center gap-3">
					<span
						className={cn(
							"flex h-10 w-10 items-center justify-center rounded-full text-xl",
							config.iconBg,
						)}
						aria-hidden="true"
					>
						{config.icon}
					</span>
					<h1 className={cn("text-xl font-semibold uppercase tracking-wide", config.textColor)}>
						{config.title}
					</h1>
				</div>

				{/* Content area */}
				{children}
			</div>
		</div>
	);
}

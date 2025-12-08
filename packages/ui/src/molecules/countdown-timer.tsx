"use client";

import { cn } from "@repo/utils/cn";
import { useEffect, useState } from "react";

interface CountdownTimerProps {
	/** Time remaining in seconds */
	readonly timeRemaining: number;
	/** Callback when countdown reaches zero */
	readonly onComplete?: () => void;
	/** Additional CSS classes */
	readonly className?: string;
}

/**
 * Formats seconds into HH:MM:SS or MM:SS format
 */
function formatTime(totalSeconds: number): string {
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	const pad = (n: number) => n.toString().padStart(2, "0");

	if (hours > 0) {
		return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
	}
	return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * CountdownTimer component for displaying remaining lockdown time
 * Uses a large, monospace font for clear time display
 */
export function CountdownTimer({
	timeRemaining: initialTime,
	onComplete,
	className,
}: CountdownTimerProps) {
	const [timeRemaining, setTimeRemaining] = useState(initialTime);

	useEffect(() => {
		setTimeRemaining(initialTime);
	}, [initialTime]);

	useEffect(() => {
		if (timeRemaining <= 0) {
			onComplete?.();
			return;
		}

		const interval = setInterval(() => {
			setTimeRemaining((prev) => {
				const next = prev - 1;
				if (next <= 0) {
					clearInterval(interval);
					onComplete?.();
					return 0;
				}
				return next;
			});
		}, 1000);

		return () => clearInterval(interval);
	}, [timeRemaining, onComplete]);

	return (
		<div
			role="timer"
			aria-live="polite"
			aria-atomic="true"
			aria-label={`Time remaining: ${formatTime(timeRemaining)}`}
			className={cn(
				"font-mono text-5xl font-bold tabular-nums tracking-tight md:text-6xl lg:text-7xl",
				className,
			)}
		>
			{formatTime(timeRemaining)}
		</div>
	);
}

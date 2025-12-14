"use client";

import { useTimerControllerGetCurrentTimer } from "@repo/monitabits-kubb/hooks";
import { Button, Card, CardContent } from "@repo/ui/atoms";
import { useCallback, useEffect, useState, useTransition } from "react";
import { pauseTimer, resetTimer, resumeTimer, startTimer } from "../actions";

interface PomodoroTimerProps {
	readonly initialTimer: {
		readonly id: string;
		readonly status: "idle" | "running" | "paused" | "completed";
		readonly type: "work" | "short_break" | "long_break";
		readonly durationSeconds: number;
		readonly remainingSeconds: number;
		readonly startedAt: string | null;
		readonly pausedAt: string | null;
	} | null;
}

export function PomodoroTimer({ initialTimer }: PomodoroTimerProps) {
	const { data, mutate } = useTimerControllerGetCurrentTimer({
		query: { refreshInterval: 5000 },
	});

	const timer = data?.timer ?? initialTimer;
	const [localRemaining, setLocalRemaining] = useState(timer?.remainingSeconds ?? 0);
	const [isPending, startTransition] = useTransition();

	useEffect(() => {
		if (timer) {
			setLocalRemaining((prev) => {
				if (timer.remainingSeconds - prev > 2) {
					return timer?.remainingSeconds;
				}
				return prev;
			});
		}
	}, [timer]);

	useEffect(() => {
		if (!timer || timer.status !== "running") return;

		const interval = setInterval(() => {
			setLocalRemaining((prev) => {
				const next = Math.max(0, prev - 1);
				if (next === 0) {
					mutate();
				}
				return next;
			});
		}, 1000);

		return () => clearInterval(interval);
	}, [timer, mutate]);

	const handleStart = useCallback(
		(type: "work" | "short_break" | "long_break") => {
			startTransition(async () => {
				await startTimer(type);
				await mutate();
			});
		},
		[mutate],
	);

	const handlePause = useCallback(() => {
		startTransition(async () => {
			await pauseTimer();
			await mutate();
		});
	}, [mutate]);

	const handleResume = useCallback(() => {
		startTransition(async () => {
			await resumeTimer();
			await mutate();
		});
	}, [mutate]);

	const handleReset = useCallback(() => {
		startTransition(async () => {
			await resetTimer();
			await mutate();
		});
	}, [mutate]);

	const formatTime = (seconds: number): string => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	};

	const getTypeLabel = (type: string): string => {
		switch (type) {
			case "work":
				return "Work";
			case "short_break":
				return "Short Break";
			case "long_break":
				return "Long Break";
			default:
				return "Timer";
		}
	};

	if (!timer) {
		return (
			<Card>
				<CardContent className="flex flex-col items-center gap-4 p-8">
					<div className="text-lg text-muted-foreground">No timer found</div>
					<Button onClick={() => handleStart("work")} disabled={isPending}>
						Start Work Timer
					</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardContent className="flex flex-col items-center gap-6 p-8">
				{/* Timer Type */}
				<div className="text-lg font-semibold text-muted-foreground">
					{getTypeLabel(timer.type)}
				</div>

				{/* Timer Display */}
				<div className="font-mono text-7xl font-bold">{formatTime(localRemaining)}</div>

				{/* Controls */}
				<div className="flex gap-3">
					{timer.status === "idle" && (
						<>
							<Button onClick={() => handleStart("work")} disabled={isPending}>
								Start Work
							</Button>
							<Button
								onClick={() => handleStart("short_break")}
								disabled={isPending}
								variant="outline"
							>
								Short Break
							</Button>
							<Button
								onClick={() => handleStart("long_break")}
								disabled={isPending}
								variant="outline"
							>
								Long Break
							</Button>
						</>
					)}

					{timer.status === "running" && (
						<>
							<Button onClick={handlePause} disabled={isPending}>
								Pause
							</Button>
							<Button onClick={handleReset} disabled={isPending} variant="outline">
								Reset
							</Button>
						</>
					)}

					{timer.status === "paused" && (
						<>
							<Button onClick={handleResume} disabled={isPending}>
								Resume
							</Button>
							<Button onClick={handleReset} disabled={isPending} variant="outline">
								Reset
							</Button>
						</>
					)}

					{timer.status === "completed" && (
						<Button onClick={handleReset} disabled={isPending}>
							Start New
						</Button>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

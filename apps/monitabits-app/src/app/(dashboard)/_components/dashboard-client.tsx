"use client";

import { useSessionsControllerGetCurrentSession } from "@repo/monitabits-kubb/hooks";
import { ActionButton, ConfirmationModal, CountdownTimer, StatusCard } from "@repo/ui/molecules";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { performCheckIn, performCheckOut, recordCheat, recordHarm } from "../actions";
import { ReflectionModal } from "./reflection-modal";

interface SessionData {
	readonly id: string;
	readonly status: "active" | "locked" | "completed";
	readonly startTime: string;
	readonly endTime: string | null;
	readonly lockdownMinutes: number;
	readonly timeRemaining?: number | null;
	readonly timeAhead?: number | null;
}

interface DashboardClientProps {
	readonly initialSession: SessionData | null;
}

type ModalType = "cheat" | "harm" | null;

/**
 * Client-side dashboard component with real-time updates.
 * Receives initial data from server and handles user interactions.
 */
export function DashboardClient({ initialSession }: DashboardClientProps) {
	// Real-time session updates with SWR
	const { data, mutate } = useSessionsControllerGetCurrentSession({
		query: { refreshInterval: 30000 },
	});

	// Use server data as fallback, client data takes precedence
	const session = data?.session ?? initialSession;

	// Modal and action state
	const [modalType, setModalType] = useState<ModalType>(null);
	const [isPending, startTransition] = useTransition();

	// Auto check-in/check-out on visibility changes
	const lastCheckInRef = useRef<Date | null>(null);

	const handleCheckIn = useCallback(() => {
		startTransition(async () => {
			await performCheckIn();
			lastCheckInRef.current = new Date();
		});
	}, []);

	const handleCheckOut = useCallback(() => {
		startTransition(async () => {
			await performCheckOut();
		});
	}, []);

	// Check-in on mount
	useEffect(() => {
		handleCheckIn();
	}, [handleCheckIn]);

	// Handle visibility changes
	useEffect(() => {
		const handleVisibilityChange = () => {
			if (document.visibilityState === "visible") {
				handleCheckIn();
			} else {
				handleCheckOut();
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
	}, [handleCheckIn, handleCheckOut]);

	// Periodic check-ins every 5 minutes
	useEffect(() => {
		const interval = setInterval(handleCheckIn, 5 * 60 * 1000);
		return () => clearInterval(interval);
	}, [handleCheckIn]);

	// Handle action confirmation
	const handleAction = () => {
		if (!modalType) return;

		startTransition(async () => {
			const result = modalType === "cheat" ? await recordCheat() : await recordHarm();

			if (result.success) {
				await mutate();
				setModalType(null);
			} else {
				console.error("Action failed:", result.error);
			}
		});
	};

	// Handle countdown complete
	const handleCountdownComplete = useCallback(() => {
		mutate();
	}, [mutate]);

	// Determine current state
	const isLocked = session?.status === "locked";
	const timeRemaining = session?.timeRemaining ?? 0;
	const timeAhead = session?.timeAhead ?? 0;

	return (
		<>
			{/* Status Card */}
			<StatusCard status={isLocked ? "locked" : "active"}>
				{isLocked ? (
					<>
						{/* Countdown Timer */}
						<div className="py-4 text-red-600">
							<CountdownTimer timeRemaining={timeRemaining} onComplete={handleCountdownComplete} />
						</div>
						<p className="text-center text-sm text-muted-foreground">
							Time remaining until you can make a choice
						</p>
						{/* Cheat Button */}
						<div className="mt-6 w-full">
							<ActionButton
								variant="cheat"
								className="w-full"
								onClick={() => setModalType("cheat")}
							>
								I Cheated and Dishonored Myself
							</ActionButton>
						</div>
					</>
				) : (
					<>
						{/* Time Ahead Display */}
						<div className="py-4 text-center">
							<p className="font-mono text-5xl font-bold text-green-600 md:text-6xl">
								{formatTimeAhead(timeAhead)}
							</p>
							<p className="mt-2 text-sm text-muted-foreground">Ahead of your plan</p>
						</div>
						{/* Harm Button */}
						<div className="mt-6 w-full">
							<ActionButton variant="harm" className="w-full" onClick={() => setModalType("harm")}>
								I&apos;m Choosing to Harm Myself
							</ActionButton>
						</div>
					</>
				)}
			</StatusCard>

			{/* Confirmation Modal */}
			<ConfirmationModal
				isOpen={modalType !== null}
				type={modalType ?? "harm"}
				isLoading={isPending}
				onConfirm={handleAction}
				onCancel={() => setModalType(null)}
			/>

			{/* Reflection Modal - Shows when there are pending questions */}
			<ReflectionModal />
		</>
	);
}

/**
 * Formats time ahead in a human-readable format
 */
function formatTimeAhead(totalSeconds: number): string {
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);

	if (hours > 0) {
		return `${hours}h ${minutes}m`;
	}
	return `${minutes}m`;
}

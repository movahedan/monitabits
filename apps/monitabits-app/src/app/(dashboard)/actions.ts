"use server";

import {
	timerControllerPauseTimer,
	timerControllerResetTimer,
	timerControllerResumeTimer,
	timerControllerStartTimer,
} from "@repo/monitabits-kubb/server";
import { logger } from "@repo/utils/logger";
import { revalidatePath } from "next/cache";
import { getApiHeaders } from "../../utils/api-headers";

export async function startTimer(
	type: "work" | "short_break" | "long_break",
): Promise<{ success: boolean; error?: string }> {
	try {
		const headers = await getApiHeaders();
		await timerControllerStartTimer({ type }, { headers });
		revalidatePath("/");
		return { success: true };
	} catch (error) {
		logger.error("Failed to start timer:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to start timer",
		};
	}
}

/**
 * Server Action to pause the timer.
 */
export async function pauseTimer(): Promise<{ success: boolean; error?: string }> {
	try {
		const headers = await getApiHeaders();
		await timerControllerPauseTimer({ headers });
		revalidatePath("/");
		return { success: true };
	} catch (error) {
		logger.error("Failed to pause timer:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to pause timer",
		};
	}
}

/**
 * Server Action to resume the timer.
 */
export async function resumeTimer(): Promise<{ success: boolean; error?: string }> {
	try {
		const headers = await getApiHeaders();
		await timerControllerResumeTimer({ headers });
		revalidatePath("/");
		return { success: true };
	} catch (error) {
		logger.error("Failed to resume timer:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to resume timer",
		};
	}
}

/**
 * Server Action to reset the timer.
 */
export async function resetTimer(): Promise<{ success: boolean; error?: string }> {
	try {
		const headers = await getApiHeaders();
		await timerControllerResetTimer({ headers });
		revalidatePath("/");
		return { success: true };
	} catch (error) {
		logger.error("Failed to reset timer:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to reset timer",
		};
	}
}

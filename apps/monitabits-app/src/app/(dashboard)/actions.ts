"use server";

import {
	actionsControllerCheat,
	actionsControllerHarm,
	actionsControllerSubmitFollowUp,
	sessionsControllerCheckIn,
	sessionsControllerCheckOut,
} from "@repo/monitabits-kubb/server";
import { revalidatePath } from "next/cache";
import { getApiHeaders } from "../../utils/api-headers";

/**
 * Server Action to record a cheat action.
 * Called when user admits to cheating during lockdown.
 */
export async function recordCheat(): Promise<{ success: boolean; error?: string }> {
	try {
		const headers = await getApiHeaders();
		await actionsControllerCheat({ headers });
		revalidatePath("/");
		return { success: true };
	} catch (error) {
		console.error("Failed to record cheat:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to record action",
		};
	}
}

/**
 * Server Action to record a harm action.
 * Called when user chooses to harm themselves (start new lockdown).
 */
export async function recordHarm(): Promise<{ success: boolean; error?: string }> {
	try {
		const headers = await getApiHeaders();
		await actionsControllerHarm({ headers });
		revalidatePath("/");
		return { success: true };
	} catch (error) {
		console.error("Failed to record harm:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to record action",
		};
	}
}

/**
 * Server Action to perform check-in.
 * Called when user opens the app or page becomes visible.
 */
export async function performCheckIn(): Promise<{ success: boolean; error?: string }> {
	try {
		const headers = await getApiHeaders();
		await sessionsControllerCheckIn({ headers });
		revalidatePath("/");
		return { success: true };
	} catch (error) {
		console.error("Failed to check in:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to check in",
		};
	}
}

/**
 * Server Action to perform check-out.
 * Called when user leaves the app or page becomes hidden.
 */
export async function performCheckOut(): Promise<{ success: boolean; error?: string }> {
	try {
		const headers = await getApiHeaders();
		await sessionsControllerCheckOut({ headers });
		return { success: true };
	} catch (error) {
		console.error("Failed to check out:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to check out",
		};
	}
}

/**
 * Server Action to submit a follow-up reflection answer.
 * Called when user submits a reflection answer.
 */
export async function submitFollowUp(
	answer: string,
	harmIds: string[] = [],
): Promise<{ success: boolean; error?: string }> {
	try {
		const headers = await getApiHeaders();
		await actionsControllerSubmitFollowUp({ answer, harmIds }, { headers });
		revalidatePath("/");
		return { success: true };
	} catch (error) {
		console.error("Failed to submit follow-up:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to submit reflection",
		};
	}
}

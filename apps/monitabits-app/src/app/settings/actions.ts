"use server";

import { settingsControllerUpdateSettings } from "@repo/monitabits-kubb/server";
import { logger } from "@repo/utils/logger";
import { revalidatePath } from "next/cache";
import { getApiHeaders } from "../../utils/api-headers";

interface UpdateSettingsResult {
	readonly success: boolean;
	readonly error?: string;
}

/**
 * Server Action to update Pomodoro timer settings.
 */
export async function updateSettings(
	workMinutes: number,
	shortBreakMinutes: number,
	longBreakMinutes: number,
): Promise<UpdateSettingsResult> {
	// Validate input
	if (workMinutes < 1 || workMinutes > 120) {
		return {
			success: false,
			error: "Work duration must be between 1 and 120 minutes",
		};
	}
	if (shortBreakMinutes < 1 || shortBreakMinutes > 60) {
		return {
			success: false,
			error: "Short break must be between 1 and 60 minutes",
		};
	}
	if (longBreakMinutes < 1 || longBreakMinutes > 120) {
		return {
			success: false,
			error: "Long break must be between 1 and 120 minutes",
		};
	}

	try {
		const headers = await getApiHeaders();
		await settingsControllerUpdateSettings(
			{ workMinutes, shortBreakMinutes, longBreakMinutes },
			{ headers },
		);
		revalidatePath("/settings");
		revalidatePath("/");
		return { success: true };
	} catch (error) {
		logger.error("Failed to update settings:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to update settings",
		};
	}
}

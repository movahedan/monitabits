"use server";

import { settingsControllerUpdateSettings } from "@repo/monitabits-kubb/server";
import { revalidatePath } from "next/cache";
import { getApiHeaders } from "../../utils/api-headers";

interface UpdateSettingsResult {
	readonly success: boolean;
	readonly error?: string;
}

/**
 * Server Action to update user settings.
 * @param lockdownMinutes - The new lockdown period in minutes (1-10080)
 */
export async function updateSettings(lockdownMinutes: number): Promise<UpdateSettingsResult> {
	// Validate input
	if (lockdownMinutes < 1 || lockdownMinutes > 10080) {
		return {
			success: false,
			error: "Lockdown period must be between 1 and 10,080 minutes",
		};
	}

	try {
		const headers = await getApiHeaders();
		await settingsControllerUpdateSettings({ lockdownMinutes }, { headers });
		revalidatePath("/settings");
		revalidatePath("/");
		return { success: true };
	} catch (error) {
		console.error("Failed to update settings:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to update settings",
		};
	}
}

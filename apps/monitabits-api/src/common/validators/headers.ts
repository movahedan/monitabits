import { z } from "zod";

export const deviceIdSchema = z.string().uuid("Device ID must be a valid UUID");

export const clientTimeSchema = z
	.string()
	.datetime("Client time must be a valid ISO-8601 datetime string");

const MAX_TIME_DIFF_MS = 5 * 60 * 1000;

export function validateDeviceId(header: string | undefined): string {
	if (!header || header.trim().length === 0) {
		throw new Error("Device ID is required");
	}

	const trimmed = header.trim();
	const result = deviceIdSchema.safeParse(trimmed);

	if (!result.success) {
		throw new Error(`Invalid device ID: ${result.error.issues[0]?.message ?? "Invalid UUID"}`);
	}

	return result.data;
}

export function validateClientTime(header: string | undefined): Date {
	if (!header) {
		throw new Error("X-Client-Time header is required");
	}

	const result = clientTimeSchema.safeParse(header);

	if (!result.success) {
		throw new Error(
			`Invalid date format in X-Client-Time header: ${result.error.issues[0]?.message ?? "Expected ISO-8601 format"}`,
		);
	}

	const clientTime = new Date(result.data);
	const serverTime = new Date();

	if (Number.isNaN(clientTime.getTime())) {
		throw new Error("Invalid date format in X-Client-Time header. Expected ISO-8601 format.");
	}

	const timeDiff = Math.abs(serverTime.getTime() - clientTime.getTime());

	if (timeDiff > MAX_TIME_DIFF_MS) {
		throw new Error("Time validation failed. Please ensure your device time is correct.");
	}

	return clientTime;
}

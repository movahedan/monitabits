import { cookies } from "next/headers";

/**
 * Get API headers with device ID from cookies.
 * Use this in server components and server actions to pass device identification to API calls.
 */
export async function getApiHeaders(): Promise<{ "X-Device-Id": string }> {
	const cookieStore = await cookies();
	const deviceId = cookieStore.get("monitabits_device_id")?.value;

	// If device ID doesn't exist, generate one and set it
	// Note: In Next.js App Router, we can't set cookies in server components
	// The proxy middleware should handle this, but as a fallback we'll throw
	if (!deviceId || deviceId.trim().length === 0) {
		throw new Error("Device ID not found. Please refresh the page to initialize your device.");
	}

	return { "X-Device-Id": deviceId };
}

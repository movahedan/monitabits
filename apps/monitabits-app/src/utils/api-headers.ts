import { cookies } from "next/headers";

/**
 * Get API headers with device ID from cookies.
 * Use this in server components and server actions to pass device identification to API calls.
 */
export async function getApiHeaders(): Promise<{ "X-Device-Id": string }> {
	const cookieStore = await cookies();
	const deviceId = cookieStore.get("monitabits_device_id")?.value ?? "";
	return { "X-Device-Id": deviceId };
}

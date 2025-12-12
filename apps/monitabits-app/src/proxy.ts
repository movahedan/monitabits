import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Middleware to ensure device ID cookie exists for all requests.
 * This enables both SSR and client-side requests to share the same device identifier.
 */
export function proxy(request: NextRequest) {
	const response = NextResponse.next();

	if (!request.cookies.get("monitabits_device_id")) {
		response.cookies.set("monitabits_device_id", crypto.randomUUID(), {
			httpOnly: false, // Allow client JS to read for debugging
			sameSite: "strict",
			maxAge: 60 * 60 * 24 * 365, // 1 year
		});
	}

	return response;
}

/**
 * Match all routes except static files and API routes
 */
export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js).*)"],
};

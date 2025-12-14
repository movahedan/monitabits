import { logger } from "@repo/utils/logger";

/**
 * Register the service worker for PWA functionality
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
	if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
		return null;
	}

	try {
		const registration = await navigator.serviceWorker.register("/sw.js", {
			scope: "/",
		});

		// Check for updates periodically
		setInterval(
			() => {
				registration.update();
			},
			60 * 60 * 1000,
		); // Check every hour

		return registration;
	} catch (error) {
		logger.error("Service Worker registration failed:", error);
		return null;
	}
}

/**
 * Unregister all service workers
 */
export async function unregisterServiceWorkers(): Promise<void> {
	if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
		return;
	}

	const registrations = await navigator.serviceWorker.getRegistrations();
	for (const registration of registrations) {
		await registration.unregister();
	}
}

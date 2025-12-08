"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "../../utils/register-sw";

interface ProvidersProps {
	readonly children: React.ReactNode;
}

/**
 * Client providers wrapper for the application.
 * Handles service worker registration and other client-side providers.
 */
export function Providers({ children }: ProvidersProps) {
	useEffect(() => {
		// Only register service worker in production
		if (process.env.NODE_ENV === "production") {
			registerServiceWorker();
		}
	}, []);

	return <>{children}</>;
}

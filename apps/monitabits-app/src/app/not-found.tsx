import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Page Not Found | Monitabits",
	description: "The page you are looking for does not exist",
};

/**
 * Custom 404 page displayed when a route is not found.
 */
export default function NotFound() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center p-4">
			<div className="w-full max-w-md text-center">
				<div className="mb-6 text-6xl">🔍</div>
				<h1 className="mb-2 text-2xl font-bold">Page not found</h1>
				<p className="mb-6 text-muted-foreground">
					The page you are looking for does not exist or has been moved.
				</p>
				<a
					href="/"
					className="inline-block rounded-lg bg-gray-900 px-6 py-3 font-medium text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
				>
					Go to Dashboard
				</a>
			</div>
		</div>
	);
}

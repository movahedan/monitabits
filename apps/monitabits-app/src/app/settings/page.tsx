import { settingsControllerGetSettings } from "@repo/monitabits-kubb/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/atoms";
import { getApiHeaders } from "../../utils/api-headers";
import { SettingsForm } from "./_components/settings-form";

export const metadata = {
	title: "Settings | Pomodoro Timer",
	description: "Configure your Pomodoro timer durations",
};

/**
 * Settings page - Server Component
 * Fetches initial settings data on the server for fast first paint.
 */
export default async function SettingsPage() {
	// Fetch settings on the server with device ID from cookies
	const headers = await getApiHeaders();
	const settings = await settingsControllerGetSettings({ headers });
	const workMinutes = settings?.workMinutes ?? 25;
	const shortBreakMinutes = settings?.shortBreakMinutes ?? 5;
	const longBreakMinutes = settings?.longBreakMinutes ?? 15;

	return (
		<main className="flex min-h-screen flex-col items-center justify-center p-4">
			<div className="w-full max-w-md">
				{/* Back link */}
				<a
					href="/"
					className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:underline"
				>
					<svg
						className="mr-1 h-4 w-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M15 19l-7-7 7-7"
						/>
					</svg>
					Back to Timer
				</a>

				<Card>
					<CardHeader>
						<CardTitle>Settings</CardTitle>
						<CardDescription>Configure your Pomodoro timer durations</CardDescription>
					</CardHeader>
					<CardContent>
						<SettingsForm
							initialWorkMinutes={workMinutes}
							initialShortBreakMinutes={shortBreakMinutes}
							initialLongBreakMinutes={longBreakMinutes}
						/>
					</CardContent>
				</Card>
			</div>
		</main>
	);
}

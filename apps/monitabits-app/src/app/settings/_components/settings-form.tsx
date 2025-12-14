"use client";

import { Button, Input, Label } from "@repo/ui/atoms";
import { useId, useState, useTransition } from "react";
import { updateSettings } from "../actions";

interface SettingsFormProps {
	readonly initialWorkMinutes: number;
	readonly initialShortBreakMinutes: number;
	readonly initialLongBreakMinutes: number;
}

/**
 * Settings form with Server Actions.
 * Receives initial settings from server and handles updates via Server Actions.
 */
export function SettingsForm({
	initialWorkMinutes,
	initialShortBreakMinutes,
	initialLongBreakMinutes,
}: SettingsFormProps) {
	const [workMinutes, setWorkMinutes] = useState<number>(initialWorkMinutes);
	const [shortBreakMinutes, setShortBreakMinutes] = useState<number>(initialShortBreakMinutes);
	const [longBreakMinutes, setLongBreakMinutes] = useState<number>(initialLongBreakMinutes);
	const [hasChanges, setHasChanges] = useState(false);
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const workInputId = useId();
	const shortBreakInputId = useId();
	const longBreakInputId = useId();

	const checkChanges = () => {
		const changed =
			workMinutes !== initialWorkMinutes ||
			shortBreakMinutes !== initialShortBreakMinutes ||
			longBreakMinutes !== initialLongBreakMinutes;
		setHasChanges(changed);
		setError(null);
		setSuccessMessage(null);
	};

	const handleWorkChange = (value: number) => {
		setWorkMinutes(value);
		checkChanges();
	};

	const handleShortBreakChange = (value: number) => {
		setShortBreakMinutes(value);
		checkChanges();
	};

	const handleLongBreakChange = (value: number) => {
		setLongBreakMinutes(value);
		checkChanges();
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setSuccessMessage(null);

		startTransition(async () => {
			const result = await updateSettings(workMinutes, shortBreakMinutes, longBreakMinutes);

			if (result.success) {
				setSuccessMessage("Settings saved successfully!");
				setHasChanges(false);
				setTimeout(() => setSuccessMessage(null), 3000);
			} else {
				setError(result.error ?? "Failed to update settings");
			}
		});
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6" suppressHydrationWarning>
			<div className="space-y-2">
				<Label htmlFor={workInputId}>Work Duration (minutes)</Label>
				<Input
					id={workInputId}
					type="number"
					min={1}
					max={120}
					value={workMinutes}
					onChange={(e) => handleWorkChange(Number(e.target.value))}
					className="w-full"
					suppressHydrationWarning
				/>
				<p className="text-sm text-muted-foreground">
					Standard Pomodoro work session (1-120 minutes)
				</p>
			</div>

			<div className="space-y-2">
				<Label htmlFor={shortBreakInputId}>Short Break (minutes)</Label>
				<Input
					id={shortBreakInputId}
					type="number"
					min={1}
					max={60}
					value={shortBreakMinutes}
					onChange={(e) => handleShortBreakChange(Number(e.target.value))}
					className="w-full"
					suppressHydrationWarning
				/>
				<p className="text-sm text-muted-foreground">Break between work sessions (1-60 minutes)</p>
			</div>

			<div className="space-y-2">
				<Label htmlFor={longBreakInputId}>Long Break (minutes)</Label>
				<Input
					id={longBreakInputId}
					type="number"
					min={1}
					max={120}
					value={longBreakMinutes}
					onChange={(e) => handleLongBreakChange(Number(e.target.value))}
					className="w-full"
					suppressHydrationWarning
				/>
				<p className="text-sm text-muted-foreground">
					Extended break after multiple sessions (1-120 minutes)
				</p>
			</div>

			{error && (
				<div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
					{error}
				</div>
			)}

			{successMessage && (
				<div className="rounded-lg bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400">
					{successMessage}
				</div>
			)}

			<Button type="submit" disabled={!hasChanges || isPending} className="w-full">
				{isPending ? "Saving..." : "Save Settings"}
			</Button>
		</form>
	);
}

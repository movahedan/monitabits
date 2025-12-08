"use client";

import { Button, Input, Label } from "@repo/ui/atoms";
import { useId, useState, useTransition } from "react";
import { updateSettings } from "../actions";

interface SettingsFormProps {
	readonly initialLockdownMinutes: number;
}

/**
 * Settings form with Server Actions.
 * Receives initial settings from server and handles updates via Server Actions.
 */
export function SettingsForm({ initialLockdownMinutes }: SettingsFormProps) {
	const [lockdownMinutes, setLockdownMinutes] = useState<number>(initialLockdownMinutes);
	const [hasChanges, setHasChanges] = useState(false);
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const lockdownInputId = useId();

	const handleChange = (value: number) => {
		setLockdownMinutes(value);
		setHasChanges(value !== initialLockdownMinutes);
		setError(null);
		setSuccessMessage(null);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setSuccessMessage(null);

		startTransition(async () => {
			const result = await updateSettings(lockdownMinutes);

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
		<form onSubmit={handleSubmit} className="space-y-6">
			<div className="space-y-2">
				<Label htmlFor={lockdownInputId}>Lockdown Period (minutes)</Label>
				<Input
					id={lockdownInputId}
					type="number"
					min={1}
					max={10080}
					value={lockdownMinutes}
					onChange={(e) => handleChange(Number(e.target.value))}
					className="w-full"
				/>
				<p className="text-sm text-muted-foreground">
					How long you need to wait before you can smoke again (1 - 10,080 minutes / 1 week max)
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

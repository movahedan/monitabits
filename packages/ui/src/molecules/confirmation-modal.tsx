"use client";

import { useCallback, useEffect, useId } from "react";

interface ConfirmationModalProps {
	readonly isOpen: boolean;
	readonly type: "cheat" | "harm";
	readonly isLoading: boolean;
	readonly onConfirm: () => void;
	readonly onCancel: () => void;
}

const modalContent = {
	cheat: {
		title: "Confirm Action",
		description:
			"You are about to log that you cheated during the lockdown period. This action will be recorded.",
		confirmText: "Yes, I Cheated",
	},
	harm: {
		title: "Confirm Action",
		description:
			"You are about to start a new lockdown period. This means you are choosing to smoke and will need to wait before making another choice.",
		confirmText: "Yes, Start Lockdown",
	},
};

export function ConfirmationModal({
	isOpen,
	type,
	isLoading,
	onConfirm,
	onCancel,
}: ConfirmationModalProps) {
	const content = modalContent[type];
	const titleId = useId();
	const descriptionId = useId();

	// Handle escape key
	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === "Escape" && isOpen && !isLoading) {
				onCancel();
			}
		},
		[isOpen, isLoading, onCancel],
	);

	useEffect(() => {
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [handleKeyDown]);

	// Prevent body scroll when modal is open
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [isOpen]);

	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center"
			role="dialog"
			aria-modal="true"
			aria-labelledby={titleId}
			aria-describedby={descriptionId}
		>
			{/* Backdrop */}
			<button
				type="button"
				className="absolute inset-0 bg-black/50 backdrop-blur-sm"
				onClick={isLoading ? undefined : onCancel}
				disabled={isLoading}
				aria-label="Close modal"
			/>

			{/* Modal */}
			<div className="relative z-10 mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
				<h2 id={titleId} className="text-xl font-semibold">
					{content.title}
				</h2>
				<p id={descriptionId} className="mt-2 text-muted-foreground">
					{content.description}
				</p>

				<div className="mt-6 flex gap-3">
					<button
						type="button"
						onClick={onCancel}
						disabled={isLoading}
						className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={onConfirm}
						disabled={isLoading}
						className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50"
					>
						{isLoading ? "Processing..." : content.confirmText}
					</button>
				</div>
			</div>
		</div>
	);
}

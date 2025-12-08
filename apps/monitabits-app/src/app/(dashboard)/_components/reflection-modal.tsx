"use client";

import { useActionsControllerGetPendingFollowUp } from "@repo/monitabits-kubb/hooks";
import { Button, Input, Label } from "@repo/ui/atoms";
import { useCallback, useEffect, useId, useState } from "react";
import { submitFollowUp } from "../actions";

interface ReflectionModalProps {
	/** Callback when the modal is closed */
	readonly onClose?: () => void;
}

/**
 * Reflection modal that appears when there are pending follow-up questions.
 * Polls for pending questions and displays them to the user.
 */
export function ReflectionModal({ onClose }: ReflectionModalProps) {
	const { data, mutate } = useActionsControllerGetPendingFollowUp();
	const [answer, setAnswer] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const titleId = useId();
	const answerId = useId();

	// Show modal when there's a pending question
	useEffect(() => {
		if (data?.hasPending && data?.question) {
			setIsOpen(true);
		}
	}, [data?.hasPending, data?.question]);

	const handleClose = useCallback(() => {
		setIsOpen(false);
		setAnswer("");
		onClose?.();
	}, [onClose]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!answer.trim()) return;

		setIsSubmitting(true);
		try {
			const result = await submitFollowUp(answer.trim(), []);
			if (result.success) {
				await mutate();
				handleClose();
			} else {
				console.error("Failed to submit reflection:", result.error);
			}
		} catch (err) {
			console.error("Failed to submit reflection:", err);
		} finally {
			setIsSubmitting(false);
		}
	};

	// Handle escape key
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && isOpen && !isSubmitting) {
				handleClose();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, isSubmitting, handleClose]);

	if (!isOpen || !data?.hasPending || !data?.question) {
		return null;
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center"
			role="dialog"
			aria-modal="true"
			aria-labelledby={titleId}
		>
			{/* Backdrop */}
			<button
				type="button"
				className="absolute inset-0 bg-black/50 backdrop-blur-sm"
				onClick={isSubmitting ? undefined : handleClose}
				disabled={isSubmitting}
				aria-label="Close modal"
			/>

			{/* Modal */}
			<div className="relative z-10 mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
				<div className="mb-4 text-center">
					<span className="text-4xl" aria-hidden="true">
						💭
					</span>
				</div>

				<h2 id={titleId} className="text-center text-xl font-semibold">
					Time for Reflection
				</h2>

				<p className="mt-2 text-center text-muted-foreground">
					Taking a moment to reflect helps you understand your patterns.
				</p>

				<form onSubmit={handleSubmit} className="mt-6 space-y-4">
					<div className="space-y-2">
						<Label htmlFor={answerId} className="text-base font-medium">
							{data.question.text}
						</Label>
						<Input
							id={answerId}
							type="text"
							placeholder="Your answer..."
							value={answer}
							onChange={(e) => setAnswer(e.target.value)}
							className="w-full"
							autoFocus
						/>
					</div>

					<div className="flex gap-3">
						<Button
							type="button"
							variant="outline"
							onClick={handleClose}
							disabled={isSubmitting}
							className="flex-1"
						>
							Skip
						</Button>
						<Button type="submit" disabled={!answer.trim() || isSubmitting} className="flex-1">
							{isSubmitting ? "Submitting..." : "Submit"}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}

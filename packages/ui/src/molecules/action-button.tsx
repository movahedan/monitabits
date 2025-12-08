"use client";

import { cn } from "@repo/utils/cn";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

const actionButtonVariants = cva(
	"inline-flex items-center justify-center rounded-lg px-6 py-4 text-base font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
	{
		variants: {
			variant: {
				cheat:
					"border-2 border-red-500 bg-transparent text-red-600 hover:bg-red-50 focus:ring-red-500 dark:border-red-600 dark:text-red-500 dark:hover:bg-red-950/30",
				harm: "bg-red-600 text-white shadow-lg hover:bg-red-700 focus:ring-red-500 dark:bg-red-700 dark:hover:bg-red-800",
			},
		},
		defaultVariants: {
			variant: "harm",
		},
	},
);

interface ActionButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof actionButtonVariants> {
	/** Loading state */
	readonly isLoading?: boolean;
}

/**
 * ActionButton component for quit-smoking actions
 * - "cheat" variant: Outlined red button for "I cheated" (when locked)
 * - "harm" variant: Filled red button for "I'm choosing to harm myself" (when active)
 */
export function ActionButton({
	className,
	variant,
	isLoading,
	disabled,
	children,
	...props
}: ActionButtonProps) {
	return (
		<button
			type="button"
			className={cn(actionButtonVariants({ variant, className }))}
			disabled={disabled || isLoading}
			{...props}
		>
			{isLoading ? (
				<>
					<svg
						className="mr-2 h-5 w-5 animate-spin"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<circle
							className="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							strokeWidth="4"
						/>
						<path
							className="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						/>
					</svg>
					Processing...
				</>
			) : (
				children
			)}
		</button>
	);
}

export { actionButtonVariants };

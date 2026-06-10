import type { HTMLAttributes } from "react"
import { cn } from "../../lib/utils"

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
	variant?: "default" | "secondary" | "outline"
}

const variants = {
	default: "bg-primary/20 text-primary border-primary/30",
	secondary: "bg-secondary text-secondary-foreground border-secondary",
	outline: "bg-transparent text-foreground border-border",
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
				"transition-colors",
				variants[variant],
				className,
			)}
			{...props}
		/>
	)
}

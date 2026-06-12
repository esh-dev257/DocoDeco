import { type ButtonHTMLAttributes, forwardRef } from "react"
import { cn } from "../../lib/utils"

// Decision: Hand-crafted UI primitives following shadcn/ui patterns.
// No CLI dependency- every line is explainable in the interview.

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "default" | "secondary" | "destructive" | "outline" | "ghost"
	size?: "default" | "sm" | "lg" | "icon"
}

const variants = {
	default:
		"bg-primary text-primary-foreground border-2 border-foreground shadow-[3px_3px_0_#0a0a0a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_#0a0a0a] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
	secondary:
		"bg-secondary text-secondary-foreground border-2 border-foreground shadow-[3px_3px_0_#0a0a0a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_#0a0a0a]",
	destructive:
		"bg-destructive text-destructive-foreground border-2 border-foreground shadow-[3px_3px_0_#0a0a0a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_#0a0a0a]",
	outline:
		"bg-transparent border-2 border-foreground shadow-[3px_3px_0_#0a0a0a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_#0a0a0a] hover:bg-muted",
	ghost: "hover:bg-muted border-2 border-transparent",
}

const sizes = {
	default: "h-10 px-4 py-2",
	sm: "h-8 px-3 text-sm",
	lg: "h-12 px-6 text-base",
	icon: "h-10 w-10",
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant = "default", size = "default", disabled, ...props }, ref) => {
		return (
			<button
				ref={ref}
				className={cn(
					"inline-flex items-center justify-center gap-2 rounded-md font-bold",
					"transition-all duration-100 ease-out",
					"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
					"disabled:pointer-events-none disabled:opacity-50",
					"cursor-pointer",
					variants[variant],
					sizes[size],
					className,
				)}
				disabled={disabled}
				{...props}
			/>
		)
	},
)
Button.displayName = "Button"

import { type ButtonHTMLAttributes, forwardRef } from "react"
import { cn } from "../../lib/utils"

// Decision: Hand-crafted UI primitives following shadcn/ui patterns.
// No CLI dependency- every line is explainable in the interview.

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "default" | "secondary" | "destructive" | "outline" | "ghost"
	size?: "default" | "sm" | "lg" | "icon"
}

const variants = {
	// Black bg + yellow shadow — docodego.com primary CTA style
	default:
		"bg-foreground text-background border-2 border-foreground shadow-do hover:translate-x-1 hover:translate-y-1 hover:shadow-none active:translate-x-1 active:translate-y-1",
	// White bg + black shadow
	secondary:
		"bg-background text-foreground border-2 border-foreground shadow-nb hover:translate-x-1 hover:translate-y-1 hover:shadow-none",
	// Rose bg + black shadow
	destructive:
		"bg-destructive text-destructive-foreground border-2 border-foreground shadow-nb hover:translate-x-1 hover:translate-y-1 hover:shadow-none",
	// White bg + small black shadow
	outline:
		"bg-background border-2 border-foreground shadow-nb-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none hover:bg-muted",
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
					"inline-flex items-center justify-center gap-2 font-black uppercase tracking-wide text-xs",
					"transition-none",
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

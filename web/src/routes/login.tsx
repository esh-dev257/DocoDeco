import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { toast } from "sonner"
import { Input } from "~/components/ui/input"
import { Wordmark } from "~/components/ui/wordmark"
import { isAuthenticated, useAuth } from "~/lib/auth"

export const Route = createFileRoute("/login")({
	beforeLoad: () => {
		if (isAuthenticated()) throw redirect({ to: "/dashboard" })
	},
	component: LoginPage,
})

function LoginPage() {
	const [email, setEmail] = useState("")
	const [loading, setLoading] = useState(false)
	const { login } = useAuth()
	const navigate = useNavigate()

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!email.trim()) return
		setLoading(true)
		try {
			await login(email.trim())
			navigate({ to: "/dashboard" })
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Login failed")
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
			<div className="w-full max-w-sm animate-in">
				{/* Wordmark */}
				<div className="flex justify-center mb-8">
					<Wordmark size="lg" />
				</div>

				{/* Heading */}
				<div className="mb-8 text-center">
					<h1 className="text-3xl sm:text-4xl font-black text-foreground leading-tight tracking-tight">
						Build branded
						<br />
						surveys. Fast.
					</h1>
					<p className="text-muted-foreground mt-3 text-sm font-mono">
						No password needed — just your email.
					</p>
				</div>

				{/* Form card */}
				<div className="bg-background border-4 border-foreground p-6 shadow-nb-xl">
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-1.5">
							<label
								className="text-[10px] font-black uppercase tracking-widest font-mono"
								htmlFor="email"
							>
								Email address
							</label>
							<Input
								id="email"
								type="email"
								placeholder="you@example.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								autoFocus
								className="border-2 border-foreground h-12 text-base focus-visible:ring-0 focus-visible:border-foreground shadow-nb-sm font-mono"
							/>
						</div>
						<button
							type="submit"
							disabled={loading}
							className="w-full h-12 font-black text-sm uppercase tracking-wide bg-foreground text-background border-2 border-foreground disabled:opacity-50 transition-none shadow-do hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
						>
							{loading ? "Signing in…" : "Continue →"}
						</button>
					</form>
				</div>

				{/* Footer note */}
				<p className="text-center text-xs font-mono text-muted-foreground mt-6">
					Document · Compose · Demonstrate · Govern
				</p>
			</div>
		</div>
	)
}

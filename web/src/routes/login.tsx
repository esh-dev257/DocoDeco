import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { toast } from "sonner"
import { Input } from "~/components/ui/input"
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
		<div className="min-h-screen gradient-mesh flex items-center justify-center p-6">
			<div className="w-full max-w-md animate-in">
				<div className="mb-8">
					<div
						className="inline-flex items-center gap-3 bg-primary border-2 border-foreground px-4 py-2 mb-6"
						style={{ boxShadow: "4px 4px 0 #0a0a0a" }}
					>
						<span className="text-2xl">📋</span>
						<span className="font-bold text-xl text-foreground">DoCoDeGo</span>
					</div>
					<h1 className="text-4xl font-bold text-foreground leading-tight">
						Build beautiful
						<br />
						branded surveys.
					</h1>
					<p className="text-muted-foreground mt-2 font-medium">
						No password needed- just your email.
					</p>
				</div>

				<div
					className="bg-white border-2 border-foreground p-6"
					style={{ boxShadow: "6px 6px 0 #0a0a0a" }}
				>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-1.5">
							<label className="text-sm font-bold uppercase tracking-wide" htmlFor="email">
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
								className="border-2 border-foreground rounded-none h-12 text-base focus-visible:ring-0 focus-visible:border-foreground"
								style={{ boxShadow: "3px 3px 0 #0a0a0a" }}
							/>
						</div>
						<button
							type="submit"
							disabled={loading}
							className="w-full h-12 font-bold text-base bg-primary text-foreground border-2 border-foreground disabled:opacity-50 transition-all hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px]"
							style={{ boxShadow: loading ? "none" : "4px 4px 0 #0a0a0a" }}
						>
							{loading ? "Signing in…" : "Continue →"}
						</button>
					</form>
				</div>
			</div>
		</div>
	)
}

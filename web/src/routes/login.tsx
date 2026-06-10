import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "~/components/ui/button"
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
		<div className="min-h-screen gradient-mesh flex items-center justify-center p-4">
			<div className="w-full max-w-sm animate-in">
				<div className="text-center mb-8">
					<div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/20 mb-4 text-3xl">
						📋
					</div>
					<h1 className="text-2xl font-bold tracking-tight">DoCoDeGo</h1>
					<p className="text-muted-foreground mt-1 text-sm">Build beautiful branded surveys</p>
				</div>

				<div className="glass rounded-xl p-6 space-y-4">
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-1.5">
							<label className="text-sm font-medium" htmlFor="email">
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
							/>
						</div>
						<Button type="submit" className="w-full" size="lg" disabled={loading}>
							{loading ? "Signing in…" : "Continue with Email"}
						</Button>
					</form>
					<p className="text-xs text-muted-foreground text-center">
						No password needed — enter any email to get started
					</p>
				</div>
			</div>
		</div>
	)
}

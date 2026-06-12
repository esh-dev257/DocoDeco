import { Link, Outlet, createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import { Wordmark } from "~/components/ui/wordmark"
import { isAuthenticated, useAuth } from "~/lib/auth"

// Decision: dashboard.tsx is a layout route- its component wraps all /dashboard/*
// children via <Outlet />. Auth guard here applies to every child route.
export const Route = createFileRoute("/dashboard")({
	beforeLoad: () => {
		if (!isAuthenticated()) throw redirect({ to: "/login" })
	},
	component: DashboardLayout,
})

function DashboardLayout() {
	const { user, logout } = useAuth()
	const navigate = useNavigate()

	function handleLogout() {
		logout()
		navigate({ to: "/login" })
	}

	return (
		<div className="min-h-screen gradient-mesh">
			<header className="sticky top-0 z-50 bg-background border-b-4 border-foreground">
				<div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
					<Link to="/dashboard" aria-label="DoCoDeGo — Home">
						<Wordmark size="sm" />
					</Link>
					<div className="flex items-center gap-3">
						<span className="text-xs font-mono text-muted-foreground hidden sm:block truncate max-w-48">
							{user?.email}
						</span>
						<button
							type="button"
							onClick={handleLogout}
							className="text-xs font-black uppercase tracking-wide border-2 border-foreground px-3 py-1.5 bg-background shadow-nb-sm hover:bg-do hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-none"
						>
							Sign out
						</button>
					</div>
				</div>
			</header>
			<main className="max-w-6xl mx-auto px-4 py-8">
				<Outlet />
			</main>
		</div>
	)
}

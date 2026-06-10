import { Link, Outlet, createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import { isAuthenticated, useAuth } from "~/lib/auth"

// Decision: dashboard.tsx is a layout route — its component wraps all /dashboard/*
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
			<header className="border-b border-border/50 glass sticky top-0 z-50">
				<div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
					<Link
						to="/dashboard"
						className="font-bold text-lg tracking-tight hover:text-primary transition-colors"
					>
						DoCoDeGo
					</Link>
					<div className="flex items-center gap-4">
						<span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
						<button
							type="button"
							onClick={handleLogout}
							className="text-sm text-muted-foreground hover:text-foreground transition-colors"
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

import { Link, Outlet, createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
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
			<header className="sticky top-0 z-50 bg-foreground border-b-4 border-foreground">
				<div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
					<Link
						to="/dashboard"
						className="font-bold text-xl text-primary tracking-tight hover:opacity-80 transition-opacity"
					>
						DoCoDeGo ✦
					</Link>
					<div className="flex items-center gap-4">
						<span className="text-sm text-white/60 hidden sm:block">{user?.email}</span>
						<button
							type="button"
							onClick={handleLogout}
							className="text-sm font-bold border-2 border-primary text-primary px-3 py-1 hover:bg-primary hover:text-foreground transition-all"
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

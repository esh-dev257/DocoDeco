import { Outlet, createRootRoute } from "@tanstack/react-router"

// Minimal root- layout lives in dashboard.tsx, public pages are standalone
export const Route = createRootRoute({
	component: () => <Outlet />,
})

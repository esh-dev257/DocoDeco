import { RouterProvider } from "@tanstack/react-router"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { Toaster } from "sonner"
import { router } from "./router"
import "./app.css"

const rootEl = document.getElementById("root")
if (!rootEl) throw new Error("Root element not found")

createRoot(rootEl).render(
	<StrictMode>
		<RouterProvider router={router} />
		<Toaster position="bottom-right" richColors />
	</StrictMode>,
)

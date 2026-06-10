import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import { TanStackRouterVite } from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
	plugins: [
		// TanStack Router plugin must come before React plugin
		// It auto-generates the route tree from src/routes/ files
		TanStackRouterVite(),
		react(),
		tailwindcss(),
	],
	resolve: {
		alias: {
			"~": path.resolve(__dirname, "./src"),
		},
	},
	server: {
		port: 5173,
		// Proxy API requests to the Hono dev server
		proxy: {
			"/api": {
				target: "http://localhost:8787",
				changeOrigin: true,
			},
		},
	},
})

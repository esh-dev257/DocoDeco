import { Hono } from "hono"
import { cors } from "hono/cors"
import { authRoutes } from "./routes/auth"
import { publicRoutes } from "./routes/public"
import { questionRoutes } from "./routes/questions"
import { responseRoutes } from "./routes/responses"
import { surveyRoutes } from "./routes/surveys"
import type { Env } from "./types"

const app = new Hono<Env>()

// CORS for local dev- frontend on :5173, API on :8787
app.use(
	"/api/*",
	cors({
		origin: ["http://localhost:5173"],
		allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
	}),
)

// Health check- confirms D1 binding works
app.get("/api/health", async (c) => {
	try {
		const result = await c.env.DB.prepare("SELECT 1 as ok").first()
		return c.json({ status: "ok", db: result?.ok === 1, timestamp: Date.now() })
	} catch {
		return c.json({ status: "error", db: false, timestamp: Date.now() }, 500)
	}
})

// Mount route groups
app.route("/api/auth", authRoutes)
app.route("/api/surveys", surveyRoutes)
app.route("/api/surveys", questionRoutes) // handles /:id/questions/*
app.route("/api/surveys", responseRoutes) // handles /:id/responses
app.route("/api/public", publicRoutes)

export default app

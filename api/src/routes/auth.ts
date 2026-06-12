import { Hono } from "hono"
import { SignJWT } from "jose"
import { z } from "zod"
import { authMiddleware } from "../middleware/auth"
import type { Env } from "../types"

// Decision: Simple email-only auth- no password, no magic link.
// User enters email → backend creates user if not exists → returns JWT.
// Fast to build, easy to demo, easy to explain in walkthrough.

const loginSchema = z.object({
	email: z.string().email("Invalid email address"),
})

export const authRoutes = new Hono<Env>()

// POST /login- Create user if not exists, return JWT
authRoutes.post("/login", async (c) => {
	const body = await c.req.json().catch(() => null)
	if (!body) return c.json({ error: "Invalid JSON body" }, 400)

	const parsed = loginSchema.safeParse(body)
	if (!parsed.success) {
		return c.json({ error: parsed.error.issues[0].message }, 400)
	}

	const { email } = parsed.data
	const db = c.env.DB

	// Upsert user- check existence first, create if needed
	let user = await db
		.prepare("SELECT id, email, created_at FROM users WHERE email = ?")
		.bind(email)
		.first()

	if (!user) {
		user = await db
			.prepare("INSERT INTO users (email) VALUES (?) RETURNING id, email, created_at")
			.bind(email)
			.first()

		if (!user) return c.json({ error: "Failed to create user" }, 500)
	}

	// Sign JWT- 7 day expiry, HS256
	const secret = new TextEncoder().encode(c.env.JWT_SECRET)
	const token = await new SignJWT({ email: user.email as string })
		.setSubject(user.id as string)
		.setIssuedAt()
		.setExpirationTime("7d")
		.setProtectedHeader({ alg: "HS256" })
		.sign(secret)

	return c.json({
		token,
		user: {
			id: user.id,
			email: user.email,
			createdAt: user.created_at,
		},
	})
})

// POST /logout- Client clears token; server-side is a no-op
authRoutes.post("/logout", (c) => {
	return c.json({ success: true })
})

// GET /me- Return current user from JWT (requires auth)
authRoutes.get("/me", authMiddleware, async (c) => {
	const userId = c.get("userId")
	const db = c.env.DB

	const user = await db
		.prepare("SELECT id, email, created_at FROM users WHERE id = ?")
		.bind(userId)
		.first()

	if (!user) return c.json({ error: "User not found" }, 404)

	return c.json({
		user: {
			id: user.id,
			email: user.email,
			createdAt: user.created_at,
		},
	})
})

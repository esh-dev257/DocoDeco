import { createMiddleware } from "hono/factory"
import { jwtVerify } from "jose"
import type { Env } from "../types"

// Decision: Simple JWT auth- no magic link, no password, no email verification.
// Trade-off: anyone can claim any email (no verification step), but this is
// acceptable for a demo/take-home. In production, add email verification.
// JWT is verified on every protected request using the HS256 algorithm.

export const authMiddleware = createMiddleware<Env>(async (c, next) => {
	const header = c.req.header("Authorization")
	if (!header?.startsWith("Bearer ")) {
		return c.json({ error: "Missing or invalid Authorization header" }, 401)
	}

	const token = header.slice(7)
	try {
		const secret = new TextEncoder().encode(c.env.JWT_SECRET)
		const { payload } = await jwtVerify(token, secret)

		if (typeof payload.sub !== "string" || typeof payload.email !== "string") {
			return c.json({ error: "Invalid token payload" }, 401)
		}

		c.set("userId", payload.sub)
		c.set("email", payload.email as string)
		await next()
	} catch {
		return c.json({ error: "Invalid or expired token" }, 401)
	}
})

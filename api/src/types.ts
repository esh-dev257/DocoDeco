// Decision: Centralize Hono env types so all route files share the same shape.
// Bindings = Cloudflare Worker bindings (D1, env vars).
// Variables = request-scoped values set by middleware (auth user).

export type Bindings = {
	DB: D1Database
	JWT_SECRET: string
}

export type Variables = {
	userId: string
	email: string
}

export type Env = { Bindings: Bindings; Variables: Variables }

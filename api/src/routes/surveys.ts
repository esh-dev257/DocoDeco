import { Hono } from "hono"
import { z } from "zod"
import { formatQuestion, formatSurvey } from "../db/client"
import { authMiddleware } from "../middleware/auth"
import type { Env } from "../types"

const createSurveySchema = z.object({
	title: z.string().min(1, "Title is required").max(200),
	description: z.string().max(1000).optional(),
})

const updateSurveySchema = z.object({
	title: z.string().min(1).max(200).optional(),
	description: z.string().max(1000).nullable().optional(),
	brandColor: z
		.string()
		.regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color")
		.optional(),
	brandLogoUrl: z.string().url().nullable().optional(),
	isActive: z.boolean().optional(),
})

export const surveyRoutes = new Hono<Env>()

// All survey routes require authentication
surveyRoutes.use("/*", authMiddleware)

// GET / — List user's surveys with response counts
surveyRoutes.get("/", async (c) => {
	const userId = c.get("userId")
	const db = c.env.DB

	const { results } = await db
		.prepare(
			`SELECT s.*, COUNT(r.id) as response_count
       FROM surveys s
       LEFT JOIN responses r ON r.survey_id = s.id
       WHERE s.owner_id = ?
       GROUP BY s.id
       ORDER BY s.created_at DESC`,
		)
		.bind(userId)
		.all()

	return c.json({ surveys: results.map(formatSurvey) })
})

// POST / — Create a new survey
surveyRoutes.post("/", async (c) => {
	const body = await c.req.json().catch(() => null)
	if (!body) return c.json({ error: "Invalid JSON body" }, 400)

	const parsed = createSurveySchema.safeParse(body)
	if (!parsed.success) {
		return c.json({ error: parsed.error.issues[0].message }, 400)
	}

	const userId = c.get("userId")
	const db = c.env.DB
	const { title, description } = parsed.data

	const survey = await db
		.prepare("INSERT INTO surveys (owner_id, title, description) VALUES (?, ?, ?) RETURNING *")
		.bind(userId, title, description ?? null)
		.first()

	if (!survey) return c.json({ error: "Failed to create survey" }, 500)

	return c.json(formatSurvey(survey), 201)
})

// GET /:id — Get survey with questions (must own)
surveyRoutes.get("/:id", async (c) => {
	const surveyId = c.req.param("id")
	const userId = c.get("userId")
	const db = c.env.DB

	// Decision: Return 404 for both "not found" and "not yours" to avoid
	// leaking survey existence to other users
	const survey = await db
		.prepare("SELECT * FROM surveys WHERE id = ? AND owner_id = ?")
		.bind(surveyId, userId)
		.first()

	if (!survey) return c.json({ error: "Survey not found" }, 404)

	const { results: questions } = await db
		.prepare("SELECT * FROM questions WHERE survey_id = ? ORDER BY order_index ASC")
		.bind(surveyId)
		.all()

	return c.json({
		...formatSurvey(survey),
		questions: questions.map(formatQuestion),
	})
})

// PATCH /:id — Update survey (must own)
surveyRoutes.patch("/:id", async (c) => {
	const surveyId = c.req.param("id")
	const userId = c.get("userId")
	const db = c.env.DB

	const existing = await db
		.prepare("SELECT id FROM surveys WHERE id = ? AND owner_id = ?")
		.bind(surveyId, userId)
		.first()
	if (!existing) return c.json({ error: "Survey not found" }, 404)

	const body = await c.req.json().catch(() => null)
	if (!body) return c.json({ error: "Invalid JSON body" }, 400)

	const parsed = updateSurveySchema.safeParse(body)
	if (!parsed.success) {
		return c.json({ error: parsed.error.issues[0].message }, 400)
	}

	const updates = parsed.data
	const setClauses: string[] = []
	const values: (string | number | null)[] = []

	if (updates.title !== undefined) {
		setClauses.push("title = ?")
		values.push(updates.title)
	}
	if (updates.description !== undefined) {
		setClauses.push("description = ?")
		values.push(updates.description)
	}
	if (updates.brandColor !== undefined) {
		setClauses.push("brand_color = ?")
		values.push(updates.brandColor)
	}
	if (updates.brandLogoUrl !== undefined) {
		setClauses.push("brand_logo_url = ?")
		values.push(updates.brandLogoUrl)
	}
	if (updates.isActive !== undefined) {
		setClauses.push("is_active = ?")
		values.push(updates.isActive ? 1 : 0)
	}

	if (setClauses.length === 0) {
		return c.json({ error: "No fields to update" }, 400)
	}

	// Always bump updated_at on mutation
	setClauses.push("updated_at = unixepoch()")
	values.push(surveyId)

	const survey = await db
		.prepare(`UPDATE surveys SET ${setClauses.join(", ")} WHERE id = ? RETURNING *`)
		.bind(...values)
		.first()

	if (!survey) return c.json({ error: "Failed to update survey" }, 500)

	return c.json(formatSurvey(survey))
})

// DELETE /:id — Delete survey (CASCADE deletes questions + responses)
surveyRoutes.delete("/:id", async (c) => {
	const surveyId = c.req.param("id")
	const userId = c.get("userId")
	const db = c.env.DB

	const existing = await db
		.prepare("SELECT id FROM surveys WHERE id = ? AND owner_id = ?")
		.bind(surveyId, userId)
		.first()
	if (!existing) return c.json({ error: "Survey not found" }, 404)

	await db.prepare("DELETE FROM surveys WHERE id = ?").bind(surveyId).run()

	return c.body(null, 204)
})

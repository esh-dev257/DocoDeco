import { Hono } from "hono"
import { z } from "zod"
import { formatQuestion } from "../db/client"
import { authMiddleware } from "../middleware/auth"
import type { Env } from "../types"

// Decision: Store question config as JSON column — simpler than separate tables
// per question type. {options:[...]} for MC, {max:5} for rating, {} for short_text.
// Trade-off: can't query config fields in SQL, but we never need to since
// config is always loaded with the question.
const questionConfigSchema = z.union([
	z.object({ options: z.array(z.string().min(1)).min(1) }), // multiple_choice
	z.object({ max: z.number().int().min(2).max(10) }), // rating
	z.object({}), // short_text
])

const createQuestionSchema = z.object({
	type: z.enum(["short_text", "multiple_choice", "rating"]),
	label: z.string().min(1, "Question label is required").max(500),
	required: z.boolean().optional().default(false),
	config: questionConfigSchema.optional().default({}),
})

const updateQuestionSchema = z.object({
	label: z.string().min(1).max(500).optional(),
	required: z.boolean().optional(),
	config: questionConfigSchema.optional(),
	type: z.enum(["short_text", "multiple_choice", "rating"]).optional(),
})

export const questionRoutes = new Hono<Env>()

// All question routes require authentication
questionRoutes.use("/*", authMiddleware)

// Helper: verify the current user owns the survey
async function verifySurveyOwnership(db: D1Database, surveyId: string, userId: string) {
	const survey = await db
		.prepare("SELECT id FROM surveys WHERE id = ? AND owner_id = ?")
		.bind(surveyId, userId)
		.first()
	return !!survey
}

// POST /:id/questions — Add a question to a survey
questionRoutes.post("/:id/questions", async (c) => {
	const surveyId = c.req.param("id")
	const userId = c.get("userId")
	const db = c.env.DB

	if (!(await verifySurveyOwnership(db, surveyId, userId))) {
		return c.json({ error: "Survey not found" }, 404)
	}

	const body = await c.req.json().catch(() => null)
	if (!body) return c.json({ error: "Invalid JSON body" }, 400)

	const parsed = createQuestionSchema.safeParse(body)
	if (!parsed.success) {
		return c.json({ error: parsed.error.issues[0].message }, 400)
	}

	const { type, label, required, config } = parsed.data

	// Auto-assign order_index as max+1 so new questions appear at the end
	const maxOrder = await db
		.prepare("SELECT COALESCE(MAX(order_index), -1) as max_idx FROM questions WHERE survey_id = ?")
		.bind(surveyId)
		.first<{ max_idx: number }>()
	const orderIndex = (maxOrder?.max_idx ?? -1) + 1

	const question = await db
		.prepare(
			`INSERT INTO questions (survey_id, type, label, required, order_index, config)
       VALUES (?, ?, ?, ?, ?, ?)
       RETURNING *`,
		)
		.bind(surveyId, type, label, required ? 1 : 0, orderIndex, JSON.stringify(config))
		.first()

	if (!question) return c.json({ error: "Failed to create question" }, 500)

	return c.json(formatQuestion(question), 201)
})

// PATCH /:id/questions/:qid — Update a question
questionRoutes.patch("/:id/questions/:qid", async (c) => {
	const surveyId = c.req.param("id")
	const questionId = c.req.param("qid")
	const userId = c.get("userId")
	const db = c.env.DB

	if (!(await verifySurveyOwnership(db, surveyId, userId))) {
		return c.json({ error: "Survey not found" }, 404)
	}

	const existing = await db
		.prepare("SELECT id FROM questions WHERE id = ? AND survey_id = ?")
		.bind(questionId, surveyId)
		.first()
	if (!existing) return c.json({ error: "Question not found" }, 404)

	const body = await c.req.json().catch(() => null)
	if (!body) return c.json({ error: "Invalid JSON body" }, 400)

	const parsed = updateQuestionSchema.safeParse(body)
	if (!parsed.success) {
		return c.json({ error: parsed.error.issues[0].message }, 400)
	}

	const updates = parsed.data
	const setClauses: string[] = []
	const values: (string | number)[] = []

	if (updates.type !== undefined) {
		setClauses.push("type = ?")
		values.push(updates.type)
	}
	if (updates.label !== undefined) {
		setClauses.push("label = ?")
		values.push(updates.label)
	}
	if (updates.required !== undefined) {
		setClauses.push("required = ?")
		values.push(updates.required ? 1 : 0)
	}
	if (updates.config !== undefined) {
		setClauses.push("config = ?")
		values.push(JSON.stringify(updates.config))
	}

	if (setClauses.length === 0) return c.json({ error: "No fields to update" }, 400)

	values.push(questionId, surveyId)

	const question = await db
		.prepare(
			`UPDATE questions SET ${setClauses.join(", ")} WHERE id = ? AND survey_id = ? RETURNING *`,
		)
		.bind(...values)
		.first()

	if (!question) return c.json({ error: "Failed to update question" }, 500)

	return c.json(formatQuestion(question))
})

// DELETE /:id/questions/:qid — Delete a question
questionRoutes.delete("/:id/questions/:qid", async (c) => {
	const surveyId = c.req.param("id")
	const questionId = c.req.param("qid")
	const userId = c.get("userId")
	const db = c.env.DB

	if (!(await verifySurveyOwnership(db, surveyId, userId))) {
		return c.json({ error: "Survey not found" }, 404)
	}

	const result = await db
		.prepare("DELETE FROM questions WHERE id = ? AND survey_id = ? RETURNING id")
		.bind(questionId, surveyId)
		.first()

	if (!result) return c.json({ error: "Question not found" }, 404)

	return c.body(null, 204)
})

// POST /:id/questions/reorder — Reorder questions by providing ordered ID array
questionRoutes.post("/:id/questions/reorder", async (c) => {
	const surveyId = c.req.param("id")
	const userId = c.get("userId")
	const db = c.env.DB

	if (!(await verifySurveyOwnership(db, surveyId, userId))) {
		return c.json({ error: "Survey not found" }, 404)
	}

	const body = await c.req.json().catch(() => null)
	if (!body) return c.json({ error: "Invalid JSON body" }, 400)

	const schema = z.object({ order: z.array(z.string().min(1)) })
	const parsed = schema.safeParse(body)
	if (!parsed.success) {
		return c.json({ error: "Expected { order: string[] }" }, 400)
	}

	const { order } = parsed.data

	// Decision: Use D1 batch to update all order_index values atomically.
	// Simple and efficient for the expected question count (< 100 per survey).
	const stmts = order.map((id, index) =>
		db
			.prepare("UPDATE questions SET order_index = ? WHERE id = ? AND survey_id = ?")
			.bind(index, id, surveyId),
	)

	if (stmts.length > 0) {
		await db.batch(stmts)
	}

	return c.json({ success: true })
})

import { Hono } from "hono"
import { z } from "zod"
import { formatQuestion, formatSurvey } from "../db/client"
import type { Env } from "../types"

export const publicRoutes = new Hono<Env>()

// GET /:shareToken — Get public survey with questions (no auth required)
// Decision: Use share_token instead of survey.id so we can revoke access
// without deleting the survey (regenerate token or set is_active=false)
publicRoutes.get("/:shareToken", async (c) => {
	const shareToken = c.req.param("shareToken")
	const db = c.env.DB

	const survey = await db
		.prepare("SELECT * FROM surveys WHERE share_token = ? AND is_active = 1")
		.bind(shareToken)
		.first()

	if (!survey) return c.json({ error: "Survey not found or inactive" }, 404)

	const { results: questions } = await db
		.prepare("SELECT * FROM questions WHERE survey_id = ? ORDER BY order_index ASC")
		.bind(survey.id)
		.all()

	return c.json({
		...formatSurvey(survey),
		questions: questions.map(formatQuestion),
	})
})

// POST /:shareToken/respond — Submit survey response (no auth required)
publicRoutes.post("/:shareToken/respond", async (c) => {
	const shareToken = c.req.param("shareToken")
	const db = c.env.DB

	const survey = await db
		.prepare("SELECT id FROM surveys WHERE share_token = ? AND is_active = 1")
		.bind(shareToken)
		.first()
	if (!survey) return c.json({ error: "Survey not found or inactive" }, 404)

	const body = await c.req.json().catch(() => null)
	if (!body) return c.json({ error: "Invalid JSON body" }, 400)

	const schema = z.object({
		answers: z.array(
			z.object({
				questionId: z.string().min(1),
				value: z.string(),
			}),
		),
	})

	const parsed = schema.safeParse(body)
	if (!parsed.success) {
		return c.json({ error: parsed.error.issues[0].message }, 400)
	}

	const { answers } = parsed.data

	// Load all questions for this survey to validate answers
	const { results: questions } = await db
		.prepare("SELECT id, required FROM questions WHERE survey_id = ?")
		.bind(survey.id)
		.all()

	const questionIds = new Set(questions.map((q) => q.id as string))

	// Validate: all required questions must have non-empty answers
	for (const q of questions) {
		if (q.required === 1) {
			const answer = answers.find((a) => a.questionId === q.id)
			if (!answer || !answer.value.trim()) {
				return c.json({ error: "Required question missing answer" }, 400)
			}
		}
	}

	// Validate: all answered questions must belong to this survey
	for (const answer of answers) {
		if (!questionIds.has(answer.questionId)) {
			return c.json({ error: `Question ${answer.questionId} not found in survey` }, 400)
		}
	}

	// Create response record
	const response = await db
		.prepare("INSERT INTO responses (survey_id) VALUES (?) RETURNING id")
		.bind(survey.id)
		.first()

	if (!response) return c.json({ error: "Failed to create response" }, 500)

	// Batch-insert all answers
	if (answers.length > 0) {
		const answerStmts = answers.map((a) =>
			db
				.prepare("INSERT INTO response_answers (response_id, question_id, value) VALUES (?, ?, ?)")
				.bind(response.id, a.questionId, a.value),
		)
		await db.batch(answerStmts)
	}

	return c.json({ responseId: response.id }, 201)
})

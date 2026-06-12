import { Hono } from "hono"
import { authMiddleware } from "../middleware/auth"
import type { Env } from "../types"

export const responseRoutes = new Hono<Env>()

responseRoutes.use("/*", authMiddleware)

// GET /:id/responses- List all responses with answers for a survey (must own)
responseRoutes.get("/:id/responses", async (c) => {
	const surveyId = c.req.param("id")
	const userId = c.get("userId")
	const db = c.env.DB

	// Verify ownership
	const survey = await db
		.prepare("SELECT id, title FROM surveys WHERE id = ? AND owner_id = ?")
		.bind(surveyId, userId)
		.first()
	if (!survey) return c.json({ error: "Survey not found" }, 404)

	// Get all responses ordered by newest first
	const { results: responses } = await db
		.prepare("SELECT * FROM responses WHERE survey_id = ? ORDER BY submitted_at DESC")
		.bind(surveyId)
		.all()

	if (responses.length === 0) {
		return c.json({ responses: [], surveyTitle: survey.title })
	}

	// Decision: Use D1 batch to fetch answers for all responses in parallel.
	// More efficient than N+1 individual queries (one per response).
	const answerQueries = responses.map((r) =>
		db
			.prepare("SELECT response_id, question_id, value FROM response_answers WHERE response_id = ?")
			.bind(r.id),
	)
	const answerResults = await db.batch(answerQueries)

	// Build response objects with answers
	type AnswerRow = { question_id: string; value: string }
	const responsesWithAnswers = responses.map((response, i) => {
		const answers = (answerResults[i].results ?? []) as AnswerRow[]
		return {
			id: response.id,
			surveyId: response.survey_id,
			submittedAt: response.submitted_at,
			answers: answers.map((a) => ({
				questionId: a.question_id,
				value: a.value,
			})),
		}
	})

	return c.json({ responses: responsesWithAnswers, surveyTitle: survey.title })
})

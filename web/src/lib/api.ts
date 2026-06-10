// Typed fetch wrapper with automatic auth header injection.
// All API calls go through this to ensure consistent error handling and auth.

const TOKEN_KEY = "auth_token"

export class ApiError extends Error {
	constructor(
		public status: number,
		message: string,
	) {
		super(message)
		this.name = "ApiError"
	}
}

function getToken(): string | null {
	return localStorage.getItem(TOKEN_KEY)
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
	const token = getToken()
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	}
	if (token) headers.Authorization = `Bearer ${token}`

	// Merge caller-provided headers
	if (options.headers) {
		Object.assign(headers, options.headers)
	}

	const res = await fetch(path, { ...options, headers })

	// Handle 204 No Content (e.g., DELETE)
	if (res.status === 204) return undefined as T

	const data = await res.json().catch(() => ({ error: "Invalid response" }))

	if (!res.ok) {
		throw new ApiError(res.status, data.error || `Request failed with ${res.status}`)
	}

	return data as T
}

// ─── Auth ────────────────────────────────────────────────
export function login(email: string) {
	return apiFetch<{ token: string; user: { id: string; email: string; createdAt: number } }>(
		"/api/auth/login",
		{ method: "POST", body: JSON.stringify({ email }) },
	)
}

export function getMe() {
	return apiFetch<{ user: { id: string; email: string; createdAt: number } }>("/api/auth/me")
}

// ─── Surveys ─────────────────────────────────────────────
import type { Question, Survey, SurveyResponse } from "../types"

export function listSurveys() {
	return apiFetch<{ surveys: Survey[] }>("/api/surveys")
}

export function getSurvey(id: string) {
	return apiFetch<Survey & { questions: Question[] }>(`/api/surveys/${id}`)
}

export function createSurvey(data: { title: string; description?: string }) {
	return apiFetch<Survey>("/api/surveys", {
		method: "POST",
		body: JSON.stringify(data),
	})
}

export function updateSurvey(
	id: string,
	data: Partial<{
		title: string
		description: string | null
		brandColor: string
		brandLogoUrl: string | null
		isActive: boolean
	}>,
) {
	return apiFetch<Survey>(`/api/surveys/${id}`, {
		method: "PATCH",
		body: JSON.stringify(data),
	})
}

export function deleteSurvey(id: string) {
	return apiFetch<void>(`/api/surveys/${id}`, { method: "DELETE" })
}

// ─── Questions ───────────────────────────────────────────
export function addQuestion(
	surveyId: string,
	data: { type: string; label: string; required?: boolean; config?: Record<string, unknown> },
) {
	return apiFetch<Question>(`/api/surveys/${surveyId}/questions`, {
		method: "POST",
		body: JSON.stringify(data),
	})
}

export function updateQuestion(
	surveyId: string,
	questionId: string,
	data: Partial<{
		label: string
		required: boolean
		config: Record<string, unknown>
		type: string
	}>,
) {
	return apiFetch<Question>(`/api/surveys/${surveyId}/questions/${questionId}`, {
		method: "PATCH",
		body: JSON.stringify(data),
	})
}

export function deleteQuestion(surveyId: string, questionId: string) {
	return apiFetch<void>(`/api/surveys/${surveyId}/questions/${questionId}`, {
		method: "DELETE",
	})
}

export function reorderQuestions(surveyId: string, order: string[]) {
	return apiFetch<{ success: boolean }>(`/api/surveys/${surveyId}/questions/reorder`, {
		method: "POST",
		body: JSON.stringify({ order }),
	})
}

// ─── Public Survey ───────────────────────────────────────
export function getPublicSurvey(shareToken: string) {
	return apiFetch<Survey & { questions: Question[] }>(`/api/public/${shareToken}`)
}

export function submitResponse(
	shareToken: string,
	answers: { questionId: string; value: string }[],
) {
	return apiFetch<{ responseId: string }>(`/api/public/${shareToken}/respond`, {
		method: "POST",
		body: JSON.stringify({ answers }),
	})
}

// ─── Responses ───────────────────────────────────────────
export function getResponses(surveyId: string) {
	return apiFetch<{ responses: SurveyResponse[]; surveyTitle: string }>(
		`/api/surveys/${surveyId}/responses`,
	)
}

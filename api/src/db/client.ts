// Decision: Centralize DB row formatting (snake_case → camelCase) to avoid
// duplication across route files. D1 returns raw SQLite rows with snake_case
// column names; the API should return camelCase for frontend consumption.

export function formatSurvey(row: Record<string, unknown>) {
	return {
		id: row.id as string,
		ownerId: row.owner_id as string,
		title: row.title as string,
		description: (row.description as string) ?? null,
		shareToken: row.share_token as string,
		brandColor: row.brand_color as string,
		brandLogoUrl: (row.brand_logo_url as string) ?? null,
		isActive: row.is_active === 1,
		createdAt: row.created_at as number,
		updatedAt: row.updated_at as number,
		responseCount: typeof row.response_count === "number" ? row.response_count : undefined,
	}
}

export function formatQuestion(row: Record<string, unknown>) {
	return {
		id: row.id as string,
		surveyId: row.survey_id as string,
		type: row.type as string,
		label: row.label as string,
		required: row.required === 1,
		orderIndex: row.order_index as number,
		config: (() => {
			try {
				return JSON.parse((row.config as string) || "{}")
			} catch {
				return {}
			}
		})(),
		createdAt: row.created_at as number,
	}
}

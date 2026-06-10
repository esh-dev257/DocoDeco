// Shared TypeScript types for the frontend
// These mirror the API response shapes (camelCase)

export type QuestionType = "short_text" | "multiple_choice" | "rating"

// biome-ignore lint/complexity/noBannedTypes: short text has no config options
export type ShortTextConfig = {}
export interface MultipleChoiceConfig {
	options: string[]
}
export interface RatingConfig {
	max: number
}

export type QuestionConfig = ShortTextConfig | MultipleChoiceConfig | RatingConfig

export interface Question {
	id: string
	surveyId: string
	type: QuestionType
	label: string
	required: boolean
	orderIndex: number
	config: QuestionConfig
	createdAt: number
}

export interface Survey {
	id: string
	ownerId: string
	title: string
	description: string | null
	shareToken: string
	brandColor: string
	brandLogoUrl: string | null
	isActive: boolean
	createdAt: number
	updatedAt: number
	responseCount?: number
	questions?: Question[]
}

export interface ResponseAnswer {
	questionId: string
	value: string
}

export interface SurveyResponse {
	id: string
	surveyId: string
	submittedAt: number
	answers: ResponseAnswer[]
}

export interface User {
	id: string
	email: string
	createdAt: number
}

// Type guards for question config
export function isMultipleChoiceConfig(config: QuestionConfig): config is MultipleChoiceConfig {
	return "options" in config && Array.isArray((config as MultipleChoiceConfig).options)
}

export function isRatingConfig(config: QuestionConfig): config is RatingConfig {
	return "max" in config && typeof (config as RatingConfig).max === "number"
}

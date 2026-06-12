import { useEffect, useState } from "react"
import { toast } from "sonner"
import { cn } from "~/lib/utils"
import type { Question, Survey } from "~/types"
import { isMultipleChoiceConfig, isRatingConfig } from "~/types"

interface PublicSurveyFormProps {
	survey: Survey & { questions: Question[] }
	onSubmit: (answers: { questionId: string; value: string }[]) => Promise<void>
	submitting: boolean
	submitted: boolean
}

// Decision: show all questions at once rather than a wizard (one per page).
// A wizard needs transitions, back/forward navigation, and progress tracking to feel polished.
// All-at-once is standard, accessible, and lets respondents review before submitting.
export function PublicSurveyForm({
	survey,
	onSubmit,
	submitting,
	submitted,
}: PublicSurveyFormProps) {
	const [answers, setAnswers] = useState<Record<string, string>>({})

	// Apply the survey's brand color as a CSS custom property so .brand-button
	// and .brand-ring classes automatically use it without inline styles everywhere.
	useEffect(() => {
		document.documentElement.style.setProperty("--color-brand", survey.brandColor)
		return () => {
			document.documentElement.style.removeProperty("--color-brand")
		}
	}, [survey.brandColor])

	function setAnswer(questionId: string, value: string) {
		setAnswers((prev) => ({ ...prev, [questionId]: value }))
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		const missing = survey.questions.filter((q) => q.required && !answers[q.id]?.trim())
		if (missing.length > 0) {
			toast.error(`Please answer: ${missing.map((q) => q.label).join(", ")}`)
			return
		}
		const answerList = survey.questions
			.filter((q) => answers[q.id] !== undefined && answers[q.id] !== "")
			.map((q) => ({ questionId: q.id, value: answers[q.id] }))
		await onSubmit(answerList)
	}

	if (submitted) {
		return (
			<div className="min-h-screen flex items-center justify-center p-4">
				<div className="text-center animate-in max-w-sm">
					{survey.brandLogoUrl && (
						<img
							src={survey.brandLogoUrl}
							alt="Logo"
							className="h-10 mx-auto mb-6 object-contain"
						/>
					)}
					<div
						className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-4"
						style={{ backgroundColor: `${survey.brandColor}22` }}
					>
						✓
					</div>
					<h2 className="text-xl font-bold mb-2">Thank you!</h2>
					<p className="text-muted-foreground text-sm">Your response has been recorded.</p>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-background py-12 px-4">
			<div className="max-w-xl mx-auto animate-in">
				{/* Survey header- brand color accent + logo */}
				<div className="mb-8 pb-6" style={{ borderBottom: `2px solid ${survey.brandColor}` }}>
					{survey.brandLogoUrl && (
						<img
							src={survey.brandLogoUrl}
							alt="Logo"
							className="h-10 mb-4 object-contain"
							onError={(e) => {
								;(e.target as HTMLImageElement).style.display = "none"
							}}
						/>
					)}
					<h1 className="text-2xl font-bold">{survey.title}</h1>
					{survey.description && (
						<p className="text-muted-foreground mt-2 text-sm leading-relaxed">
							{survey.description}
						</p>
					)}
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					{survey.questions.map((q, i) => (
						<QuestionField
							key={q.id}
							question={q}
							index={i}
							value={answers[q.id] ?? ""}
							onChange={(v) => setAnswer(q.id, v)}
							brandColor={survey.brandColor}
						/>
					))}

					<button
						type="submit"
						disabled={submitting}
						className="brand-button w-full h-12 rounded-xl font-medium text-sm mt-6 disabled:opacity-50"
					>
						{submitting ? "Submitting…" : "Submit Response"}
					</button>
				</form>
			</div>
		</div>
	)
}

function QuestionField({
	question,
	index,
	value,
	onChange,
	brandColor,
}: {
	question: Question
	index: number
	value: string
	onChange: (v: string) => void
	brandColor: string
}) {
	const mcConfig = isMultipleChoiceConfig(question.config) ? question.config : null
	const ratingConfig = isRatingConfig(question.config) ? question.config : null

	return (
		<div className="glass rounded-xl p-5">
			<div className="flex items-start gap-3 mb-4">
				<span className="text-xs text-muted-foreground font-mono mt-0.5 w-5 shrink-0 text-right">
					{index + 1}
				</span>
				{/* Use <label htmlFor> only for short_text; MC/rating use <p> since they group multiple inputs */}
				{question.type === "short_text" ? (
					<label
						htmlFor={`q-${question.id}`}
						className="font-medium text-sm leading-snug cursor-pointer"
					>
						{question.label}
						{question.required && <span className="text-destructive ml-1">*</span>}
					</label>
				) : (
					<p className="font-medium text-sm leading-snug">
						{question.label}
						{question.required && <span className="text-destructive ml-1">*</span>}
					</p>
				)}
			</div>

			<div className="pl-8">
				{question.type === "short_text" && (
					<textarea
						id={`q-${question.id}`}
						value={value}
						onChange={(e) => onChange(e.target.value)}
						required={question.required}
						rows={3}
						className={cn(
							"w-full rounded-lg border border-border bg-input px-3 py-2 text-sm resize-y",
							"text-foreground placeholder:text-muted-foreground",
							"focus-visible:outline-none focus-visible:ring-2 brand-ring",
							"transition-colors",
						)}
						placeholder="Your answer…"
					/>
				)}

				{question.type === "multiple_choice" && mcConfig && (
					<div className="space-y-2">
						{mcConfig.options.map((opt) => {
							const selected = value === opt
							return (
								<label
									key={opt}
									className={cn(
										"flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
										selected ? "border-brand bg-brand/10" : "border-border hover:border-brand/40",
									)}
								>
									<input
										type="radio"
										name={question.id}
										value={opt}
										checked={selected}
										onChange={() => onChange(opt)}
										required={question.required && !value}
										className="sr-only"
									/>
									<div
										className={cn(
											"w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
											selected ? "border-brand" : "border-muted-foreground",
										)}
									>
										{selected && (
											<div
												className="w-2 h-2 rounded-full"
												style={{ backgroundColor: brandColor }}
											/>
										)}
									</div>
									<span className="text-sm">{opt}</span>
								</label>
							)
						})}
					</div>
				)}

				{question.type === "rating" && ratingConfig && (
					<div className="space-y-2">
						<div className="flex gap-2 flex-wrap">
							{Array.from({ length: ratingConfig.max }, (_, i) => {
								const n = String(i + 1)
								const selected = value === n
								return (
									<button
										key={n}
										type="button"
										onClick={() => onChange(selected ? "" : n)}
										className={cn(
											"w-10 h-10 rounded-lg border text-sm font-medium transition-all",
											selected
												? "text-white border-transparent"
												: "border-border text-muted-foreground hover:border-brand/50",
										)}
										style={
											selected
												? {
														backgroundColor: brandColor,
														borderColor: brandColor,
													}
												: undefined
										}
									>
										{n}
									</button>
								)
							})}
						</div>
						<div className="flex justify-between text-xs text-muted-foreground">
							<span>Low</span>
							<span>High</span>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

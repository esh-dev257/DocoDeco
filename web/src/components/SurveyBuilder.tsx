import { Link } from "@tanstack/react-router"
import { ArrowLeft, ChevronDown, ChevronUp, ExternalLink, Settings2, Trash2 } from "lucide-react"
import { useCallback, useState } from "react"
import { toast } from "sonner"
import { BrandingPanel } from "~/components/BrandingPanel"
import { QuestionEditor } from "~/components/QuestionEditor"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import * as api from "~/lib/api"
import { cn } from "~/lib/utils"
import type { Question, QuestionType, Survey } from "~/types"

type RightTab = "question" | "branding"

interface SurveyBuilderProps {
	survey: Survey & { questions: Question[] }
	onSurveyChange: (survey: Survey & { questions: Question[] }) => void
}

// Decision: Two-panel builder layout.
// Left: ordered question list with type badges and up/down reorder (cleaner than
// drag-and-drop without @dnd-kit and still fully functional).
// Right: tabbed editor- "Question" for editing selected question, "Branding" for colors/logo.
// Title is inline-editable on click.
export function SurveyBuilder({ survey, onSurveyChange }: SurveyBuilderProps) {
	const [questions, setQuestions] = useState<Question[]>(survey.questions)
	const [selectedId, setSelectedId] = useState<string | null>(survey.questions[0]?.id ?? null)
	const [tab, setTab] = useState<RightTab>("question")
	const [titleEditing, setTitleEditing] = useState(false)
	const [titleDraft, setTitleDraft] = useState(survey.title)
	const [savingTitle, setSavingTitle] = useState(false)

	const selectedQuestion = questions.find((q) => q.id === selectedId) ?? null

	// Add a new question with sensible defaults per type
	async function addQuestion(type: QuestionType) {
		const configByType: Record<QuestionType, Record<string, unknown>> = {
			short_text: {},
			multiple_choice: { options: ["Option 1", "Option 2"] },
			rating: { max: 5 },
		}
		try {
			const q = await api.addQuestion(survey.id, {
				type,
				label: `New ${type.replace("_", " ")} question`,
				required: false,
				config: configByType[type],
			})
			setQuestions((prev) => [...prev, q])
			setSelectedId(q.id)
			setTab("question")
		} catch {
			toast.error("Failed to add question")
		}
	}

	async function deleteQuestion(id: string) {
		try {
			await api.deleteQuestion(survey.id, id)
			setQuestions((prev) => {
				const next = prev.filter((q) => q.id !== id)
				// If we deleted the selected question, auto-select the nearest neighbor
				if (selectedId === id) setSelectedId(next[0]?.id ?? null)
				return next
			})
		} catch {
			toast.error("Failed to delete question")
		}
	}

	async function moveQuestion(index: number, dir: -1 | 1) {
		const target = index + dir
		if (target < 0 || target >= questions.length) return
		const next = [...questions]
		;[next[index], next[target]] = [next[target], next[index]]
		setQuestions(next)
		try {
			await api.reorderQuestions(
				survey.id,
				next.map((q) => q.id),
			)
		} catch {
			toast.error("Failed to reorder")
			setQuestions(questions) // revert optimistic update
		}
	}

	const handleQuestionUpdate = useCallback((updated: Question) => {
		setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)))
	}, [])

	async function saveTitle() {
		if (titleDraft === survey.title) {
			setTitleEditing(false)
			return
		}
		setSavingTitle(true)
		try {
			const updated = await api.updateSurvey(survey.id, { title: titleDraft })
			onSurveyChange({ ...survey, ...updated, questions })
		} catch {
			toast.error("Failed to save title")
			setTitleDraft(survey.title)
		} finally {
			setSavingTitle(false)
			setTitleEditing(false)
		}
	}

	const TYPE_LABEL: Record<QuestionType, string> = {
		short_text: "Text",
		multiple_choice: "Choice",
		rating: "Rating",
	}

	const QUESTION_TYPES: { type: QuestionType; icon: string; label: string }[] = [
		{ type: "short_text", icon: "✏️", label: "Text" },
		{ type: "multiple_choice", icon: "☑️", label: "Choice" },
		{ type: "rating", icon: "⭐", label: "Rating" },
	]

	const shareUrl = `${window.location.origin}/s/${survey.shareToken}`

	return (
		<div className="animate-in">
			{/* Header bar */}
			<div className="flex items-center gap-3 mb-6">
				<Link to="/dashboard">
					<Button variant="ghost" size="icon">
						<ArrowLeft className="w-4 h-4" />
					</Button>
				</Link>

				{titleEditing ? (
					<Input
						value={titleDraft}
						onChange={(e) => setTitleDraft(e.target.value)}
						onBlur={saveTitle}
						onKeyDown={(e) => {
							if (e.key === "Enter") saveTitle()
							if (e.key === "Escape") {
								setTitleDraft(survey.title)
								setTitleEditing(false)
							}
						}}
						className="max-w-xs font-semibold"
						autoFocus
					/>
				) : (
					<button
						type="button"
						onClick={() => setTitleEditing(true)}
						className="font-semibold text-lg hover:text-muted-foreground transition-colors truncate max-w-xs text-left"
						title="Click to rename"
					>
						{survey.title}
					</button>
				)}

				<div className="ml-auto flex items-center gap-2">
					{savingTitle && (
						<span className="text-xs text-muted-foreground animate-pulse">Saving…</span>
					)}
					<a href={shareUrl} target="_blank" rel="noopener noreferrer">
						<Button variant="outline" size="sm">
							<ExternalLink className="w-3.5 h-3.5" />
							Preview
						</Button>
					</a>
				</div>
			</div>

			{/* Two-panel layout */}
			<div className="flex gap-6 items-start">
				{/* Left panel: question list */}
				<div className="w-72 flex-shrink-0 flex flex-col gap-2">
					{questions.length === 0 ? (
						<div className="glass rounded-xl p-6 text-center text-sm text-muted-foreground">
							No questions yet.
							<br />
							Add one below.
						</div>
					) : (
						questions.map((q, i) => (
							<button
								type="button"
								key={q.id}
								onClick={() => {
									setSelectedId(q.id)
									setTab("question")
								}}
								className={cn(
									"glass rounded-xl p-3 cursor-pointer group transition-all text-left w-full",
									"hover:border-primary/30",
									selectedId === q.id && "border-primary/50 bg-primary/5",
								)}
							>
								<div className="flex items-start gap-2">
									{/* Reorder arrows */}
									<div className="flex flex-col gap-0.5 flex-shrink-0">
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation()
												moveQuestion(i, -1)
											}}
											disabled={i === 0}
											className="text-muted-foreground hover:text-foreground disabled:opacity-20 p-0.5 transition-colors"
											title="Move up"
										>
											<ChevronUp className="w-3 h-3" />
										</button>
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation()
												moveQuestion(i, 1)
											}}
											disabled={i === questions.length - 1}
											className="text-muted-foreground hover:text-foreground disabled:opacity-20 p-0.5 transition-colors"
											title="Move down"
										>
											<ChevronDown className="w-3 h-3" />
										</button>
									</div>

									{/* Question info */}
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-1.5 mb-1">
											<Badge variant="secondary" className="text-xs py-0 px-1.5">
												{TYPE_LABEL[q.type as QuestionType]}
											</Badge>
											{q.required && (
												<span className="text-xs text-destructive font-medium">*</span>
											)}
										</div>
										<p className="text-sm truncate leading-snug">{q.label}</p>
									</div>

									{/* Delete */}
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation()
											deleteQuestion(q.id)
										}}
										className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-0.5 flex-shrink-0"
										title="Delete question"
									>
										<Trash2 className="w-3.5 h-3.5" />
									</button>
								</div>
							</button>
						))
					)}

					{/* Add question buttons- one per type */}
					<div className="grid grid-cols-3 gap-1.5 pt-1">
						{QUESTION_TYPES.map(({ type, icon, label }) => (
							<button
								key={type}
								type="button"
								onClick={() => addQuestion(type)}
								className={cn(
									"glass rounded-xl p-2.5 text-center transition-all",
									"hover:border-primary/30 hover:text-primary",
									"flex flex-col items-center gap-1",
								)}
								title={`Add ${label} question`}
							>
								<span className="text-base">{icon}</span>
								<span className="text-xs text-muted-foreground">{label}</span>
							</button>
						))}
					</div>
				</div>

				{/* Right panel: editor + branding */}
				<div className="flex-1 glass rounded-xl overflow-hidden min-h-[500px]">
					{/* Tab bar */}
					<div className="flex border-b border-border">
						<button
							type="button"
							onClick={() => setTab("question")}
							className={cn(
								"flex-1 py-3 text-sm font-medium transition-colors",
								tab === "question"
									? "text-foreground border-b-2 border-primary -mb-px"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							Question
						</button>
						<button
							type="button"
							onClick={() => setTab("branding")}
							className={cn(
								"flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-1.5",
								tab === "branding"
									? "text-foreground border-b-2 border-primary -mb-px"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							<Settings2 className="w-3.5 h-3.5" />
							Branding
						</button>
					</div>

					<div className="p-6 overflow-y-auto max-h-[calc(100vh-220px)]">
						{tab === "question" ? (
							selectedQuestion ? (
								// key forces full re-mount when switching questions, resetting local state
								<QuestionEditor
									key={selectedQuestion.id}
									surveyId={survey.id}
									question={selectedQuestion}
									onUpdate={handleQuestionUpdate}
								/>
							) : (
								<div className="flex flex-col items-center justify-center py-16 text-center">
									<div className="text-4xl mb-3">👈</div>
									<p className="text-sm text-muted-foreground">
										Select a question to edit, or add one from the left panel.
									</p>
								</div>
							)
						) : (
							<BrandingPanel
								survey={survey}
								onSurveyChange={(updated) => onSurveyChange({ ...updated, questions })}
							/>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

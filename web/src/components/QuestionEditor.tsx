import { Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import * as api from "~/lib/api"
import { cn } from "~/lib/utils"
import type { Question, QuestionType } from "~/types"
import { isMultipleChoiceConfig, isRatingConfig } from "~/types"

interface QuestionEditorProps {
	surveyId: string
	question: Question
	onUpdate: (question: Question) => void
}

// Sub-component for each MC option — local draft state avoids stale closure issues
// when the parent's config state hasn't batched yet.
function OptionInput({
	initialValue,
	onSave,
	onDelete,
	canDelete,
	index,
}: {
	initialValue: string
	onSave: (value: string) => void
	onDelete: () => void
	canDelete: boolean
	index: number
}) {
	const [draft, setDraft] = useState(initialValue)
	return (
		<div className="flex items-center gap-2">
			<span className="text-xs text-muted-foreground w-5 text-right flex-shrink-0">
				{index + 1}
			</span>
			<Input
				value={draft}
				onChange={(e) => setDraft(e.target.value)}
				onBlur={() => {
					if (draft !== initialValue) onSave(draft)
				}}
				onKeyDown={(e) => {
					if (e.key === "Enter") onSave(draft)
				}}
				placeholder={`Option ${index + 1}`}
				className="flex-1 text-sm"
			/>
			<Button
				type="button"
				variant="ghost"
				size="icon"
				onClick={onDelete}
				disabled={!canDelete}
				className="text-muted-foreground hover:text-destructive flex-shrink-0"
			>
				<Trash2 className="w-3.5 h-3.5" />
			</Button>
		</div>
	)
}

export function QuestionEditor({ surveyId, question, onUpdate }: QuestionEditorProps) {
	const [label, setLabel] = useState(question.label)
	const [required, setRequired] = useState(question.required)
	// Derive type-specific state from the question config
	const [mcOptions, setMcOptions] = useState(
		isMultipleChoiceConfig(question.config) ? question.config.options : ["Option 1"],
	)
	const [ratingMax, setRatingMax] = useState(
		isRatingConfig(question.config) ? question.config.max : 5,
	)
	const [saving, setSaving] = useState(false)

	async function save(patch: {
		label?: string
		required?: boolean
		config?: Record<string, unknown>
	}) {
		setSaving(true)
		try {
			const updated = await api.updateQuestion(surveyId, question.id, {
				label: patch.label ?? label,
				required: patch.required ?? required,
				config: patch.config,
			})
			onUpdate(updated)
		} catch {
			toast.error("Failed to save question")
		} finally {
			setSaving(false)
		}
	}

	function handleLabelBlur() {
		if (label !== question.label) save({ label })
	}

	function toggleRequired() {
		const next = !required
		setRequired(next)
		save({ required: next })
	}

	// MC: pass computed options directly to save — never reads stale state
	function handleOptionSave(index: number, newValue: string) {
		const next = mcOptions.map((o, i) => (i === index ? newValue : o))
		setMcOptions(next)
		save({ config: { options: next } })
	}

	function handleOptionDelete(index: number) {
		if (mcOptions.length <= 1) return
		const next = mcOptions.filter((_, i) => i !== index)
		setMcOptions(next)
		save({ config: { options: next } })
	}

	function addOption() {
		const next = [...mcOptions, `Option ${mcOptions.length + 1}`]
		setMcOptions(next)
		save({ config: { options: next } })
	}

	function setMax(max: number) {
		setRatingMax(max)
		save({ config: { max } })
	}

	const TYPE_STYLE: Record<QuestionType, string> = {
		short_text: "bg-blue-500/15 text-blue-400 border-blue-500/20",
		multiple_choice: "bg-green-500/15 text-green-400 border-green-500/20",
		rating: "bg-amber-500/15 text-amber-400 border-amber-500/20",
	}

	const TYPE_LABEL: Record<QuestionType, string> = {
		short_text: "Short Text",
		multiple_choice: "Multiple Choice",
		rating: "Rating Scale",
	}

	return (
		<div className="space-y-6">
			{/* Type badge + required toggle */}
			<div className="flex items-center justify-between">
				<span
					className={cn(
						"text-xs font-medium px-2.5 py-1 rounded-full border",
						TYPE_STYLE[question.type],
					)}
				>
					{TYPE_LABEL[question.type]}
				</span>
				<button
					type="button"
					onClick={toggleRequired}
					className={cn(
						"text-xs px-3 py-1 rounded-full border transition-all cursor-pointer",
						required
							? "bg-primary/15 border-primary/40 text-primary"
							: "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground",
					)}
				>
					{required ? "Required ✓" : "Optional"}
				</button>
			</div>

			{/* Label */}
			<div className="space-y-1.5">
				<label
					htmlFor="question-label-input"
					className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
				>
					Question Label
				</label>
				<Input
					id="question-label-input"
					value={label}
					onChange={(e) => setLabel(e.target.value)}
					onBlur={handleLabelBlur}
					onKeyDown={(e) => {
						if (e.key === "Enter") handleLabelBlur()
					}}
					placeholder="Enter your question…"
				/>
			</div>

			{/* Multiple choice options */}
			{question.type === "multiple_choice" && (
				<div className="space-y-1.5">
					<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
						Options
					</p>
					<div className="space-y-2">
						{mcOptions.map((opt, i) => (
							<OptionInput
								key={`${i}-${opt}`}
								index={i}
								initialValue={opt}
								onSave={(v) => handleOptionSave(i, v)}
								onDelete={() => handleOptionDelete(i)}
								canDelete={mcOptions.length > 1}
							/>
						))}
					</div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={addOption}
						className="w-full mt-1"
					>
						<Plus className="w-3.5 h-3.5" />
						Add Option
					</Button>
				</div>
			)}

			{/* Rating max */}
			{question.type === "rating" && (
				<div className="space-y-3">
					<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
						Scale (1 – {ratingMax})
					</p>
					<div className="flex gap-2">
						{[3, 5, 7, 10].map((n) => (
							<button
								type="button"
								key={n}
								onClick={() => setMax(n)}
								className={cn(
									"flex-1 py-1.5 rounded-lg text-sm border transition-all",
									ratingMax === n
										? "bg-primary/15 border-primary/40 text-primary"
										: "border-border text-muted-foreground hover:border-primary/30",
								)}
							>
								1–{n}
							</button>
						))}
					</div>
					{/* Visual preview of the scale */}
					<div className="flex gap-1.5 flex-wrap">
						{Array.from({ length: ratingMax }, (_, i) => i + 1).map((n) => (
							<div
								key={`preview-${n}`}
								className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-sm text-muted-foreground"
							>
								{n}
							</div>
						))}
					</div>
				</div>
			)}

			{/* Short text preview */}
			{question.type === "short_text" && (
				<div className="space-y-1.5">
					<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
						Preview
					</p>
					<div className="h-20 rounded-md border border-border/50 bg-muted/20 p-3">
						<span className="text-xs text-muted-foreground">Respondents see a text area here</span>
					</div>
				</div>
			)}

			{saving && <p className="text-xs text-muted-foreground text-right animate-pulse">Saving…</p>}
		</div>
	)
}

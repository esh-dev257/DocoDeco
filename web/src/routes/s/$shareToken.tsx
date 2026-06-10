import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { PublicSurveyForm } from "~/components/PublicSurveyForm"
import * as api from "~/lib/api"
import type { Question, Survey } from "~/types"

export const Route = createFileRoute("/s/$shareToken")({
	component: PublicSurveyPage,
})

function PublicSurveyPage() {
	const { shareToken } = Route.useParams()
	const [survey, setSurvey] = useState<(Survey & { questions: Question[] }) | null>(null)
	const [loading, setLoading] = useState(true)
	const [notFound, setNotFound] = useState(false)
	const [submitting, setSubmitting] = useState(false)
	const [submitted, setSubmitted] = useState(false)

	useEffect(() => {
		api
			.getPublicSurvey(shareToken)
			.then(setSurvey)
			.catch(() => setNotFound(true))
			.finally(() => setLoading(false))
	}, [shareToken])

	async function handleSubmit(answers: { questionId: string; value: string }[]) {
		setSubmitting(true)
		try {
			await api.submitResponse(shareToken, answers)
			setSubmitted(true)
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to submit response")
		} finally {
			setSubmitting(false)
		}
	}

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<p className="text-muted-foreground text-sm">Loading survey…</p>
			</div>
		)
	}

	if (notFound || !survey) {
		return (
			<div className="min-h-screen flex items-center justify-center p-4">
				<div className="text-center">
					<div className="text-5xl mb-4">🔒</div>
					<h2 className="font-semibold mb-2">Survey not found</h2>
					<p className="text-muted-foreground text-sm">
						This survey may be inactive or the link is invalid.
					</p>
				</div>
			</div>
		)
	}

	return (
		<PublicSurveyForm
			survey={survey}
			onSubmit={handleSubmit}
			submitting={submitting}
			submitted={submitted}
		/>
	)
}

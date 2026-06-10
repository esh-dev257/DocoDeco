import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { SurveyBuilder } from "~/components/SurveyBuilder"
import * as api from "~/lib/api"
import type { Question, Survey } from "~/types"

export const Route = createFileRoute("/dashboard/$surveyId/edit")({
	component: EditSurveyPage,
})

function EditSurveyPage() {
	const { surveyId } = Route.useParams()
	const [survey, setSurvey] = useState<(Survey & { questions: Question[] }) | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		api
			.getSurvey(surveyId)
			.then(setSurvey)
			.catch(() => toast.error("Survey not found"))
			.finally(() => setLoading(false))
	}, [surveyId])

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<p className="text-muted-foreground text-sm">Loading builder…</p>
			</div>
		)
	}

	if (!survey) {
		return (
			<div className="text-center py-24">
				<p className="text-muted-foreground">Survey not found</p>
			</div>
		)
	}

	return <SurveyBuilder survey={survey} onSurveyChange={setSurvey} />
}

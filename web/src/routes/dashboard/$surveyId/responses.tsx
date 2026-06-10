import { Link, createFileRoute } from "@tanstack/react-router"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "~/components/ui/button"
import * as api from "~/lib/api"
import type { Question, SurveyResponse } from "~/types"

export const Route = createFileRoute("/dashboard/$surveyId/responses")({
	component: ResponsesPage,
})

function ResponsesPage() {
	const { surveyId } = Route.useParams()
	const [responses, setResponses] = useState<SurveyResponse[]>([])
	const [questions, setQuestions] = useState<Question[]>([])
	const [surveyTitle, setSurveyTitle] = useState("")
	const [shareToken, setShareToken] = useState("")
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		Promise.all([api.getResponses(surveyId), api.getSurvey(surveyId)])
			.then(([r, s]) => {
				setResponses(r.responses)
				setSurveyTitle(r.surveyTitle)
				setQuestions(s.questions ?? [])
				setShareToken(s.shareToken)
			})
			.catch(() => toast.error("Failed to load responses"))
			.finally(() => setLoading(false))
	}, [surveyId])

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<p className="text-muted-foreground text-sm">Loading responses…</p>
			</div>
		)
	}

	const shareUrl = shareToken ? `${window.location.origin}/s/${shareToken}` : ""

	return (
		<div className="animate-in">
			<div className="flex items-center gap-3 mb-8">
				<Link to="/dashboard/$surveyId/edit" params={{ surveyId }}>
					<Button variant="ghost" size="icon">
						<ArrowLeft className="w-4 h-4" />
					</Button>
				</Link>
				<div className="flex-1 min-w-0">
					<h1 className="text-2xl font-bold truncate">{surveyTitle}</h1>
					<p className="text-muted-foreground text-sm mt-0.5">
						{responses.length} response{responses.length !== 1 ? "s" : ""}
					</p>
				</div>
				{shareUrl && (
					<a href={shareUrl} target="_blank" rel="noopener noreferrer">
						<Button variant="outline" size="sm">
							<ExternalLink className="w-3.5 h-3.5" />
							Share Link
						</Button>
					</a>
				)}
			</div>

			{responses.length === 0 ? (
				<div className="text-center py-24 glass rounded-xl">
					<div className="text-5xl mb-4">📭</div>
					<h2 className="text-lg font-semibold mb-2">No responses yet</h2>
					<p className="text-muted-foreground text-sm mb-6">
						Share the survey link to start collecting responses
					</p>
					{shareUrl && (
						<a href={shareUrl} target="_blank" rel="noopener noreferrer">
							<Button variant="outline">
								<ExternalLink className="w-4 h-4" />
								Open Survey
							</Button>
						</a>
					)}
				</div>
			) : (
				<div className="space-y-4">
					{responses.map((response, i) => (
						<div key={response.id} className="glass rounded-xl p-5">
							<div className="flex items-center justify-between mb-4 pb-3 border-b border-border/50">
								<span className="text-sm font-medium text-muted-foreground">
									Response #{responses.length - i}
								</span>
								<span className="text-xs text-muted-foreground">
									{new Date(response.submittedAt * 1000).toLocaleString()}
								</span>
							</div>
							<div className="space-y-2.5">
								{questions.map((q) => {
									const answer = response.answers.find((a) => a.questionId === q.id)
									return (
										<div key={q.id} className="grid grid-cols-[200px_1fr] gap-4 text-sm">
											<span className="text-muted-foreground truncate" title={q.label}>
												{q.label}
											</span>
											<span className="font-medium">
												{answer?.value ?? (
													<span className="text-muted-foreground italic text-xs">—</span>
												)}
											</span>
										</div>
									)
								})}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	)
}

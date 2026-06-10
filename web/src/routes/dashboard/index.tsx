import { Link, createFileRoute } from "@tanstack/react-router"
import { BarChart2, ExternalLink, Plus, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import * as api from "~/lib/api"
import type { Survey } from "~/types"

export const Route = createFileRoute("/dashboard/")({
	component: DashboardIndex,
})

function DashboardIndex() {
	const [surveys, setSurveys] = useState<Survey[]>([])
	const [loading, setLoading] = useState(true)
	const [creating, setCreating] = useState(false)
	const [newTitle, setNewTitle] = useState("")
	const [showCreate, setShowCreate] = useState(false)

	useEffect(() => {
		api
			.listSurveys()
			.then((d) => setSurveys(d.surveys))
			.catch(() => toast.error("Failed to load surveys"))
			.finally(() => setLoading(false))
	}, [])

	async function handleCreate(e: React.FormEvent) {
		e.preventDefault()
		if (!newTitle.trim()) return
		setCreating(true)
		try {
			const survey = await api.createSurvey({ title: newTitle.trim() })
			setSurveys((prev) => [survey, ...prev])
			setNewTitle("")
			setShowCreate(false)
			toast.success("Survey created")
		} catch {
			toast.error("Failed to create survey")
		} finally {
			setCreating(false)
		}
	}

	async function handleDelete(id: string) {
		if (!confirm("Delete this survey? All responses will be lost.")) return
		try {
			await api.deleteSurvey(id)
			setSurveys((prev) => prev.filter((s) => s.id !== id))
			toast.success("Survey deleted")
		} catch {
			toast.error("Failed to delete survey")
		}
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<p className="text-muted-foreground text-sm">Loading surveys…</p>
			</div>
		)
	}

	return (
		<div className="animate-in">
			<div className="flex items-center justify-between mb-8">
				<div>
					<h1 className="text-2xl font-bold">Your Surveys</h1>
					<p className="text-muted-foreground text-sm mt-0.5">
						{surveys.length} survey{surveys.length !== 1 ? "s" : ""}
					</p>
				</div>
				<Button onClick={() => setShowCreate(true)}>
					<Plus className="w-4 h-4" />
					New Survey
				</Button>
			</div>

			{showCreate && (
				<Card className="mb-6 border-primary/20">
					<CardContent className="p-4">
						<form onSubmit={handleCreate} className="flex gap-2">
							<Input
								placeholder="Survey title…"
								value={newTitle}
								onChange={(e) => setNewTitle(e.target.value)}
								autoFocus
								className="flex-1"
							/>
							<Button type="submit" disabled={creating}>
								{creating ? "Creating…" : "Create"}
							</Button>
							<Button
								type="button"
								variant="ghost"
								onClick={() => {
									setShowCreate(false)
									setNewTitle("")
								}}
							>
								Cancel
							</Button>
						</form>
					</CardContent>
				</Card>
			)}

			{surveys.length === 0 ? (
				<div className="text-center py-24 glass rounded-xl">
					<div className="text-5xl mb-4">📋</div>
					<h2 className="text-lg font-semibold mb-2">No surveys yet</h2>
					<p className="text-muted-foreground text-sm mb-6">
						Create your first survey to start collecting responses
					</p>
					<Button onClick={() => setShowCreate(true)}>
						<Plus className="w-4 h-4" />
						Create Survey
					</Button>
				</div>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{surveys.map((survey) => (
						<SurveyCard key={survey.id} survey={survey} onDelete={handleDelete} />
					))}
				</div>
			)}
		</div>
	)
}

function SurveyCard({
	survey,
	onDelete,
}: {
	survey: Survey
	onDelete: (id: string) => void
}) {
	const shareUrl = `${window.location.origin}/s/${survey.shareToken}`

	return (
		<Card className="hover:border-primary/40 transition-colors group">
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between gap-2">
					<div className="min-w-0 flex-1">
						<CardTitle className="truncate">{survey.title}</CardTitle>
						{survey.description && (
							<CardDescription className="mt-1 line-clamp-2">{survey.description}</CardDescription>
						)}
					</div>
					{/* Brand color swatch */}
					<div
						className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5 border border-border/50"
						style={{ backgroundColor: survey.brandColor }}
						title={survey.brandColor}
					/>
				</div>
			</CardHeader>
			<CardContent>
				<div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
					<BarChart2 className="w-3.5 h-3.5" />
					<span>
						{survey.responseCount ?? 0} response{(survey.responseCount ?? 0) !== 1 ? "s" : ""}
					</span>
					<span>·</span>
					<span>{new Date((survey.createdAt as number) * 1000).toLocaleDateString()}</span>
					{!survey.isActive && (
						<Badge variant="secondary" className="ml-auto">
							Inactive
						</Badge>
					)}
				</div>
				<div className="flex gap-1.5">
					<Link to="/dashboard/$surveyId/edit" params={{ surveyId: survey.id }} className="flex-1">
						<Button variant="secondary" size="sm" className="w-full">
							Edit Builder
						</Button>
					</Link>
					<Link to="/dashboard/$surveyId/responses" params={{ surveyId: survey.id }}>
						<Button variant="ghost" size="icon" title="View responses">
							<BarChart2 className="w-4 h-4" />
						</Button>
					</Link>
					<a href={shareUrl} target="_blank" rel="noopener noreferrer">
						<Button variant="ghost" size="icon" title="Open public survey">
							<ExternalLink className="w-4 h-4" />
						</Button>
					</a>
					<Button
						variant="ghost"
						size="icon"
						className="text-muted-foreground hover:text-destructive"
						onClick={() => onDelete(survey.id)}
						title="Delete survey"
					>
						<Trash2 className="w-4 h-4" />
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}

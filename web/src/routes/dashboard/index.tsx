import { Link, createFileRoute } from "@tanstack/react-router"
import { BarChart2, ExternalLink, Plus, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Badge } from "~/components/ui/badge"
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
				<p className="text-muted-foreground text-sm font-bold uppercase tracking-wide">
					Loading surveys…
				</p>
			</div>
		)
	}

	return (
		<div className="animate-in">
			<div className="flex items-center justify-between mb-8">
				<div>
					<h1 className="text-3xl font-black text-foreground">Your Surveys</h1>
					<p className="text-sm mt-0.5 font-bold text-muted-foreground uppercase tracking-wide">
						{surveys.length} survey{surveys.length !== 1 ? "s" : ""}
					</p>
				</div>
				<button
					type="button"
					onClick={() => setShowCreate(true)}
					className="h-10 px-5 font-black text-sm flex items-center gap-2 bg-primary text-foreground border-2 border-foreground transition-all hover:translate-x-0.5 hover:translate-y-0.5"
					style={{ boxShadow: "3px 3px 0 #0a0a0a" }}
				>
					<Plus className="w-4 h-4" />
					New Survey
				</button>
			</div>

			{showCreate && (
				<div
					className="mb-6 bg-white border-2 border-foreground p-4"
					style={{ boxShadow: "4px 4px 0 #0a0a0a" }}
				>
					<form onSubmit={handleCreate} className="flex gap-2">
						<Input
							placeholder="Survey title…"
							value={newTitle}
							onChange={(e) => setNewTitle(e.target.value)}
							autoFocus
							className="flex-1 h-11 font-bold border-2 border-foreground rounded-none focus-visible:ring-0"
							style={{ boxShadow: "2px 2px 0 #0a0a0a" }}
						/>
						<button
							type="submit"
							disabled={creating}
							className="h-11 px-5 font-black text-sm bg-primary text-foreground border-2 border-foreground disabled:opacity-50 transition-all hover:translate-x-0.5 hover:translate-y-0.5"
							style={{ boxShadow: "2px 2px 0 #0a0a0a" }}
						>
							{creating ? "Creating…" : "Create"}
						</button>
						<button
							type="button"
							className="h-11 px-4 font-bold text-sm bg-muted text-foreground border-2 border-foreground transition-all hover:translate-x-0.5 hover:translate-y-0.5"
							style={{ boxShadow: "2px 2px 0 #0a0a0a" }}
							onClick={() => {
								setShowCreate(false)
								setNewTitle("")
							}}
						>
							Cancel
						</button>
					</form>
				</div>
			)}

			{surveys.length === 0 ? (
				<div
					className="text-center py-24 bg-white border-2 border-foreground"
					style={{ boxShadow: "6px 6px 0 #0a0a0a" }}
				>
					<div className="text-6xl mb-4">📋</div>
					<h2 className="text-xl font-black mb-2 text-foreground">No surveys yet</h2>
					<p className="text-sm mb-6 font-bold text-muted-foreground">
						Create your first survey to start collecting responses
					</p>
					<button
						type="button"
						onClick={() => setShowCreate(true)}
						className="h-10 px-6 font-black text-sm inline-flex items-center gap-2 bg-primary text-foreground border-2 border-foreground transition-all hover:translate-x-0.5 hover:translate-y-0.5"
						style={{ boxShadow: "3px 3px 0 #0a0a0a" }}
					>
						<Plus className="w-4 h-4" />
						Create Survey
					</button>
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
		<div
			className="bg-white border-2 border-foreground flex flex-col"
			style={{ boxShadow: "4px 4px 0 #0a0a0a" }}
		>
			{/* Brand color strip */}
			<div
				className="px-5 pt-5 pb-4 border-b-2 border-foreground"
				style={{ background: `${survey.brandColor}22` }}
			>
				<div className="flex items-start justify-between gap-2">
					<div
						className="w-10 h-10 flex items-center justify-center text-white text-lg font-black mb-3 shrink-0 border-2 border-foreground"
						style={{ background: survey.brandColor, boxShadow: "2px 2px 0 #0a0a0a" }}
					>
						{survey.title[0]?.toUpperCase()}
					</div>
					{!survey.isActive && (
						<Badge variant="secondary" className="text-xs rounded-none border border-foreground">
							Inactive
						</Badge>
					)}
				</div>
				<h3 className="font-black text-base truncate text-foreground">{survey.title}</h3>
				{survey.description && (
					<p className="text-xs mt-0.5 line-clamp-1 text-muted-foreground">{survey.description}</p>
				)}
			</div>

			{/* Card body */}
			<div className="px-5 pb-5 pt-3 flex flex-col gap-4 flex-1">
				<div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wide">
					<BarChart2 className="w-3.5 h-3.5" />
					<span>
						{survey.responseCount ?? 0} response{(survey.responseCount ?? 0) !== 1 ? "s" : ""}
					</span>
					<span className="mx-1">·</span>
					<span>{new Date((survey.createdAt as number) * 1000).toLocaleDateString()}</span>
				</div>
				<div className="flex gap-2">
					<Link to="/dashboard/$surveyId/edit" params={{ surveyId: survey.id }} className="flex-1">
						<button
							type="button"
							className="w-full h-9 font-black text-sm bg-primary text-foreground border-2 border-foreground transition-all hover:translate-x-0.5 hover:translate-y-0.5"
							style={{ boxShadow: "2px 2px 0 #0a0a0a" }}
						>
							Edit
						</button>
					</Link>
					<Link to="/dashboard/$surveyId/responses" params={{ surveyId: survey.id }}>
						<button
							type="button"
							className="h-9 w-9 flex items-center justify-center bg-muted text-foreground border-2 border-foreground transition-all hover:translate-x-0.5 hover:translate-y-0.5"
							style={{ boxShadow: "2px 2px 0 #0a0a0a" }}
							title="View responses"
						>
							<BarChart2 className="w-4 h-4" />
						</button>
					</Link>
					<a href={shareUrl} target="_blank" rel="noopener noreferrer">
						<button
							type="button"
							className="h-9 w-9 flex items-center justify-center bg-muted text-foreground border-2 border-foreground transition-all hover:translate-x-0.5 hover:translate-y-0.5"
							style={{ boxShadow: "2px 2px 0 #0a0a0a" }}
							title="Open public survey"
						>
							<ExternalLink className="w-4 h-4" />
						</button>
					</a>
					<button
						type="button"
						className="h-9 w-9 flex items-center justify-center bg-destructive text-white border-2 border-foreground transition-all hover:translate-x-0.5 hover:translate-y-0.5"
						style={{ boxShadow: "2px 2px 0 #0a0a0a" }}
						onClick={() => onDelete(survey.id)}
						title="Delete survey"
					>
						<Trash2 className="w-4 h-4" />
					</button>
				</div>
			</div>
		</div>
	)
}

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
				<p className="text-muted-foreground text-xs font-mono uppercase tracking-widest">
					Loading surveys…
				</p>
			</div>
		)
	}

	return (
		<div className="animate-in">
			{/* Header */}
			<div className="flex items-start sm:items-center justify-between mb-8 gap-4">
				<div>
					<div className="inline-block bg-black text-white px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-widest border-2 border-black mb-2">
						Your workspace
					</div>
					<h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight leading-tight">
						Surveys
					</h1>
					<p className="text-xs font-mono text-muted-foreground mt-1 uppercase tracking-widest">
						{surveys.length} survey{surveys.length !== 1 ? "s" : ""}
					</p>
				</div>
				<button
					type="button"
					onClick={() => setShowCreate(true)}
					className="shrink-0 h-10 px-4 font-black text-xs uppercase tracking-wide flex items-center gap-2 bg-foreground text-background border-2 border-foreground shadow-do hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-none"
				>
					<Plus className="w-3.5 h-3.5" />
					New Survey
				</button>
			</div>

			{/* Create form */}
			{showCreate && (
				<div className="mb-6 bg-background border-4 border-foreground p-4 shadow-nb">
					<div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">
						New survey
					</div>
					<form onSubmit={handleCreate} className="flex gap-2">
						<Input
							placeholder="Survey title…"
							value={newTitle}
							onChange={(e) => setNewTitle(e.target.value)}
							autoFocus
							className="flex-1 h-10 font-bold border-2 border-foreground focus-visible:ring-0 shadow-nb-sm font-mono text-sm"
						/>
						<button
							type="submit"
							disabled={creating}
							className="h-10 px-4 font-black text-xs uppercase tracking-wide bg-foreground text-background border-2 border-foreground disabled:opacity-50 shadow-do hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-none"
						>
							{creating ? "Creating…" : "Create"}
						</button>
						<button
							type="button"
							className="h-10 px-4 font-black text-xs uppercase tracking-wide bg-background text-foreground border-2 border-foreground shadow-nb-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-none"
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

			{/* Empty state */}
			{surveys.length === 0 ? (
				<div className="border-4 border-foreground bg-background shadow-nb-xl">
					<div className="text-center py-20 px-6">
						<div className="inline-flex items-center justify-center w-16 h-16 border-4 border-foreground bg-do text-black text-2xl font-black mb-6 shadow-nb">
							📋
						</div>
						<h2 className="text-2xl font-black mb-2 text-foreground">No surveys yet</h2>
						<p className="text-sm font-mono text-muted-foreground mb-8 max-w-xs mx-auto">
							Create your first survey to start collecting responses.
						</p>
						<button
							type="button"
							onClick={() => setShowCreate(true)}
							className="h-10 px-6 font-black text-xs uppercase tracking-wide inline-flex items-center gap-2 bg-foreground text-background border-2 border-foreground shadow-do hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-none"
						>
							<Plus className="w-3.5 h-3.5" />
							Create Survey
						</button>
					</div>
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
		<div className="bg-background border-4 border-foreground flex flex-col shadow-nb hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[3px_3px_0_#000] transition-none">
			{/* Brand color strip — header */}
			<div
				className="px-4 pt-4 pb-3 border-b-4 border-foreground"
				style={{ background: `${survey.brandColor}22` }}
			>
				<div className="flex items-start justify-between gap-2 mb-3">
					<div
						className="w-10 h-10 flex items-center justify-center text-white text-lg font-black shrink-0 border-2 border-foreground shadow-nb-sm"
						style={{ background: survey.brandColor }}
					>
						{survey.title[0]?.toUpperCase()}
					</div>
					{!survey.isActive && (
						<Badge
							variant="secondary"
							className="text-[10px] font-mono uppercase tracking-wider border border-foreground"
						>
							Inactive
						</Badge>
					)}
				</div>
				<h3 className="font-black text-sm tracking-tight text-foreground truncate">
					{survey.title}
				</h3>
				{survey.description && (
					<p className="text-xs mt-0.5 line-clamp-1 text-muted-foreground font-mono">
						{survey.description}
					</p>
				)}
			</div>

			{/* Card body */}
			<div className="px-4 pb-4 pt-3 flex flex-col gap-3 flex-1">
				<div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
					<BarChart2 className="w-3 h-3" />
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
							className="w-full h-9 font-black text-xs uppercase tracking-wide bg-foreground text-background border-2 border-foreground shadow-do-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-none"
						>
							Edit
						</button>
					</Link>
					<Link to="/dashboard/$surveyId/responses" params={{ surveyId: survey.id }}>
						<button
							type="button"
							className="h-9 w-9 flex items-center justify-center bg-background border-2 border-foreground shadow-nb-sm hover:bg-do hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-none"
							title="View responses"
						>
							<BarChart2 className="w-3.5 h-3.5" />
						</button>
					</Link>
					<a href={shareUrl} target="_blank" rel="noopener noreferrer">
						<button
							type="button"
							className="h-9 w-9 flex items-center justify-center bg-background border-2 border-foreground shadow-nb-sm hover:bg-co hover:text-white hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-none"
							title="Open public survey"
						>
							<ExternalLink className="w-3.5 h-3.5" />
						</button>
					</a>
					<button
						type="button"
						className="h-9 w-9 flex items-center justify-center bg-background border-2 border-foreground shadow-nb-sm hover:bg-de hover:text-white hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-none"
						onClick={() => onDelete(survey.id)}
						title="Delete survey"
					>
						<Trash2 className="w-3.5 h-3.5" />
					</button>
				</div>
			</div>
		</div>
	)
}

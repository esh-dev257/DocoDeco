import { useState } from "react"
import { toast } from "sonner"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import * as api from "~/lib/api"
import type { Survey } from "~/types"

interface BrandingPanelProps {
	survey: Survey
	onSurveyChange: (survey: Survey) => void
}

// Decision: native <input type="color"> for the color picker — no external lib needed,
// zero JS overhead, and it's immediately explainable in the interview.
export function BrandingPanel({ survey, onSurveyChange }: BrandingPanelProps) {
	const [color, setColor] = useState(survey.brandColor)
	const [logoUrl, setLogoUrl] = useState(survey.brandLogoUrl ?? "")
	const [saving, setSaving] = useState(false)

	async function save(overrides?: { brandColor?: string; brandLogoUrl?: string | null }) {
		const brandColor = overrides?.brandColor ?? color
		const brandLogoUrl =
			overrides?.brandLogoUrl !== undefined ? overrides.brandLogoUrl : logoUrl || null
		setSaving(true)
		try {
			const updated = await api.updateSurvey(survey.id, { brandColor, brandLogoUrl })
			onSurveyChange(updated)
			toast.success("Branding saved")
		} catch {
			toast.error("Failed to save branding")
		} finally {
			setSaving(false)
		}
	}

	function handleColorBlur() {
		if (color !== survey.brandColor) save({ brandColor: color })
	}

	return (
		<div className="space-y-6">
			{/* Brand color */}
			<div className="space-y-2">
				<label
					htmlFor="brand-color-hex"
					className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
				>
					Brand Color
				</label>
				<div className="flex items-center gap-3">
					<input
						type="color"
						value={color}
						onChange={(e) => setColor(e.target.value)}
						onBlur={handleColorBlur}
						className="w-12 h-10 rounded-md border border-border cursor-pointer bg-transparent p-0.5 shrink-0"
						title="Pick brand color"
						aria-label="Color picker"
					/>
					<Input
						id="brand-color-hex"
						value={color}
						onChange={(e) => {
							const val = e.target.value
							if (/^#[0-9a-fA-F]{0,6}$/.test(val)) setColor(val)
						}}
						onBlur={handleColorBlur}
						className="w-32 font-mono text-sm"
						maxLength={7}
						placeholder="#6366f1"
					/>
				</div>
			</div>

			{/* Logo URL */}
			<div className="space-y-1.5">
				<label
					htmlFor="logo-url-input"
					className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
				>
					Logo URL
				</label>
				<Input
					id="logo-url-input"
					value={logoUrl}
					onChange={(e) => setLogoUrl(e.target.value)}
					placeholder="https://example.com/logo.png"
				/>
				<p className="text-xs text-muted-foreground">Paste a URL to a PNG, SVG, or JPG image</p>
			</div>

			<Button onClick={() => save()} disabled={saving} className="w-full">
				{saving ? "Saving…" : "Save Branding"}
			</Button>

			{/* Live preview of how the survey header will look */}
			<div className="rounded-xl border border-border overflow-hidden">
				<div className="px-3 py-2 bg-muted/20 border-b border-border">
					<span className="text-xs text-muted-foreground">Header preview</span>
				</div>
				<div className="p-4 bg-background" style={{ borderTop: `3px solid ${color}` }}>
					<div className="flex items-center gap-3 mb-4">
						{logoUrl && (
							<img
								src={logoUrl}
								alt="Brand logo"
								className="h-8 w-auto object-contain"
								onError={(e) => {
									;(e.target as HTMLImageElement).style.display = "none"
								}}
							/>
						)}
						<div>
							<p className="font-semibold text-sm">{survey.title}</p>
							<p className="text-xs text-muted-foreground">Survey preview</p>
						</div>
					</div>
					<div
						className="h-9 rounded-lg flex items-center justify-center text-white text-sm font-medium"
						style={{ backgroundColor: color }}
					>
						Submit Response
					</div>
				</div>
			</div>
		</div>
	)
}

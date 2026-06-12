import { cn } from "~/lib/utils"

const TILES = [
	{ char: "D", bg: "#FFB800" },
	{ char: "O", bg: "#FFB800" },
	{ char: "C", bg: "#3B82F6" },
	{ char: "O", bg: "#3B82F6" },
	{ char: "D", bg: "#F43F5E" },
	{ char: "E", bg: "#F43F5E" },
	{ char: "G", bg: "#10B981" },
	{ char: "O", bg: "#10B981" },
]

interface WordmarkProps {
	className?: string
	size?: "sm" | "md" | "lg"
}

const TILE_SIZE = {
	sm: "w-6 h-6 text-[11px]",
	md: "w-8 h-8 text-sm",
	lg: "w-10 h-10 text-base",
}

export function Wordmark({ className, size = "md" }: WordmarkProps) {
	return (
		<span className={cn("inline-flex items-center border-2 border-black", className)}>
			{TILES.map((tile, i) => (
				<span
					key={`${tile.char}-${i}`}
					className={cn(
						"inline-flex items-center justify-center font-black text-black leading-none select-none",
						TILE_SIZE[size],
						i > 0 && "border-l-2 border-black",
					)}
					style={{ background: tile.bg }}
				>
					{tile.char}
				</span>
			))}
		</span>
	)
}

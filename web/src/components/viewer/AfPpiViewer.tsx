import { useEffect, useRef, useState } from "react"
import * as $3Dmol from "3dmol"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ColorMode = "chain" | "plddt"

const LEGEND_CHAIN = [
  { color: "#38bdf8", title: "Cadena A", detail: "HSP90-α NTD" },
  { color: "#f472b6", title: "Cadena B", detail: "VHL" },
]

const LEGEND_PLDDT = [
  { color: "#0053d6", title: "pLDDT > 90", detail: "Muy alta" },
  { color: "#65cbf3", title: "70–90", detail: "Confianza" },
  { color: "#ffdb13", title: "50–70", detail: "Baja" },
  { color: "#ff7d45", title: "< 50", detail: "Muy baja" },
]

export function AfPpiViewer() {
  const hostRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<$3Dmol.Viewer | null>(null)
  const [colorMode, setColorMode] = useState<ColorMode>("chain")
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let cancelled = false
    const viewer = $3Dmol.createViewer(host, {
      backgroundColor: "#0b1220",
      antialias: true,
    })
    viewerRef.current = viewer

    void (async () => {
      try {
        const res = await fetch("/data/alphafold_ppi_model_0.pdb", { cache: "force-cache" })
        if (!res.ok) throw new Error(`PDB ${res.status}`)
        const pdb = await res.text()
        if (cancelled) return
        viewer.addModel(pdb, "pdb")
        applyStyle(viewer, "chain")
        viewer.zoomTo()
        viewer.render()
        setReady(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar el modelo AF")
      }
    })()

    const onResize = () => {
      viewer.resize()
      viewer.render()
    }
    window.addEventListener("resize", onResize)

    return () => {
      cancelled = true
      window.removeEventListener("resize", onResize)
      viewer.clear()
      viewerRef.current = null
    }
  }, [])

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || !ready) return
    applyStyle(viewer, colorMode)
    viewer.render()
  }, [colorMode, ready])

  return (
    <div className="overflow-hidden border border-border bg-[#0b1220]">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2">
        <span className="font-mono text-[10px] tracking-[0.18em] text-sky-200/80 uppercase">
          Modelo 0 · sin PROTAC
        </span>
        <div className="ml-auto flex gap-1">
          {(
            [
              ["chain", "Por cadena"],
              ["plddt", "pLDDT"],
            ] as const
          ).map(([mode, label]) => (
            <Button
              key={mode}
              type="button"
              size="sm"
              variant={colorMode === mode ? "default" : "outline"}
              className={cn(
                colorMode !== mode && "border-white/20 bg-transparent text-sky-100 hover:bg-white/10",
              )}
              onClick={() => setColorMode(mode)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div className="relative">
        <div ref={hostRef} className="h-[min(62vh,560px)] w-full" />
        {error ? (
          <p className="absolute inset-0 flex items-center justify-center bg-black/50 px-4 text-sm text-red-200">
            {error}
          </p>
        ) : null}
        {!ready && !error ? (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-sky-100/70">
            Cargando predicción AlphaFold…
          </p>
        ) : null}
      </div>

      <ul className="grid gap-2 border-t border-white/10 px-4 py-3 sm:grid-cols-2">
        {(colorMode === "chain" ? LEGEND_CHAIN : LEGEND_PLDDT).map((item) => (
          <li key={item.title} className="flex items-start gap-2 text-xs text-sky-50/90">
            <span
              className="mt-0.5 size-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: item.color }}
              aria-hidden
            />
            <span>
              <span className="font-medium">{item.title}</span>
              <span className="text-sky-100/55"> · {item.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function applyStyle(viewer: $3Dmol.Viewer, mode: ColorMode) {
  viewer.setStyle({}, {})
  if (mode === "chain") {
    viewer.setStyle({ chain: "A" }, { cartoon: { color: "#38bdf8", opacity: 0.95 } })
    viewer.setStyle({ chain: "B" }, { cartoon: { color: "#f472b6", opacity: 0.95 } })
    return
  }
  // AF Server escribe pLDDT en el B-factor del PDB/mmCIF
  viewer.setStyle({}, { cartoon: { colorfunc: plddtColor } })
}

function plddtColor(atom: { b?: number }) {
  const b = atom.b ?? 0
  if (b > 90) return "#0053d6"
  if (b >= 70) return "#65cbf3"
  if (b >= 50) return "#ffdb13"
  return "#ff7d45"
}

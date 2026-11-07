import { useEffect, useRef, useState } from "react"
import * as $3Dmol from "3dmol"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type SurfaceMode = "ppi" | "full" | "off"
type StyleMode = "hybrid" | "sticks" | "cartoon"

const HSP_POCKET_PPI = [
  51, 55, 58, 93, 97, 98, 99, 100, 101, 102, 104, 105, 106, 107, 137, 138, 150, 156,
  157, 158, 160, 184, 186,
]
const VHL_POCKET_PPI = [
  14, 16, 32, 35, 37, 38, 41, 42, 43, 44, 45, 46, 47, 54, 57, 58, 59, 62, 69, 72,
]
const HSP_SURFACE = [
  51, 55, 58, 93, 97, 98, 99, 100, 101, 102, 104, 105, 106, 107, 137, 138, 150, 154,
  156, 157, 158, 160, 184, 186,
]
const VHL_SURFACE = [
  14, 16, 32, 33, 35, 37, 38, 41, 42, 43, 44, 45, 46, 47, 49, 54, 57, 58, 59, 62, 69,
  70, 72,
]

const HBONDS: Array<[object, object]> = [
  [{ chain: "A", resi: 93, atom: "OD2" }, { chain: "C", atom: "O14" }],
  [{ chain: "A", resi: 106, atom: "ND2" }, { chain: "C", atom: "O1" }],
  [{ chain: "A", resi: 97, atom: "O" }, { chain: "C", atom: "O5" }],
  [{ chain: "A", resi: 105, atom: "ND2" }, { chain: "B", resi: 44, atom: "O" }],
  [{ chain: "A", resi: 157, atom: "OD1" }, { chain: "B", resi: 47, atom: "OG1" }],
  [{ chain: "B", resi: 45, atom: "OH" }, { chain: "C", atom: "O53" }],
  [{ chain: "B", resi: 62, atom: "CE1" }, { chain: "C", atom: "C59" }],
]

const SCENE_LABELS: Array<{
  text: string
  fontColor: string
  sel: object
}> = [
  {
    text: "HSP90 Asp93",
    fontColor: "#bae6fd",
    sel: { chain: "A", resi: 93, atom: "OD2" },
  },
  {
    text: "HSP90 Asn105 (PPI)",
    fontColor: "#bae6fd",
    sel: { chain: "A", resi: 105, atom: "ND2" },
  },
  {
    text: "HSP90 Asp157 (PPI)",
    fontColor: "#bae6fd",
    sel: { chain: "A", resi: 157, atom: "OD1" },
  },
  {
    text: "VHL Tyr98 (bolsillo/PPI)",
    fontColor: "#fbcfe8",
    sel: { chain: "B", resi: 45, atom: "OH" },
  },
  {
    text: "VHL His115",
    fontColor: "#fbcfe8",
    sel: { chain: "B", resi: 62, atom: "CE1" },
  },
  {
    text: "[AUY] NVP-AUY922",
    fontColor: "#86efac",
    sel: { chain: "C", resn: "AUY" },
  },
  {
    text: "[LNK] PEG2",
    fontColor: "#fde68a",
    sel: { chain: "C", resn: "LNK" },
  },
  {
    text: "[VHL] VH032",
    fontColor: "#fdba74",
    sel: { chain: "C", resn: "VHL" },
  },
]

const LEGEND = [
  { color: "#38bdf8", title: "Cadena A · HSP90-α", detail: "Dominio N-terminal (res. 14–223)" },
  { color: "#f472b6", title: "Cadena B · VHL", detail: "Ligasa E3 (res. 10–158)" },
  { color: "#22c55e", title: "[AUY] Warhead", detail: "NVP-AUY922 · bolsillo Asp93" },
  { color: "#eab308", title: "[LNK] Linker", detail: "Puente PEG2 flexible" },
  { color: "#f97316", title: "[VHL] Ligando E3", detail: "VH032 · Tyr98 / His115" },
  { color: "#fde047", title: "Puentes H", detail: "Cilindros amarillos discontinuos" },
]

const STYLE_LABEL: Record<StyleMode, string> = {
  hybrid: "híbrido",
  sticks: "sticks",
  cartoon: "cartoon",
}

function applyLigandStyles(viewer: $3Dmol.Viewer) {
  viewer.setStyle(
    { chain: "C", resn: "AUY" },
    {
      stick: { radius: 0.26, colorscheme: "greenCarbon" },
      sphere: { scale: 0.24, colorscheme: "greenCarbon" },
    },
  )
  viewer.setStyle(
    { chain: "C", resn: "LNK" },
    {
      stick: { radius: 0.28, colorscheme: "yellowCarbon" },
      sphere: { scale: 0.26, colorscheme: "yellowCarbon" },
    },
  )
  viewer.setStyle(
    { chain: "C", resn: "VHL" },
    {
      stick: { radius: 0.26, colorscheme: "orangeCarbon" },
      sphere: { scale: 0.24, colorscheme: "orangeCarbon" },
    },
  )
  viewer.setStyle({ chain: "C", elem: "H" }, { stick: { radius: 0.08, color: "#cbd5e1" } })
}

function applyBridgeStyles(
  viewer: $3Dmol.Viewer,
  showLabels: boolean,
  styleMode: StyleMode,
) {
  viewer.removeAllLabels()
  viewer.removeAllShapes()

  if (styleMode === "sticks") {
    // Estilo unificado: todo en sticks (proteínas + PROTAC)
    viewer.setStyle(
      { chain: "A" },
      { stick: { radius: 0.12, colorscheme: "cyanCarbon" } },
    )
    viewer.setStyle(
      { chain: "B" },
      { stick: { radius: 0.12, colorscheme: "magentaCarbon" } },
    )
    applyLigandStyles(viewer)
  } else if (styleMode === "cartoon") {
    // Unificado “forma”: proteínas en cartoon; PROTAC sigue en sticks (no tiene cinta)
    viewer.setStyle(
      { chain: "A" },
      { cartoon: { color: "#38bdf8", opacity: 0.92, thickness: 0.3 } },
    )
    viewer.setStyle(
      { chain: "B" },
      { cartoon: { color: "#f472b6", opacity: 0.92, thickness: 0.3 } },
    )
    applyLigandStyles(viewer)
  } else {
    // Híbrido (default científico): cartoon + sticks de bolsillo/PPI + PROTAC
    viewer.setStyle(
      { chain: "A" },
      { cartoon: { color: "#38bdf8", opacity: 0.72, thickness: 0.2 } },
    )
    viewer.setStyle(
      { chain: "B" },
      { cartoon: { color: "#f472b6", opacity: 0.72, thickness: 0.2 } },
    )
    viewer.addStyle(
      { chain: "A", resi: HSP_POCKET_PPI },
      { stick: { radius: 0.14, colorscheme: "cyanCarbon" } },
    )
    viewer.addStyle(
      { chain: "B", resi: VHL_POCKET_PPI },
      { stick: { radius: 0.14, colorscheme: "magentaCarbon" } },
    )
    applyLigandStyles(viewer)
  }

  if (showLabels) {
    for (const label of SCENE_LABELS) {
      viewer.addLabel(
        label.text,
        {
          fontSize: 11,
          fontColor: label.fontColor,
          backgroundColor: "rgba(15,23,42,0.88)",
          backgroundOpacity: 0.9,
          showBackground: true,
          inFront: true,
          borderThickness: 1,
          borderColor: "rgba(148,163,184,0.35)",
        },
        label.sel,
      )
    }
  }

  for (const [a, b] of HBONDS) {
    const a1 = viewer.selectedAtoms(a)
    const a2 = viewer.selectedAtoms(b)
    if (a1.length > 0 && a2.length > 0) {
      viewer.addCylinder({
        start: { x: a1[0].x, y: a1[0].y, z: a1[0].z },
        end: { x: a2[0].x, y: a2[0].y, z: a2[0].z },
        radius: 0.09,
        color: "#fde047",
        dashed: true,
        fromCap: 1,
        toCap: 1,
      })
    }
  }
}

async function applySurfaces(viewer: $3Dmol.Viewer, mode: SurfaceMode) {
  viewer.removeAllSurfaces()
  if (mode === "off") {
    viewer.render()
    return
  }

  if (mode === "ppi") {
    await Promise.all([
      viewer.addSurface(
        $3Dmol.SurfaceType.MS,
        { opacity: 0.5, color: "#0284c7" },
        { chain: "A", resi: HSP_SURFACE },
      ),
      viewer.addSurface(
        $3Dmol.SurfaceType.MS,
        { opacity: 0.5, color: "#db2777" },
        { chain: "B", resi: VHL_SURFACE },
      ),
    ])
  } else {
    await Promise.all([
      viewer.addSurface(
        $3Dmol.SurfaceType.MS,
        { opacity: 0.45, color: "#0284c7" },
        { chain: "A" },
      ),
      viewer.addSurface(
        $3Dmol.SurfaceType.MS,
        { opacity: 0.45, color: "#db2777" },
        { chain: "B" },
      ),
    ])
  }
  viewer.render()
}

export function MolViewer({ className }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<$3Dmol.Viewer | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [surface, setSurface] = useState<SurfaceMode>("ppi")
  const [styleMode, setStyleMode] = useState<StyleMode>("hybrid")
  const [showLabels, setShowLabels] = useState(true)
  const [showLegend, setShowLegend] = useState(true)

  useEffect(() => {
    const el = hostRef.current
    if (!el) return

    let cancelled = false
    const viewer = $3Dmol.createViewer(el, {
      backgroundColor: "#0b1120",
      antialias: true,
    })
    viewerRef.current = viewer

    async function load() {
      try {
        const res = await fetch("/data/complejo_ternario_limpio.pdb")
        if (!res.ok) throw new Error(`PDB HTTP ${res.status}`)
        const pdb = await res.text()
        if (cancelled) return

        viewer.clear()
        viewer.addModel(pdb, "pdb", { keepH: true })
        applyBridgeStyles(viewer, true, "hybrid")
        await applySurfaces(viewer, "ppi")
        viewer.zoomTo({ chain: "C" }, 1)
        viewer.zoom(0.92, 1)
        viewer.render()
        setReady(true)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error cargando PDB")
      }
    }

    void load()

    return () => {
      cancelled = true
      viewerRef.current = null
    }
  }, [])

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || !ready) return
    applyBridgeStyles(viewer, showLabels, styleMode)
    void applySurfaces(viewer, surface).then(() => viewer.render())
  }, [showLabels, styleMode, surface, ready])

  function zoom(sel: object) {
    const viewer = viewerRef.current
    if (!viewer) return
    viewer.zoomTo(sel, 500)
    viewer.render()
  }

  function cycleStyle() {
    setStyleMode((s) => (s === "hybrid" ? "sticks" : s === "sticks" ? "cartoon" : "hybrid"))
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-[#0b1120]",
        className,
      )}
    >
      <div ref={hostRef} className="h-[min(72vh,720px)] w-full" />

      <div className="absolute inset-x-0 top-0 z-10 flex flex-wrap gap-2 p-3">
        <Button size="sm" variant="secondary" onClick={() => zoom({ chain: "C" })}>
          Puente PROTAC
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => zoom({ chain: "C", resn: "AUY" })}
        >
          Bolsillo HSP90
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => zoom({ chain: "C", resn: "LNK" })}
        >
          Linker PEG2
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => zoom({ chain: "C", resn: "VHL" })}
        >
          Bolsillo VHL
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="bg-background/85"
          onClick={cycleStyle}
        >
          Estilo: {STYLE_LABEL[styleMode]}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="bg-background/85"
          onClick={() =>
            setSurface((s) => (s === "ppi" ? "full" : s === "full" ? "off" : "ppi"))
          }
        >
          Superficie: {surface === "ppi" ? "interfaz" : surface === "full" ? "total" : "off"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="bg-background/85"
          onClick={() => setShowLabels((v) => !v)}
        >
          Tags 3D: {showLabels ? "on" : "off"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="bg-background/85"
          onClick={() => setShowLegend((v) => !v)}
        >
          Leyenda: {showLegend ? "on" : "off"}
        </Button>
      </div>

      {showLegend && (
        <aside className="absolute bottom-3 left-3 z-10 w-[min(100%-1.5rem,300px)] border border-white/10 bg-[#0f172a]/92 p-3 text-white shadow-lg backdrop-blur-md">
          <p className="font-mono text-[10px] tracking-[0.18em] text-sky-300/90 uppercase">
            Leyenda del complejo
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Estilo actual: <span className="text-sky-200">{STYLE_LABEL[styleMode]}</span>
            {styleMode === "hybrid" && " (cartoon + sticks de bolsillo)"}
            {styleMode === "sticks" && " (todo unificado en sticks)"}
            {styleMode === "cartoon" && " (proteínas cartoon; PROTAC en sticks)"}
          </p>
          <ul className="mt-2 space-y-2">
            {LEGEND.map((item) => (
              <li key={item.title} className="flex gap-2.5">
                <span
                  className="mt-1 size-2.5 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: item.color }}
                />
                <span>
                  <span className="block text-xs font-semibold text-white">{item.title}</span>
                  <span className="block text-[11px] leading-snug text-slate-300">
                    {item.detail}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </aside>
      )}

      {!ready && !error && (
        <div className="absolute inset-0 grid place-items-center text-sm text-white/70">
          Cargando complejo ternario…
        </div>
      )}
      {error && (
        <div className="absolute inset-0 grid place-items-center bg-black/50 p-6 text-center text-sm text-red-200">
          {error}
        </div>
      )}
    </div>
  )
}

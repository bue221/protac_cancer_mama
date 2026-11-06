import { Link, useParams } from "react-router-dom"

import { Seo } from "@/components/Seo"

const content: Record<
  string,
  { title: string; description: string; blocks: Array<{ heading: string; body: string }> }
> = {
  glosario: {
    title: "Glosario",
    description:
      "Definiciones de PROTAC, warhead, linker, AutoDock Vina, SA Score, PPI y formatos PDB/SDF/PDBQT.",
    blocks: [
      {
        heading: "PROTAC",
        body: "Molécula bifuncional que une diana y ligasa E3 para inducir degradación proteasomal.",
      },
      {
        heading: "Warhead / Linker / Ligando E3",
        body: "Tres módulos del PROTAC: AUY922 (HSP90), PEG2 (puente) y VH032 (VHL).",
      },
      {
        heading: "AutoDock Vina",
        body: "Programa CLI de docking: rankea poses de un ligando en un bolsillo con un score empírico.",
      },
      {
        heading: "SA Score",
        body: "Synthetic Accessibility (Ertl): 1 fácil → 10 difícil. Heurística de síntesis, no receta experimental.",
      },
    ],
  },
  faq: {
    title: "Preguntas frecuentes",
    description:
      "FAQ sobre scores de Vina, docking secuencial, viabilidad computacional y archivos del complejo ternario.",
    blocks: [
      {
        heading: "¿Vina calcula un Kd real?",
        body: "No. El score se parece a un ΔG y sirve para comparar poses, no sustituye medición experimental.",
      },
      {
        heading: "¿Por qué docking secuencial?",
        body: "Vina acopla un ligando a un receptor. El ternario se ensambla alineando poses y optimizando el linker.",
      },
      {
        heading: "¿Viabilidad computacional = síntesis garantizada?",
        body: "No. Indica que la molécula es modularmente razonable. Un químico aún define protectores y purificación.",
      },
    ],
  },
  "hoja-de-ruta": {
    title: "Hoja de ruta",
    description:
      "Siguientes pasos: AlphaFold 3, HADDOCK, dinámica molecular y validación experimental del PROTAC.",
    blocks: [
      {
        heading: "Ya en el repo",
        body: "Construcción RDKit, docking Vina, ensamblaje PPI y checklist de viabilidad de laboratorio.",
      },
      {
        heading: "Siguiente cómputo",
        body: "AlphaFold 3, HADDOCK semiflexible y MD 50–100 ns con MM/GBSA.",
      },
      {
        heading: "Siguiente laboratorio",
        body: "Síntesis convergente por amidas, LC-MS/NMR y Western blot de degradación de HSP90.",
      },
    ],
  },
}

export function WikiArticlePage() {
  const { slug = "" } = useParams()
  const article = content[slug]

  if (!article) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p>Artículo no encontrado.</p>
        <Link to="/wiki" className="text-primary hover:underline">
          Volver a la wiki
        </Link>
      </div>
    )
  }

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <Seo
        title={article.title}
        description={article.description}
        path={`/wiki/${slug}`}
        type="article"
      />
      <Link to="/wiki" className="text-sm text-primary hover:underline">
        ← Wiki
      </Link>
      <h1 className="font-heading mt-4 text-4xl font-semibold tracking-tight text-ink">
        {article.title}
      </h1>
      <div className="mt-10 space-y-8">
        {article.blocks.map((block) => (
          <section key={block.heading}>
            <h2 className="font-heading text-xl font-semibold">{block.heading}</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">{block.body}</p>
          </section>
        ))}
      </div>
    </article>
  )
}

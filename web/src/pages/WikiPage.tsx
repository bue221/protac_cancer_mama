import { Link } from "react-router-dom"

import { Seo } from "@/components/Seo"

const articles = [
  {
    slug: "glosario",
    title: "Glosario bioinformático",
    summary: "PROTAC, warhead, SMILES, PDBQT, grid box, PPI, SA Score.",
  },
  {
    slug: "faq",
    title: "Preguntas frecuentes",
    summary: "Qué es Vina, qué mide el score y qué no demuestra el modelo.",
  },
  {
    slug: "hoja-de-ruta",
    title: "Hoja de ruta",
    summary: "HADDOCK, AlphaFold 3, dinámica molecular y siguiente paso experimental.",
  },
]

export function WikiPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <Seo
        title="Wiki técnica"
        description="Glosario, FAQ y hoja de ruta del proyecto PROTAC HSP90α–VHL: docking, viabilidad sintética, HADDOCK y dinámica molecular."
        path="/wiki"
      />
      <section className="max-w-3xl">
        <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">Documentación</p>
        <h1 className="font-heading mt-3 text-4xl font-semibold tracking-tight text-ink">Wiki</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Complemento del póster RedColsi: glosario, FAQ y la hoja de ruta (HADDOCK, AlphaFold 3,
          dinámica molecular) para pasar del piloto PEG2 a validación más rigurosa.
        </p>
      </section>

      <div className="mt-10 grid gap-3">
        {articles.map((article) => (
          <Link
            key={article.slug}
            to={`/wiki/${article.slug}`}
            className="border border-border bg-card/60 px-5 py-4 transition-colors hover:border-primary/40 hover:bg-card"
          >
            <h2 className="font-heading text-xl font-semibold">{article.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{article.summary}</p>
          </Link>
        ))}
        <Link
          to="/viabilidad"
          className="border border-border bg-card/60 px-5 py-4 transition-colors hover:border-primary/40 hover:bg-card"
        >
          <h2 className="font-heading text-xl font-semibold">Reporte de viabilidad</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Checklist computacional generado por el script 04.
          </p>
        </Link>
      </div>
    </div>
  )
}

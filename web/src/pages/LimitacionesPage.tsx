import { Link } from "react-router-dom"

import { Seo } from "@/components/Seo"

const BLOCKS = [
  {
    title: "Qué sí demuestra este trabajo",
    body: "Diseño racional de un PROTAC modular AUY922–PEG2–VH032, docking secuencial con AutoDock Vina, ensamble ternario sin choques estéricos graves, checklist de viabilidad sintética in silico y contraste AlphaFold Server de HSP90–VHL sin ligando (ipTM 0.52).",
  },
  {
    title: "Scores de Vina ≠ Kd experimental",
    body: "Los valores −9.49 y −6.56 kcal/mol son scores empíricos de docking. La conversión a Kd es solo una regla de bolsillo para comunicar órdenes de magnitud; no sustituye ITC, SPR ni ensayos de unión.",
  },
  {
    title: "AlphaFold Server no incluye el PROTAC",
    body: "El Server solo admite ligandos CCD de una lista fija. El job archivado predice PPI proteína–proteína sin el puente. Para SMILES custom hace falta AlphaFold 3 local.",
  },
  {
    title: "Pose estática, no dinámica",
    body: "El complejo ternario es una geometría refinada (Vina local_only + optimización del linker). No hay aún MD en agua explícita ni muestreo de cooperatividad temporal.",
  },
  {
    title: "Sin síntesis ni bioensayo",
    body: "No se ha sintetizado la molécula ni medido degradación de HSP90 (Western blot / proteómica). La viabilidad de laboratorio es un filtro computacional previo, no un certificado de fármaco.",
  },
  {
    title: "Un solo linker (PEG2)",
    body: "No hay SAR de longitud del puente (PEG3–PEG5). El piloto prioriza una quimera; la hoja de ruta incluye explorar más connectores.",
  },
]

export function LimitacionesPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <Seo
        title="Limitaciones"
        description="Qué demuestra y qué no el modelo PROTAC HSP90–VHL: Vina no es Kd, AlphaFold sin ligando, sin MD ni ensayo celular."
        path="/limitaciones"
      />
      <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">Alcance</p>
      <h1 className="font-heading mt-3 text-4xl font-semibold tracking-tight text-ink">
        Limitaciones
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Trabajo <strong className="text-foreground">computacional</strong> de priorización: sirve
        para decidir si la molécula merece síntesis, no como prueba clínica ni de degradación
        celular.
      </p>

      <div className="mt-10 space-y-8">
        {BLOCKS.map((b) => (
          <section key={b.title}>
            <h2 className="font-heading text-xl font-semibold text-ink">{b.title}</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">{b.body}</p>
          </section>
        ))}
      </div>

      <p className="mt-12 text-sm text-muted-foreground">
        Ver también{" "}
        <Link to="/resultados" className="text-primary hover:underline">
          resultados
        </Link>
        ,{" "}
        <Link to="/alphafold" className="text-primary hover:underline">
          AlphaFold PPI
        </Link>{" "}
        y{" "}
        <Link to="/wiki/hoja-de-ruta" className="text-primary hover:underline">
          hoja de ruta
        </Link>
        .
      </p>
    </div>
  )
}

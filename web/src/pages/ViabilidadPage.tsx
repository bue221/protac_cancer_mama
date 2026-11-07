import { useEffect, useState } from "react"

import { Seo } from "@/components/Seo"
import { StatusBadge } from "@/components/StatusBadge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Separator } from "@/components/ui/separator"
import { fetchViabilidad, verdictLabel } from "@/lib/viabilidad"
import type { CheckStatus, ViabilidadReport } from "@/types/viabilidad"

function nivelToStatus(nivel: string): CheckStatus {
  if (nivel === "no_viable_computacionalmente") return "fail"
  if (nivel === "viable_con_reservas") return "warn"
  return "pass"
}

export function ViabilidadPage() {
  const [report, setReport] = useState<ViabilidadReport | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void fetchViabilidad()
      .then(setReport)
      .catch((err: Error) => setError(err.message))
  }, [])

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p className="text-destructive">{error}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Regenera con <code>./.venv/bin/python3 scripts/04_viabilidad_laboratorio.py</code>
        </p>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-muted-foreground sm:px-6">
        Cargando comprobación de viabilidad…
      </div>
    )
  }

  const { propiedades: p, veredicto: v, metodologia: m } = report
  const metrics = [
    ["Fórmula", p.formula],
    ["MW", String(p.mw)],
    ["cLogP", String(p.clogp)],
    ["TPSA", String(p.tpsa)],
    ["SA Score", String(p.sa_score)],
    ["QED", String(p.qed)],
    ["Rotables", String(p.rotatable_bonds)],
    ["Átomos pesados", String(p.heavy_atoms)],
  ]

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <Seo
        title="Viabilidad de laboratorio"
        description="Checklist computacional de viabilidad sintética del PROTAC AUY922–PEG2–VH032: SA Score, bloques modulares, alertas y geometría ternaria, con metodología explicada."
        path="/viabilidad"
      />
      <section className="animate-rise max-w-3xl">
        <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
          Checklist · objetivo del póster
        </p>
        <h1 className="font-heading mt-3 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Viabilidad de laboratorio
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Antes de gastar reactivos: el póster pide predecir el perfil del PROTAC. Aquí ves{" "}
          <strong className="text-foreground">cómo</strong> se calcularon las métricas del piloto
          AUY922–PEG2–VH032 y <strong className="text-foreground">por qué</strong> importan para
          decidir si merece síntesis.
        </p>
      </section>

      <section className="animate-rise-delay-1 mt-10 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="border border-border bg-card/70 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={nivelToStatus(v.nivel)} />
            <h2 className="font-heading text-xl font-semibold">{verdictLabel(v.nivel)}</h2>
          </div>
          <p className="mt-4 leading-relaxed text-foreground/90">{v.resumen}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            {v.contadores.pass} pass · {v.contadores.warn} warn · {v.contadores.fail} fail ·{" "}
            {report.generated_at}
          </p>
          <Separator className="my-4" />
          <p className="text-sm text-muted-foreground">{report.disclaimer}</p>
        </div>

        <div className="border border-border bg-card/70 p-6">
          <h2 className="font-heading text-lg font-semibold">Propiedades medidas</h2>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            {metrics.map(([label, value]) => (
              <div key={label} className="border border-border/70 bg-mist/50 px-3 py-2">
                <dt className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                  {label}
                </dt>
                <dd className="mt-1 text-sm font-semibold break-all">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {m && (
        <section className="mt-12 grid gap-4 lg:grid-cols-2">
          <div className="border border-border bg-card/70 p-6 lg:col-span-2">
            <h2 className="font-heading text-2xl font-semibold">Cómo se llegó a estos cálculos</h2>
            <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">{m.objetivo}</p>
          </div>

          <div className="border border-border bg-card/70 p-6">
            <h3 className="font-heading text-lg font-semibold">Pipeline del script 04</h3>
            <ol className="mt-4 space-y-3">
              {m.pipeline.map((step, idx) => (
                <li key={step} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                  <span className="font-mono text-primary">{idx + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="space-y-4">
            <div className="border border-border bg-card/70 p-6">
              <h3 className="font-heading text-lg font-semibold">Herramientas</h3>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {m.herramientas.map((tool) => (
                  <li key={tool} className="border-l-2 border-primary/40 pl-3">
                    {tool}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-border bg-card/70 p-6">
              <h3 className="font-heading text-lg font-semibold">Qué no demuestra</h3>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {m.no_demuestra.map((item) => (
                  <li key={item} className="border-l-2 border-warn/50 pl-3">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      <section className="mt-12">
        <h2 className="font-heading text-2xl font-semibold">Checklist con método</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Cada ítem incluye el resultado, cómo se calculó y por qué ese criterio sirve para
          decidir si avanzar a síntesis.
        </p>
        <Accordion
          type="multiple"
          defaultValue={report.checks.slice(0, 3).map((c) => c.id)}
          className="mt-4 border border-border bg-card/50 px-2"
        >
          {report.checks.map((check) => (
            <AccordionItem key={check.id} value={check.id}>
              <AccordionTrigger className="px-2 hover:no-underline">
                <span className="flex w-full items-center justify-between gap-3 pr-3 text-left">
                  <span className="font-medium">{check.titulo}</span>
                  <StatusBadge status={check.status} />
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 px-2 text-muted-foreground">
                <p className="text-foreground/90">{check.detalle}</p>

                {(check.como || check.porque) && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {check.como && (
                      <div className="border border-border/70 bg-background/50 p-3">
                        <p className="font-mono text-[10px] tracking-wider text-primary uppercase">
                          Cómo se calculó
                        </p>
                        <p className="mt-2 text-sm leading-relaxed">{check.como}</p>
                      </div>
                    )}
                    {check.porque && (
                      <div className="border border-border/70 bg-background/50 p-3">
                        <p className="font-mono text-[10px] tracking-wider text-accent-foreground uppercase">
                          Por qué importa
                        </p>
                        <p className="mt-2 text-sm leading-relaxed">{check.porque}</p>
                      </div>
                    )}
                  </div>
                )}

                {check.ruta_sugerida && check.ruta_sugerida.length > 0 && (
                  <div>
                    <p className="font-mono text-[10px] tracking-wider text-primary uppercase">
                      Ruta sintética sugerida (conceptual)
                    </p>
                    <ol className="mt-2 space-y-2">
                      {check.ruta_sugerida.map((step, idx) => (
                        <li
                          key={step}
                          className="flex gap-3 border border-border/60 bg-background/60 px-3 py-2 text-sm"
                        >
                          <span className="font-mono text-primary">{idx + 1}</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  )
}

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"

import { StatusBadge } from "@/components/StatusBadge"
import { Button } from "@/components/ui/button"
import { fetchViabilidad, verdictLabel } from "@/lib/viabilidad"
import type { ViabilidadReport } from "@/types/viabilidad"

export function HomePage() {
  const [report, setReport] = useState<ViabilidadReport | null>(null)

  useEffect(() => {
    void fetchViabilidad()
      .then(setReport)
      .catch(() => setReport(null))
  }, [])

  const verdictStatus =
    report?.veredicto.nivel === "no_viable_computacionalmente"
      ? "fail"
      : report?.veredicto.nivel === "viable_con_reservas"
        ? "warn"
        : "pass"

  return (
    <div>
      <section className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(to right, oklch(0.75 0.03 195 / 0.25) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.75 0.03 195 / 0.25) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(ellipse at 30% 20%, black 20%, transparent 70%)",
          }}
        />

        <div className="relative mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-6xl flex-col justify-center px-4 py-16 sm:px-6">
          <p className="animate-rise font-mono text-xs tracking-[0.22em] text-primary uppercase">
            Diseño computacional · PROTAC
          </p>
          <h1 className="animate-rise-delay-1 font-heading mt-4 max-w-[14ch] text-5xl leading-[0.95] font-semibold tracking-tight text-ink sm:text-6xl md:text-7xl">
            PROTAC HSP90α–VHL
          </h1>
          <div className="animate-underline mt-5 h-px w-28 bg-primary" />
          <p className="animate-rise-delay-2 mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Complejo ternario AUY922–PEG2–VH032 con comprobación de viabilidad de
            laboratorio, modelo 3D y documentación técnica.
          </p>

          <div className="animate-rise-delay-2 mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/viabilidad">
                Ver viabilidad de lab
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/visor">Abrir visor 3D</Link>
            </Button>
          </div>

          {report && (
            <div className="animate-fade mt-12 max-w-xl border border-border/80 bg-card/70 p-5 backdrop-blur-sm">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={verdictStatus} />
                <span className="font-heading text-base font-semibold">
                  {verdictLabel(report.veredicto.nivel)}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                SA {report.propiedades.sa_score} · MW {report.propiedades.mw} ·{" "}
                {report.veredicto.contadores.pass}/{report.veredicto.contadores.total} checks
                en pass.
              </p>
              <Link
                to="/viabilidad"
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Checklist completo <ArrowRight className="size-3.5" />
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-heading text-2xl font-semibold tracking-tight">Explorar</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Tres entradas claras: evidencia de síntesis computacional, estructura 3D y wiki.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              to: "/viabilidad",
              title: "Viabilidad de laboratorio",
              body: "SA Score, bloques modulares, estereoquímica, alertas y geometría ternaria.",
            },
            {
              to: "/visor",
              title: "Visor del complejo",
              body: "HSP90, VHL y el puente PEG2 con superficies PPI interactivas.",
            },
            {
              to: "/wiki",
              title: "Wiki técnica",
              body: "Glosario, FAQ y hoja de ruta hacia HADDOCK, AlphaFold 3 y MD.",
            },
          ].map((item, i) => (
            <Link
              key={item.to}
              to={item.to}
              className="group border border-border bg-card/60 p-5 transition-colors hover:border-primary/40 hover:bg-card"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <h3 className="font-heading text-lg font-semibold group-hover:text-primary">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

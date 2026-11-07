import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"

import { PosterFigure } from "@/components/PosterFigure"
import { Seo } from "@/components/Seo"
import { StatusBadge } from "@/components/StatusBadge"
import { Button } from "@/components/ui/button"
import { DEFAULT_DESCRIPTION } from "@/lib/seo"
import { fetchViabilidad, verdictLabel } from "@/lib/viabilidad"
import type { ViabilidadReport } from "@/types/viabilidad"

const objetivos = [
  {
    title: "Estabilidad del complejo ternario",
    body: "Evaluar si HSP90, el PROTAC y VHL pueden formar un ensamble sin choques estéricos.",
  },
  {
    title: "Mecanismos y afinidades",
    body: "Identificar anclajes (p. ej. Asp93) y estimar energías de unión por docking secuencial.",
  },
  {
    title: "Perfil antes de sintetizar",
    body: "Priorizar el candidato con propiedades, alertas y viabilidad de laboratorio in silico.",
  },
]

const pasosProtac = [
  "Formación del complejo ternario HSP–PROTAC–VHL",
  "Ubiquitinación de la chaperona diana",
  "Degradación por el proteasoma 26S",
  "Menor nivel de HSP e inhibición de la progresión tumoral",
]

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
      <Seo
        title="PROTAC como alternativa en cáncer de mama"
        description={DEFAULT_DESCRIPTION}
        path="/"
      />

      {/* Hero: una composición — marca + pregunta + CTA + figura dominante */}
      <section className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(105deg, oklch(0.975 0.012 195 / 0.96) 0%, oklch(0.975 0.012 195 / 0.88) 42%, oklch(0.975 0.012 195 / 0.35) 70%, transparent 100%), url(/poster/mecanismo-protac.png)",
            backgroundSize: "cover",
            backgroundPosition: "72% center",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.22]"
          style={{
            backgroundImage:
              "linear-gradient(to right, oklch(0.75 0.03 195 / 0.25) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.75 0.03 195 / 0.25) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(ellipse at 25% 20%, black 15%, transparent 65%)",
          }}
        />

        <div className="relative mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-6xl flex-col justify-center px-4 py-16 sm:px-6">
          <p className="animate-rise font-mono text-xs tracking-[0.22em] text-primary uppercase">
            RedColsi · Universidad Colegio Mayor de Cundinamarca
          </p>
          <h1 className="animate-rise-delay-1 font-heading mt-4 max-w-[16ch] text-4xl leading-[0.95] font-semibold tracking-tight text-ink sm:text-5xl md:text-6xl lg:text-7xl">
            PROTAC para cáncer de mama
          </h1>
          <div className="animate-underline mt-5 h-px w-28 bg-primary" />
          <p className="animate-rise-delay-2 mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Diseño computacional de una quimera AUY922–PEG–VH032 que recluta VHL para
            degradar chaperonas HSP y abrir una vía distinta a la inhibición clásica.
          </p>

          <div className="animate-rise-delay-2 mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <a href="#por-que">
                Por qué se hace
                <ArrowRight data-icon="inline-end" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/visor">Abrir visor 3D</Link>
            </Button>
          </div>

          {report && (
            <div className="animate-fade mt-12 max-w-xl border border-border/80 bg-card/80 p-5 backdrop-blur-sm">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={verdictStatus} />
                <span className="font-heading text-base font-semibold">
                  {verdictLabel(report.veredicto.nivel)}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Candidato piloto PEG2 · SA {report.propiedades.sa_score} · MW{" "}
                {report.propiedades.mw} · {report.veredicto.contadores.pass}/
                {report.veredicto.contadores.total} checks en pass.
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

      {/* Por qué */}
      <section id="por-que" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid items-start gap-10 lg:grid-cols-2">
          <div>
            <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
              1 · Introducción
            </p>
            <h2 className="font-heading mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Por qué se diseña este PROTAC
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Según la OMS (2024), el cáncer de mama es el más frecuente en mujeres: unos{" "}
              <span className="text-foreground">2,3 millones</span> de casos nuevos y{" "}
              <span className="text-foreground">670.000</span> muertes. En tumores HER2+, la
              progresión depende en buena parte de chaperonas{" "}
              <span className="text-foreground">HSP90/HSP70</span> que estabilizan oncoproteínas
              (HER2, EGFR, AKT y otras).
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Un inhibidor clásico solo bloquea el bolsillo de ATP de forma temporal. Un PROTAC
              busca <em>eliminar</em> la chaperona: une la diana a una ligasa E3 (aquí VHL), la
              marca con ubiquitina y la manda al proteasoma.
            </p>
            <p className="mt-6 border-l-2 border-primary/40 pl-4 text-base leading-relaxed text-ink">
              Pregunta guía del póster: ¿cómo el diseño estructural de un nuevo inhibidor
              (PROTAC) mejora la eficiencia en la degradación de proteínas HSP en el cáncer de
              mama?
            </p>
          </div>
          <PosterFigure
            src="/poster/epidemiologia-oms-2024.png"
            alt="Infografía OMS 2024 sobre epidemiología del cáncer de mama"
            caption="Carga global y contraste de incidencia/mortalidad según índice de desarrollo humano."
          />
        </div>
      </section>

      {/* Biología HER2/HSP */}
      <section className="border-y border-border/60 bg-card/35">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <PosterFigure
            src="/poster/her2-hsp-progresion.png"
            alt="Diagrama de progresión HER2+ impulsada por HSP90 y HSP70"
            caption="De la mama al receptor HER2 y las cascadas MAPK/PI3K que sostienen supervivencia y proliferación."
            className="order-2 lg:order-1"
          />
          <div className="order-1 lg:order-2">
            <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
              Biología de la diana
            </p>
            <h2 className="font-heading mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              HER2+ se apoya en HSP90/HSP70
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Las chaperonas mantienen plegadas proteínas que alimentan supervivencia,
              proliferación y progresión del ciclo celular. Atacar HSP90-α (bolsillo N-terminal,
              Asp93) es una estrategia para desestabilizar ese eje en cáncer de mama agresivo.
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              El póster contempla también anclajes en HSP70; este portal prioriza el piloto
              computacional sobre <strong className="font-medium text-foreground">HSP90-α–VHL</strong>,
              ya modelado en 3D.
            </p>
          </div>
        </div>
      </section>

      {/* Mecanismo */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-3xl">
          <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
            2 · Mecanismo
          </p>
          <h2 className="font-heading mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Cómo actúa el PROTAC
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            La molécula es bifuncional: un extremo reconoce la chaperona, el otro recluta VHL, y
            el linker PEG acerca ambas proteínas hasta permitir ubiquitinación y degradación.
          </p>
        </div>

        <PosterFigure
          src="/poster/mecanismo-protac.png"
          alt="Mecanismo PROTAC de degradación dirigida en cáncer de mama"
          caption="Ciclo evento-dirigido: complejo ternario → poliubiquitinación → proteasoma 26S → menor HSP."
          className="mt-10"
        />

        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pasosProtac.map((paso, i) => (
            <li
              key={paso}
              className="border border-border/80 bg-card/50 p-4"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="font-mono text-xs text-primary">0{i + 1}</span>
              <p className="mt-2 text-sm leading-relaxed text-foreground">{paso}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Objetivos */}
      <section className="border-y border-border/60 bg-mist/60">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
            Objetivos del proyecto
          </p>
          <h2 className="font-heading mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Diseñar un PROTAC como alternativa terapéutica computacional
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {objetivos.map((item) => (
              <div key={item.title} className="border border-border/80 bg-card/70 p-5">
                <h3 className="font-heading text-lg font-semibold text-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Arquitectura del candidato */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid items-start gap-10 lg:grid-cols-2">
          <div>
            <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
              3 · Resultados preliminares
            </p>
            <h2 className="font-heading mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Arquitectura del candidato
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              El póster propone cabeza <span className="text-foreground">NVP-AUY922</span>, cola{" "}
              <span className="text-foreground">VH032</span> y conectores{" "}
              <span className="text-foreground">PEG3–PEG5</span> en espacio Beyond Rule of Five.
              En este repositorio el piloto ensamblado y dockeado es{" "}
              <span className="text-foreground">AUY922–PEG2–VH032</span>: mismo esquema modular,
              linker más corto para forzar el abrazo PPI y validar geometría antes de explorar
              longitudes mayores.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li>
                · Anclaje HSP90: <span className="text-foreground">Asp93</span> (dominio
                N-terminal)
              </li>
              <li>
                · Reclutamiento E3: bolsillo VHL vía VH032 (
                <span className="text-foreground">Tyr98 / His115</span>)
              </li>
              <li>· En el póster también se listan residuos de HSP70 para una línea futura</li>
            </ul>
          </div>
          <PosterFigure
            src="/poster/arquitectura-hsp90-vhl.png"
            alt="Arquitectura molecular del PROTAC HSP90–AUY922–PEG–VH032–VHL"
            caption="Warhead AUY922, conector PEG y reclutador VH032 hacia VHL, con ciclo de degradación."
          />
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <PosterFigure
            src="/poster/bolsillos-anclaje.png"
            alt="Bolsillos de anclaje en HSP90 y HSP70 y ruta de ubiquitinación"
            caption="Residuos y bolsillos identificados para anclar el diseño antes de síntesis."
          />
          <div className="flex flex-col justify-center">
            <h3 className="font-heading text-2xl font-semibold text-ink">
              Qué ya está computado aquí
            </h3>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Docking secuencial con AutoDock Vina, ensamble del complejo ternario, optimización
              del linker, cero choques estéricos (&lt; 2,5 Å) y checklist de viabilidad de
              laboratorio. La dinámica molecular (GROMACS) y el ADMET completo siguen en la hoja
              de ruta del póster.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/viabilidad">
                  Ver viabilidad
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/wiki/hoja-de-ruta">Hoja de ruta MD</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Metodología */}
      <section className="border-y border-border/60 bg-card/35">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
            4 · Metodología
          </p>
          <h2 className="font-heading mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Del bolsillo al complejo ternario
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Flujo del póster: estructuras proteicas → identificación de pockets → diseño del
            PROTAC → acoplamiento molecular → dinámica → predicción ADMET. Este sitio documenta
            sobre todo el tramo de diseño, docking y viabilidad.
          </p>

          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <PosterFigure
              src="/poster/autodock-vina.png"
              alt="Ilustración de grid box de AutoDock Vina"
              caption="Acoplamiento molecular con AutoDock Vina sobre los bolsillos de HSP90 y VHL."
            />
            <PosterFigure
              src="/poster/dinamica-gromacs.png"
              alt="Caja de simulación de dinámica molecular"
              caption="Siguiente paso del póster: relajar el ternario en agua explícita (GROMACS / OpenMM)."
            />
          </div>
        </div>
      </section>

      {/* Explorar */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="font-heading text-2xl font-semibold tracking-tight">Explorar el modelo</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Tres entradas: evidencia previa a síntesis, estructura 3D y documentación técnica.
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
              body: "HSP90, VHL y el puente PEG con superficies PPI interactivas.",
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

import { Seo } from "@/components/Seo"
import { MolViewer } from "@/components/viewer/MolViewer"

export function VisorPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <Seo
        title="Visor 3D del complejo ternario"
        description="Explora en 3D el complejo HSP90α–PROTAC–VHL: bolsillos Asp93 y Tyr98, puente PEG2, superficies PPI y etiquetas de anclaje."
        path="/visor"
      />
      <section className="mb-6 max-w-3xl">
        <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">Estructura 3D</p>
        <h1 className="font-heading mt-3 text-4xl font-semibold tracking-tight text-ink">
          Complejo ternario
        </h1>
        <p className="mt-3 text-muted-foreground">
          Tags en la escena para HSP90, VHL y los módulos [AUY] / [LNK] / [VHL], más leyenda
          lateral y sticks de bolsillo/PPI.
        </p>
      </section>

      <MolViewer />
    </div>
  )
}

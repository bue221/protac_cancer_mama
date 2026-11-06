import { MolViewer } from "@/components/viewer/MolViewer"

export function VisorPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
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

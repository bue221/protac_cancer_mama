import { Link } from "react-router-dom"
import { Download } from "lucide-react"

import { Seo } from "@/components/Seo"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const VINA_ROWS = [
  ["Afinidad HSP90 (score Vina)", "−9.489 kcal/mol", "Anclaje fuerte del warhead en Asp93/Asn106"],
  ["Afinidad VHL (score Vina)", "−6.561 kcal/mol", "Reconocimiento de VH032 (Tyr98/His115)"],
  ["Energía intermolecular ternaria", "−15.885 kcal/mol", "Suma de interacciones en ambos bolsillos"],
  ["Choques estéricos (< 2.5 Å)", "0", "Sin colisiones graves HSP90–VHL"],
  ["Contactos PPI (< 5 Å)", "121 pares", "Abrazo interfacial alrededor del PEG2"],
  ["Extensión PEG2", "7.00 Å", "Conformación gauche relajada"],
]

const DOWNLOADS = [
  {
    href: "/data/complejo_ternario_limpio.pdb",
    title: "Complejo ternario (PDB)",
    detail: "HSP90 + PROTAC + VHL con CONECT",
  },
  {
    href: "/data/viabilidad_laboratorio.json",
    title: "Viabilidad laboratorio (JSON)",
    detail: "Checklist pass/warn del script 04",
  },
  {
    href: "/data/alphafold_ppi_model_0.pdb",
    title: "AlphaFold modelo 0 (PDB)",
    detail: "HSP90–VHL sin PROTAC",
  },
  {
    href: "/data/alphafold_ppi_sin_protac.json",
    title: "Resumen AlphaFold (JSON)",
    detail: "ipTM/pTM de los 5 modelos",
  },
]

export function ResultadosPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <Seo
        title="Resultados computacionales"
        description="Scores de AutoDock Vina, métricas PPI del complejo ternario, AlphaFold sin PROTAC y descargas de PDB/JSON."
        path="/resultados"
      />

      <section className="max-w-3xl">
        <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">Evidencia</p>
        <h1 className="font-heading mt-3 text-4xl font-semibold tracking-tight text-ink">
          Resultados
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Números del pipeline Vina + ensamble ternario. Los scores no son Kd de laboratorio; ver{" "}
          <Link to="/limitaciones" className="text-primary hover:underline">
            limitaciones
          </Link>
          .
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-heading text-2xl font-semibold text-ink">Docking y PPI (Vina)</h2>
        <div className="mt-4 overflow-x-auto border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Métrica</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Lectura</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {VINA_ROWS.map(([m, v, r]) => (
                <TableRow key={m}>
                  <TableCell className="font-medium">{m}</TableCell>
                  <TableCell className="font-mono text-sm">{v}</TableCell>
                  <TableCell className="text-muted-foreground">{r}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/visor">Abrir visor ternario</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/alphafold">Contraste AlphaFold (ipTM 0.52)</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/viabilidad">Checklist viabilidad</Link>
          </Button>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="font-heading text-2xl font-semibold text-ink">Descargas</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Archivos servidos desde el portal (mismos datos que el repo).
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {DOWNLOADS.map((d) => (
            <li key={d.href} className="flex items-start justify-between gap-3 border border-border bg-card/40 px-4 py-4">
              <div>
                <p className="font-heading font-semibold text-ink">{d.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{d.detail}</p>
              </div>
              <Button asChild size="sm" variant="outline">
                <a href={d.href} download>
                  <Download data-icon="inline-start" />
                  Bajar
                </a>
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

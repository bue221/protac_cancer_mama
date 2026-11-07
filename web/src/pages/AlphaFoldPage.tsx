import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Download } from "lucide-react"

import { Seo } from "@/components/Seo"
import { StatusBadge } from "@/components/StatusBadge"
import { AfPpiViewer } from "@/components/viewer/AfPpiViewer"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { fetchAfPpiReport, iptmLabel } from "@/lib/alphafold"
import type { AfPpiReport } from "@/types/alphafold"
import type { CheckStatus } from "@/types/viabilidad"

export function AlphaFoldPage() {
  const [report, setReport] = useState<AfPpiReport | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void fetchAfPpiReport()
      .then(setReport)
      .catch((err: Error) => setError(err.message))
  }, [])

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-muted-foreground sm:px-6">
        Cargando evidencia AlphaFold…
      </div>
    )
  }

  const best = report.best_model
  const verdict = iptmLabel(best.iptm)
  const status = verdict.tone as CheckStatus

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <Seo
        title="AlphaFold PPI sin PROTAC"
        description="Predicción AlphaFold Server de HSP90 NTD + VHL sin ligando: ipTM 0.52, interfaz incierta. Evidencia archivada de que el puente PROTAC es necesario."
        path="/alphafold"
      />

      <section className="animate-rise max-w-3xl">
        <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
          Evidencia · AlphaFold Server
        </p>
        <h1 className="font-heading mt-3 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          PPI sin PROTAC
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Job <span className="text-foreground">{report.job_name}</span>: solo HSP90-α NTD + VHL.
          El Server no admite el SMILES del PROTAC; este resultado documenta la interfaz{" "}
          <em>sin</em> el puente AUY922–PEG2–VH032.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <StatusBadge status={status} />
          <span className="text-sm text-muted-foreground">{verdict.label}</span>
        </div>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["ipTM", best.iptm.toFixed(2), "Confianza de interfaz"],
          ["pTM", best.ptm.toFixed(2), "Calidad del complejo"],
          ["Ranking", best.ranking_score.toFixed(2), "Modelo 0 de 5"],
          ["PAE mín. A↔B", `${best.chain_pair_pae_min_A_B.toFixed(1)} Å`, "Error entre cadenas"],
        ].map(([k, v, hint]) => (
          <div key={k} className="border border-border/80 bg-card/40 px-4 py-4">
            <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
              {k}
            </p>
            <p className="font-heading mt-2 text-3xl font-semibold text-ink">{v}</p>
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          </div>
        ))}
      </section>

      <section className="mt-10">
        <AfPpiViewer />
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild variant="outline" size="sm">
            <a href="/data/alphafold_ppi_model_0.pdb" download>
              <Download data-icon="inline-start" />
              PDB modelo 0
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href="/data/alphafold_ppi_sin_protac.json" download>
              <Download data-icon="inline-start" />
              JSON scores
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/resultados">Ver resultados Vina</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/limitaciones">Limitaciones</Link>
          </Button>
        </div>
      </section>

      <section className="mt-12 max-w-3xl space-y-4">
        <h2 className="font-heading text-2xl font-semibold text-ink">Interpretación</h2>
        <p className="leading-relaxed text-muted-foreground">{report.interpretation.resumen_es}</p>
        <p className="leading-relaxed text-muted-foreground">{report.why_no_protac}</p>
        <p className="text-sm text-muted-foreground">
          Compara con el ternario Vina (HSP90 + PROTAC + VHL) en el{" "}
          <Link to="/visor" className="text-primary hover:underline">
            visor 3D
          </Link>
          .
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-heading text-2xl font-semibold text-ink">Cinco modelos del job</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Todos los ipTM quedan ≤ 0.52: ninguno salva la interfaz sin ligando.
        </p>
        <div className="mt-4 overflow-x-auto border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>ipTM</TableHead>
                <TableHead>pTM</TableHead>
                <TableHead>Ranking score</TableHead>
                <TableHead>pTM A / B</TableHead>
                <TableHead>PAE A↔B</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.models.map((m) => (
                <TableRow key={m.rank}>
                  <TableCell>{m.rank}</TableCell>
                  <TableCell>{m.iptm.toFixed(2)}</TableCell>
                  <TableCell>{m.ptm.toFixed(2)}</TableCell>
                  <TableCell>{m.ranking_score.toFixed(2)}</TableCell>
                  <TableCell>
                    {m.chain_ptm.A_HSP90_NTD.toFixed(2)} / {m.chain_ptm.B_VHL.toFixed(2)}
                  </TableCell>
                  <TableCell>{m.chain_pair_pae_min_A_B.toFixed(1)} Å</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="mt-12 max-w-3xl space-y-3 border-t border-border/70 pt-8 text-sm text-muted-foreground">
        <h2 className="font-heading text-lg font-semibold text-ink">Archivo y términos</h2>
        <p>
          Evidencia en el repo: <code>06_alphafold_server/</code>. La URL del Server es secundaria
          y puede caducar:{" "}
          <a
            href={report.job_url_ephemeral}
            className="text-primary hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            enlace del job
          </a>
          .
        </p>
        <p>{report.job_url_note}</p>
        <p>{report.terms}</p>
        <p className="text-xs">{report.citation}</p>
      </section>
    </div>
  )
}

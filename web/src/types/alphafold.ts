export type AfVerdict = "interfaz_incierta" | "interfaz_confiable" | "interfaz_poco_confiable"

export interface AfModelSummary {
  rank: number
  iptm: number
  ptm: number
  ranking_score: number
  has_clash: number
  fraction_disordered: number
  chain_ptm: Record<string, number>
  chain_pair_pae_min_A_B: number
  files: { cif: string; summary: string }
}

export interface AfPpiReport {
  job_name: string
  source: string
  job_url_ephemeral: string
  job_url_note: string
  includes_protac: boolean
  why_no_protac: string
  chains: Array<{
    id: string
    label: string
    uniprot: string
    residues: string
    length: number
  }>
  interpretation: {
    veredicto: string
    resumen_es: string
    umbrales: Record<string, string>
  }
  best_model: AfModelSummary
  models: AfModelSummary[]
  terms: string
  citation: string
}

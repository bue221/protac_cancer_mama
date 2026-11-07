import type { AfPpiReport } from "@/types/alphafold"

export async function fetchAfPpiReport(): Promise<AfPpiReport> {
  const res = await fetch("/data/alphafold_ppi_sin_protac.json", { cache: "no-store" })
  if (!res.ok) {
    throw new Error(`No se pudo cargar el reporte AlphaFold (${res.status})`)
  }
  return (await res.json()) as AfPpiReport
}

export function iptmLabel(iptm: number): { label: string; tone: "pass" | "warn" | "fail" } {
  if (iptm > 0.8) return { label: "interfaz confiable", tone: "pass" }
  if (iptm >= 0.5) return { label: "interfaz incierta", tone: "warn" }
  return { label: "interfaz poco confiable", tone: "fail" }
}

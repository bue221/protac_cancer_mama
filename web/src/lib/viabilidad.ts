import type { CheckStatus, ViabilidadReport } from "@/types/viabilidad"

export async function fetchViabilidad(): Promise<ViabilidadReport> {
  const res = await fetch("/data/viabilidad_laboratorio.json", { cache: "no-store" })
  if (!res.ok) {
    throw new Error(`No se pudo cargar viabilidad (${res.status})`)
  }
  return res.json() as Promise<ViabilidadReport>
}

export function verdictLabel(nivel: string): string {
  const map: Record<string, string> = {
    viable_modular_en_papel: "Viable modular (en papel)",
    viable_con_reservas: "Viable con reservas",
    no_viable_computacionalmente: "No viable computacionalmente",
  }
  return map[nivel] ?? nivel
}

export function statusTone(status: CheckStatus): "pass" | "warn" | "fail" {
  return status
}

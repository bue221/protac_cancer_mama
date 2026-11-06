export type CheckStatus = "pass" | "warn" | "fail"

export interface ViabilidadCheck {
  id: string
  titulo: string
  status: CheckStatus
  detalle: string
  /** Cómo se llegó al número / criterio */
  como?: string
  /** Por qué ese cálculo importa para decidir síntesis */
  porque?: string
  valor?: unknown
  alertas?: string[]
  ruta_sugerida?: string[]
  rango_aceptable_protac?: string
}

export interface ViabilidadMetodologia {
  objetivo: string
  pipeline: string[]
  herramientas: string[]
  no_demuestra: string[]
}

export interface ViabilidadReport {
  generated_at: string
  molecule: {
    name: string
    smiles: string
    target: string
    e3_ligase: string
  }
  propiedades: {
    formula: string
    mw: number
    clogp: number
    tpsa: number
    hbd: number
    hba: number
    rotatable_bonds: number
    rings: number
    qed: number
    sa_score: number
    heavy_atoms: number
  }
  metodologia?: ViabilidadMetodologia
  checks: ViabilidadCheck[]
  veredicto: {
    nivel: string
    resumen: string
    contadores: {
      pass: number
      warn: number
      fail: number
      total: number
    }
  }
  disclaimer: string
}

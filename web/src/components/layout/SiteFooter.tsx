import { Link } from "react-router-dom"

export function SiteFooter() {
  return (
    <footer className="mt-8 border-t border-border/70">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-muted-foreground sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xl space-y-2">
            <p className="font-heading text-base font-semibold text-ink">
              PROTAC · cáncer de mama
            </p>
            <p>
              Portal del proyecto PROTAC HSP90–VHL: docking, complejo ternario, viabilidad in
              silico y contraste AlphaFold. Autores: Martínez-Burbano DV, Martínez-González LG ·
              Bacteriología y Laboratorio Clínico, Universidad Colegio Mayor de Cundinamarca.
            </p>
            <p className="text-xs leading-relaxed">
              Modelo preliminar in silico: no sustituye síntesis, ADMET experimental ni bioensayo
              celular.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <Link to="/resultados" className="hover:text-foreground">
              Resultados
            </Link>
            <Link to="/viabilidad" className="hover:text-foreground">
              Viabilidad
            </Link>
            <Link to="/visor" className="hover:text-foreground">
              Visor 3D
            </Link>
            <Link to="/alphafold" className="hover:text-foreground">
              AlphaFold PPI
            </Link>
            <Link to="/limitaciones" className="hover:text-foreground">
              Limitaciones
            </Link>
            <Link to="/wiki" className="hover:text-foreground">
              Wiki
            </Link>
            <p className="mt-2 font-mono text-xs">protac_cancer_mama</p>
            <p className="max-w-xs text-right text-[11px] leading-relaxed">
              Outputs AlphaFold: uso no comercial · ver LICENSE / terms_of_use.md
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

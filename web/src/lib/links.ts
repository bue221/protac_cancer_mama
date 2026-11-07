/** Wiki técnica completa del repositorio (GitHub Wiki). */
export const REPO_WIKI_URL = "https://github.com/bue221/protac_cancer_mama/wiki"

export const REPO_WIKI_PAGES = {
  home: REPO_WIKI_URL,
  glosario: `${REPO_WIKI_URL}/Glosario-Bioinformatico`,
  faq: `${REPO_WIKI_URL}/Preguntas-Frecuentes-FAQ`,
  hojaDeRuta: `${REPO_WIKI_URL}/Hoja-de-Ruta-HADDOCK-y-Dinamica-Molecular`,
  fundamentos: `${REPO_WIKI_URL}/01-Fundamentos-Biologicos-y-Quimicos`,
  pipeline: `${REPO_WIKI_URL}/02-Arquitectura-y-Pipeline-Computacional`,
  estabilidad: `${REPO_WIKI_URL}/03-Analisis-Fisicoquimico-y-Estabilidad`,
  visualizacion: `${REPO_WIKI_URL}/04-Guia-Visualizacion-3D-y-Ejecucion`,
} as const

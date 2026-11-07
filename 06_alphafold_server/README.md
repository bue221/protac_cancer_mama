# 06 · AlphaFold Server — PPI HSP90–VHL **sin** PROTAC

Evidencia archivada del job `HSP90_NTD_VHL_PPI_sin_PROTAC` corrido en
[AlphaFold Server](https://alphafoldserver.com/).

La URL del historial (`https://alphafoldserver.com/fold/397856302ca8d1c`) **no es
permanente**; este directorio es la prueba reproducible en el repo.

## Resultado (modelo rank 0)

| Métrica | Valor | Lectura |
|---|---:|---|
| **ipTM** | **0.52** | Interfaz en zona frontera / incierta |
| **pTM** | **0.53** | Complejo global mediocre |
| ranking_score | 0.57 | Mejor de 5 seeds del job |
| chain pTM A (HSP90) | 0.74 | Dominio individual razonable |
| chain pTM B (VHL) | 0.84 | Dominio individual bueno |
| PAE mín. A↔B | ~4.2 Å | Error relativo entre cadenas no bajo |
| choques | 0 | Sin choques graves reportados |

**Veredicto del proyecto:** sin el ligando puente, AF **no** apoya una PPI
HSP90–VHL espontánea y confiable. Encaja con el diseño PROTAC (el ternario
requiere AUY922–PEG2–VH032). El Server **no** admite el SMILES custom del
PROTAC; para eso hace falta AF3 local (`01_estructuras_iniciales/alphafold3_local_input.json`).

## Contenido

| Archivo | Descripción |
|---|---|
| `resumen.json` | Scores, interpretación y metadatos (también en `web/public/data/`) |
| `job_request.json` | Input exacto enviado al Server |
| `models/model_0..4.cif` | Cinco modelos rankeados |
| `models/model_0.pdb` | Rank 0 convertido para el visor web |
| `confidences/summary_*.json` | Confianzas por modelo |
| `terms_of_use.md` | AlphaFold Server Output Terms of Use |

Omitidos del repo (pesados; están en la descarga original): `full_data_*.json`,
`msas/`, `templates/`.

## Web

Portal: ruta `/alphafold` — scores + visor del modelo 0 (solo proteínas).

## Cita

Abramson J et al. Accurate structure prediction of biomolecular interactions
with AlphaFold 3. *Nature* (2024). Uso no comercial; respetar `terms_of_use.md`.

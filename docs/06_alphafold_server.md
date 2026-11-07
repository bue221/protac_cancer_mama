# 06. AlphaFold Server: cómo subir el job (y por qué falló el JSON anterior)

## Error: `No jobs found in file`

El archivo viejo `alphafold3_input.json` era un **objeto único** con:

- `dialect: "alphafold3"` (formato del código **local** de AF3)
- proteínas como `"protein"` + `"id"`
- ligando como **SMILES** del PROTAC

**AlphaFold Server** exige otra cosa:

1. El JSON debe ser un **array** `[ { job }, ... ]` (aunque sea un solo job).
2. `dialect` debe ser `"alphafoldserver"`.
3. Proteínas como `"proteinChain"` con `"sequence"` + `"count"`.
4. Ligandos solo de una lista fija de códigos CCD (`CCD_ATP`, `CCD_HEM`, …). **No acepta SMILES custom** como nuestro PROTAC.

## Archivos correctos en el repo

| Archivo | Para qué |
|---|---|
| `01_estructuras_iniciales/alphafold_server_hsp90_vhl.json` | **Subir al Server** (HSP90 NTD + VHL, sin PROTAC) |
| `01_estructuras_iniciales/alphafold3_input.json` | Copia del Server (mismo formato array) |
| `01_estructuras_iniciales/alphafold3_local_input.json` | AF3 local / Colab con SMILES del PROTAC |

## Qué puedes comprobar en el Server (sin PROTAC)

Predicción co-plegada **HSP90–VHL**:

- ¿Hay interfaz PPI plausible? (PAE bajo entre cadenas, ipTM)
- ¿Coincide la cara de contacto con tu modelo Vina?

Eso **no** modela el puente AUY922–PEG2–VH032. El ternario con ligando sigue siendo tu pipeline Vina (+ AF3 local si tienes GPU/cluster).

## Pasos en alphafoldserver.com

1. Upload JSON → sube `alphafold_server_hsp90_vhl.json`
2. Debe aparecer como draft (ya no “No jobs found”)
3. Abre el draft, revisa secuencias, **Run**
4. Descarga zip → mira `ranking_score`, `iptm`, `ptm`, CIF/PDB
5. Compara interfaz vs `04_complejo_ternario_final/complejo_ternario_limpio.pdb`

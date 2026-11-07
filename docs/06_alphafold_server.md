# 06. AlphaFold Server: job PPI sin PROTAC

## Por qué falló el JSON antiguo (`No jobs found in file`)

El Server exige un **array** de jobs, `dialect: "alphafoldserver"` y
`proteinChain` + `count`. No acepta el dialecto local `alphafold3` ni SMILES
custom del PROTAC.

## Archivos de entrada

| Archivo | Uso |
|---|---|
| `01_estructuras_iniciales/alphafold_server_hsp90_vhl.json` | Upload al Server |
| `01_estructuras_iniciales/alphafold3_local_input.json` | AF3 local **con** SMILES PROTAC |

## Resultado archivado

Descarga del job en `06_alphafold_server/` (ver `README.md` y `resumen.json`).

- **ipTM 0.52 / pTM 0.53** (modelo 0) → interfaz HSP90–VHL **incierta** sin ligando.
- Cada dominio se pliega mejor (pTM cadena A ~0.74, B ~0.84).
- URL efímera: `https://alphafoldserver.com/fold/397856302ca8d1c` — no sustituye el archivo local.

## Qué demuestra (y qué no)

- **Sí:** sin PROTAC, AF no ve un acoplamiento PPI claro entre estos constructos.
- **No:** no modela el ternario con AUY922–PEG2–VH032 (imposible en el Server).
- El puente ligando y la evidencia Vina del ternario siguen en
  `04_complejo_ternario_final/` y el visor `/visor`.

## Portal web

Ruta `/alphafold`: resumen de scores + modelo 0 en 3D.

# AGENTS.md — Guía para Agentes de IA y Desarrolladores

Este documento define la arquitectura de carpetas, convenciones, entorno de ejecución y reglas técnicas del repositorio **`protac_cancer_mama` (Diseño y Simulación Computacional del Complejo Ternario PROTAC: `HSP90α – [AUY922–PEG2–VH032] – VHL`)**.

---

## 1. Contexto Científico del Proyecto

El proyecto modela y valida computacionalmente una quimera dirigida a la proteólisis (**PROTAC**) diseñada para inducir la ubiquitinación y degradación proteasomal de la chaperona **HSP90-α** (*Heat Shock Protein 90 Alpha*, UniProt `P07900`) reclutando la ubiquitina ligasa E3 **VHL** (*Von Hippel-Lindau*, UniProt `P40337`).

La arquitectura tripartita de la molécula PROTAC es:
1. **Warhead (`[AUY]`, residuo `1`):** **NVP-AUY922 (Luminespib)** — inhibidor de alta afinidad del bolsillo N-terminal de unión a ATP de HSP90-α (`Asp93`, `Asn106`, `Gly97`, `Phe138`).
2. **Linker (`[LNK]`, residuo `2`):** **Cadena PEG2** (`-NH-CH2-CH2-O-CH2-CH2-O-CH2-C(=O)-`) — conector flexible hidrofílico con 8 enlaces simples rotables.
3. **Ligando E3 (`[VHL]`, residuo `3`):** **VH032** — peptidomimético derivado de hidroxiprolina específico para el bolsillo de reconocimiento de VHL (`Tyr98`, `His115`, `Phe91`, `Trp88`).

---

## 2. Entorno de Ejecución y Herramientas

* **Intérprete Python local (dentro del workspace):**
  ```bash
  ./.venv/bin/python3
  ```
* **Motor de Docking Molecular:**
  ```bash
  ./bin/vina
  ```
  *(AutoDock Vina v1.2.5 nativo para `macOS arm64`).*

---

## 3. Mapa de Carpetas del Repositorio

| Carpeta / Archivo | Contenido y Propósito |
| :--- | :--- |
| `scripts/01_construir_protac.py` | **Paso 1:** Construye el PROTAC desde SMILES, genera confórmeros 3D (`ETKDGv3`), minimiza con `MMFF94s` y exporta a `01_estructuras_iniciales/`. |
| `scripts/02_ensamblar_complejo_ternario.py` | **Paso 2:** Fusiona las poses de Docking 1 y 2, optimiza las torsiones del linker PEG2 para maximizar la interfaz Proteína–Proteína (PPI) sin choques estéricos (`< 2.5 Å`), ejecuta `./bin/vina --local_only` y reconstruye los PDB con conectividades RDKit (`CONECT`) en `04_complejo_ternario_final/`. |
| `scripts/03_analizar_estabilidad.py` | **Paso 3:** Calcula $\Delta G$, $K_d$, energía intermolecular, choques estéricos, contactos PPI y extensión del puente PEG2. |
| `scripts/04_viabilidad_laboratorio.py` | **Paso 4:** Checklist de viabilidad de laboratorio (SA Score, bloques modulares, alertas PAINS/Brenk, estereoquímica, choques PPI) → `05_visor_3d/data/viabilidad_laboratorio.json`. |
| `01_estructuras_iniciales/` | Contiene `hsp90.pdb`, `vhl.pdb`, `protac.pdb`, `protac.sdf` y `alphafold3_input.json`. |
| `02_preparacion_pdbqt/` | Contiene `receptor_hsp90.pdbqt`, `receptor_vhl.pdbqt` y `ligando_protac.pdbqt` generados con Meeko 0.8.0. |
| `03_docking_secuencial/` | Contiene `config_docking1_hsp90.txt`, `resultado_docking1_hsp90.pdbqt`, `mejor_pose_hsp90.pdb/.pdbqt`, `macromodelo_hsp90_protac.pdb/.pdbqt`, `config_docking2_vhl.txt` y `resultado_docking2_vhl.pdbqt`. |
| `04_complejo_ternario_final/` | Contiene `complejo_ternario_limpio.pdb` (dominios catalíticos plegados + `CONECT`), `complejo_ternario_completo.pdb`, `protac_en_complejo.pdb/.pdbqt` y `receptor_ternario_hsp90_vhl.pdbqt`. |
| `web/` | Portal React + Vite + shadcn/ui (inicio, viabilidad, visor 3Dmol, wiki). Build → `web/dist` (Vercel). |
| `05_visor_3d/` | Portal HTML legacy (referencia). El despliegue activo usa `web/`. |
| `docs/` y `wiki/` | Documentación científica y técnica detallada del proyecto. |

---

## 4. Reglas Críticas para Modificaciones (¡Leer antes de editar!)

1. **Usar siempre `01_estructuras_iniciales/protac.sdf` como entrada de `mk_prepare_ligand`:**
   * `mk_prepare_ligand` requiere formato `.sdf` o `.mol2` para percibir correctamente órdenes de enlace aromáticos e hibridaciones.
2. **Mapeo de Índices Atómicos entre `.pdbqt` y `RDKit`:**
   * La línea `REMARK SMILES IDX` en `02_preparacion_pdbqt/ligando_protac.pdbqt` indexa sobre el SMILES canónico interno de Meeko, **no** sobre el orden de átomos de `01_estructuras_iniciales/protac.sdf`.
   * Siempre que se reconstruya un archivo `.pdb` desde coordenadas `.pdbqt`, el mapeo `pq_to_rd` debe realizarse por **correspondencia exacta de coordenadas 3D iniciales** entre `02_preparacion_pdbqt/ligando_protac.pdbqt` y `01_estructuras_iniciales/protac.sdf`, exportando con `Chem.MolToPDBBlock(mol)`.
3. **Numeración de Residuos en `01_estructuras_iniciales/vhl.pdb` (`P40337-3`):**
   * El archivo `vhl.pdb` comienza en `Met54` de la isoforma canónica de VHL (`Residuo 1 local = Met54 canónico`). Para convertir a numeración cristalográfica canónica (ej. PDB `4W9H`), se suma **`+53`** (`TYR 45` local = `Tyr98` canónico; `HIS 62` local = `His115` canónico).
4. **Verificación Obligatoria:**
   * Cualquier cambio en `scripts/` debe verificarse ejecutando `./.venv/bin/python3 scripts/03_analizar_estabilidad.py` desde la raíz del repositorio y comprobando que `Choques estéricos (< 2.5 Å) == 0`.
   * Tras cambios en el SMILES o el complejo ternario, regenerar el reporte web con `./.venv/bin/python3 scripts/04_viabilidad_laboratorio.py` (0 `fail` en el checklist; el veredicto puede ser `viable_*`).

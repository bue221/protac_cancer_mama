# PROTAC Cáncer de Mama (`protac_cancer_mama`): Diseño y Simulación del Complejo Ternario `HSP90α – [AUY922–PEG2–VH032] – VHL`

[![Python 3.13+](https://img.shields.io/badge/Python-3.13%2B-3776AB?logo=python&logoColor=white)](#5-guia-rapida-de-ejecucion-en-local)
[![RDKit](https://img.shields.io/badge/Quimioinformatica-RDKit_MMFF94s-22c55e)](#2-arquitectura-quimica-del-protac)
[![Meeko 0.8](https://img.shields.io/badge/Parametrizacion-Meeko_0.8-eab308)](#3-flujo-del-pipeline-computacional)
[![AutoDock Vina 1.2.5](https://img.shields.io/badge/Docking-AutoDock_Vina_1.2.5-f97316)](#4-resultados-de-estabilidad-y-acoplamiento-ppi)

Repositorio bioinformático y quimioinformático para el **diseño racional, parametrización electrostática, docking secuencial, acoplamiento Proteína–Proteína (PPI) y validación termodinámica** de una quimera dirigida a la proteólisis (**PROTAC**) diseñada para degradar la chaperona oncogénica **HSP90-α** (sobreexpresada en cáncer de mama HER2+ y triple negativo) reclutando la ubiquitina ligasa E3 **VHL** (*Von Hippel-Lindau*).

---

## Tabla de Contenidos

1. [¿Qué hace este proyecto y por qué funciona?](#1-que-hace-este-proyecto-y-por-que-funciona)
2. [Arquitectura Química del PROTAC](#2-arquitectura-quimica-del-protac)
3. [Flujo del Pipeline Computacional](#3-flujo-del-pipeline-computacional)
4. [Resultados de Estabilidad y Acoplamiento PPI](#4-resultados-de-estabilidad-y-acoplamiento-ppi)
5. [Guía Rápida de Ejecución en Local](#5-guia-rapida-de-ejecucion-en-local)
6. [Estructura Organizada del Repositorio](#6-estructura-organizada-del-repositorio)

---

## 1. ¿Qué hace este proyecto y por qué funciona?

### El Problema de los Inhibidores Tradicionales vs. PROTACs en Cáncer de Mama
En tumores de mama agresivos (como **HER2+** y **Triple Negativo**), la chaperona **HSP90-α** estabiliza oncoproteínas críticas (`HER2`, `AKT`, `EGFR`, `CDK4`).
* **Inhibidor clásico (*Occupancy-Driven*):** Un inhibidor como **NVP-AUY922 (Luminespib)** bloquea temporalmente el bolsillo de ATP de HSP90-α, pero requiere concentraciones altas que inducen respuesta de choque térmico compensatoria y toxicidad.
* **PROTAC (*Event-Driven Pharmacology*):** Nuestra molécula bifuncional une **NVP-AUY922** con **VH032** mediante un puente **PEG2**:
  1. **NVP-AUY922 (`[AUY]`)** captura a **HSP90-α** en su bolsillo N-terminal (`Asp93`).
  2. **VH032 (`[VHL]`)** recluta a la ubiquitina ligasa E3 **VHL** (`Tyr98` / `His115`).
  3. El puente **PEG2 (`[LNK]`)** acerca ambas proteínas hasta formar un **abrazo cooperativo Proteína–Proteína (PPI)**, promoviendo la poliubiquitinación y destrucción total de HSP90-α en el proteasoma 26S.

```mermaid
flowchart LR
    subgraph Complejo_Ternario ["Complejo Ternario Cooperativo (Sin Choques Estéricos)"]
        HSP["HSP90-α (Diana)<br/>Bolsillo N-terminal Asp93"]
        AUY["[AUY] Warhead<br/>NVP-AUY922"]
        LNK["[LNK] Puente<br/>Linker PEG2 (7.0 Å)"]
        VH["[VHL] Ligando E3<br/>VH032"]
        VHL_PROT["E3 Ligasa VHL<br/>Bolsillo Tyr98 / His115"]
        
        HSP <-->|"ΔG = -9.49 kcal/mol<br/>(Kd ≈ 110 nM)"| AUY
        AUY --- LNK
        LNK --- VH
        VH <-->|"ΔG = -6.56 kcal/mol<br/>(Kd ≈ 15 µM)"| VHL_PROT
        HSP <-->|"Abrazo PPI Cooperativo<br/>121 contactos < 5 Å | 0 choques"| VHL_PROT
    end
    Complejo_Ternario -->|"Transferencia de<br/>Ubiquitina"| DEG["Degradación de HSP90-α<br/>en el Proteasoma 26S"]
```

---

## 2. Arquitectura Química del PROTAC

La molécula se construye de forma modular en `scripts/01_construir_protac.py`:

| Módulo | Etiqueta PDB | Estructura Química | Función Biológica y Residuos Diana |
| :--- | :---: | :--- | :--- |
| **1. Warhead** | `AUY` (Residuo `1`) | **NVP-AUY922 (Luminespib)**<br>*(Isoxazol + Resorcinol + Fenil-morfolina)* | Se ancla en el bolsillo N-terminal de unión a ATP de **HSP90-α** mediante puentes de hidrógeno con **`Asp93`**, **`Asn106`**, **`Gly97`** y contacto con **`Phe138`**. |
| **2. Linker** | `LNK` (Residuo `2`) | **Cadena PEG2**<br>(`-NH-CH2-CH2-O-CH2-CH2-O-CH2-C(=O)-`) | Otorga flexibilidad torsional (8 enlaces rotables) para acercar ambas proteínas en conformación *gauche* relajada (`6.4–7.0 Å`). |
| **3. Ligando E3** | `VHL` (Residuo `3`) | **VH032**<br>*(Hidroxiprolina + tert-Leucina + Metiltiazol-bencilo)* | Recluta el dominio de reconocimiento de **VHL** mediante puentes de hidrógeno con **`Tyr98`** (`TYR 45`) e **`His115`** (`HIS 62`). |

* **Fórmula Molecular:** $\text{C}_{52}\text{H}_{66}\text{N}_{8}\text{O}_{10}\text{S}$ (`136 átomos totales`: `71 pesados` + `65 hidrógenos`).
* **Peso Molecular:** `995.21 g/mol` | **cLogP:** `5.20` | **TPSA:** `222.86 Å²`.

---

## 3. Flujo del Pipeline Computacional

```mermaid
flowchart TD
    A["1. Quimioinformática 3D (scripts/01_construir_protac.py)<br/>SMILES -> RDKit ETKDGv3 -> Minimización MMFF94s<br/>Salida: 01_estructuras_iniciales/protac.sdf y protac.pdb"] --> B["2. Parametrización con Meeko (02_preparacion_pdbqt/)<br/>receptor_hsp90.pdbqt, receptor_vhl.pdbqt y ligando_protac.pdbqt"]
    B --> C["3. Primer Docking en AutoDock Vina (03_docking_secuencial/)<br/>Grid Box en bolsillo Asp93 de HSP90 -> Modo 1: -9.489 kcal/mol"]
    C --> D["4. Segundo Docking en AutoDock Vina (03_docking_secuencial/)<br/>Grid Box en bolsillo Tyr98/His115 de VHL -> Pose activa: -6.561 kcal/mol"]
    D --> E["5. Ensamblaje Ternario y Optimización PPI (scripts/02_ensamblar_complejo_ternario.py)<br/>Maximización de contactos PPI + Vina --local_only + CONECT RDKit<br/>Salida: 04_complejo_ternario_final/complejo_ternario_limpio.pdb"]
    E --> F["6. Validación y Visor 3D (scripts/03_analizar_estabilidad.py)<br/>05_visor_3d/visor_3d_complejo_ternario.html"]
```

---

## 4. Resultados de Estabilidad y Acoplamiento PPI

| Métrica de Validación | Resultado Obtenido | Criterio Bioinformático | Interpretación |
| :--- | :---: | :---: | :--- |
| **Afinidad Bolsillo HSP90 ($\Delta G_1$)** | **`-9.489 kcal/mol`**<br>($K_d \approx 110.8\text{ nM}$) | $< -8.0\text{ kcal/mol}$ | Anclaje nanomolar fuerte del warhead NVP-AUY922 en `Asp93` y `Asn106`. |
| **Afinidad Bolsillo VHL ($\Delta G_2$)** | **`-6.561 kcal/mol`**<br>($K_d \approx 15.5\ \mu\text{M}$) | $< -6.0\text{ kcal/mol}$ | Reconocimiento específico de la hidroxiprolina de VH032 por `Tyr98` e `His115`. |
| **Energía Intermolecular Ternaria** | **`-15.885 kcal/mol`** | $< -14.0\text{ kcal/mol}$ | Suma sinérgica de las interacciones del PROTAC dentro de ambos bolsillos simultáneamente. |
| **Choques Estéricos Severos ($< 2.5\text{ \AA}$)** | **`0 choques`** | `0 choques` | Ninguna colisión atómica prohibida entre los átomos pesados de HSP90-α y VHL. |
| **Distancia Mínima Proteína–Proteína** | **`2.729 Å`** | $2.7\text{ – }3.8\text{ \AA}$ | Contacto íntimo de van der Waals y puentes polares entre ambas superficies proteicas. |
| **Contactos Cooperativos PPI** | **`121 pares` ($< 5.0\text{ \AA}$)**<br>**`308 pares` ($< 6.0\text{ \AA}$)** | $> 80\text{ pares}$ | Las superficies de HSP90 (`Thr99–Asn105`, `Asp157–Tyr160`) y VHL (`Pro41–Thr47`) se abrazan alrededor del puente. |
| **Extensión del Puente PEG2** | **`7.00 Å`** | $5.5\text{ – }7.5\text{ \AA}$ | El linker adopta una conformación *gauche* relajada sin estirarse como una cuerda tensa. |

---

## 5. Guía Rápida de Ejecución en Local

```bash
# 1. Crear y activar entorno virtual (o usar .venv incluido)
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Paso 1: Generar el PROTAC 3D desde SMILES con RDKit (MMFF94s)
python3 scripts/01_construir_protac.py

# Paso 2: Convertir proteínas y PROTAC a formato PDBQT con Meeko
python3 -m meeko.cli.mk_prepare_receptor --read_pdb 01_estructuras_iniciales/hsp90.pdb -p 02_preparacion_pdbqt/receptor_hsp90.pdbqt
python3 -m meeko.cli.mk_prepare_receptor --read_pdb 01_estructuras_iniciales/vhl.pdb -p 02_preparacion_pdbqt/receptor_vhl.pdbqt
python3 -m meeko.cli.mk_prepare_ligand -i 01_estructuras_iniciales/protac.sdf -o 02_preparacion_pdbqt/ligando_protac.pdbqt

# Paso 3: Ejecutar Docking 1 (HSP90) y Docking 2 (VHL) en AutoDock Vina
./bin/vina --config 03_docking_secuencial/config_docking1_hsp90.txt
./bin/vina --config 03_docking_secuencial/config_docking2_vhl.txt

# Paso 4: Ensamblar el Complejo Ternario, optimizar la interfaz PPI y refinar con Vina
python3 scripts/02_ensamblar_complejo_ternario.py

# Paso 5: Ver reporte de estabilidad en terminal y abrir el Visor 3D en el navegador
python3 scripts/03_analizar_estabilidad.py
open 05_visor_3d/visor_3d_complejo_ternario.html
```

---

## 6. Estructura Organizada del Repositorio

```text
protac_cancer_mama/
├── README.md                                  # Portada general del proyecto
├── AGENTS.md                                  # Guía técnica para agentes de IA y desarrolladores
├── requirements.txt                           # Dependencias de Python (RDKit, Meeko, Gemmi, SciPy)
│
├── scripts/                                   # 🐍 Scripts de Python ordenados por etapa
│   ├── 01_construir_protac.py                 # Quimioinformática 3D (SMILES -> SDF / PDB / JSON AF3)
│   ├── 02_ensamblar_complejo_ternario.py      # Acoplamiento PPI, refinamiento Vina y enlaces CONECT
│   └── 03_analizar_estabilidad.py             # Diagnóstico termodinámico (ΔG, Kd) e interfacial (PPI)
│
├── 01_estructuras_iniciales/                  # 🧬 Proteínas base y ligando PROTAC inicial
│   ├── hsp90.pdb                              # Chaperona HSP90-α (Cadena A, UniProt P07900)
│   ├── vhl.pdb                                # E3 Ligasa VHL (UniProt P40337)
│   ├── protac.pdb                             # PROTAC optimizado con MMFF94s (.pdb)
│   ├── protac.sdf                             # PROTAC con órdenes de enlace exactos (.sdf)
│   └── alphafold3_input.json                  # Entrada lista para AlphaFold 3 Server
│
├── 02_preparacion_pdbqt/                      # ⚡ Estructuras parametrizadas con Meeko (Gasteiger + Torsiones)
│   ├── receptor_hsp90.pdbqt                   # Receptor rígido HSP90-α (.pdbqt)
│   ├── receptor_vhl.pdbqt                     # Receptor rígido VHL (.pdbqt)
│   └── ligando_protac.pdbqt                   # Ligando PROTAC con árbol ROOT/BRANCH (.pdbqt)
│
├── 03_docking_secuencial/                     # 🎯 Configuraciones de Grid Box y resultados de Vina
│   ├── config_docking1_hsp90.txt              # Configuración Grid Box para HSP90
│   ├── resultado_docking1_hsp90.pdbqt         # Poses del Primer Docking (-9.489 kcal/mol)
│   ├── mejor_pose_hsp90.pdb / .pdbqt          # Pose #1 extraída del bolsillo de HSP90
│   ├── macromodelo_hsp90_protac.pdb / .pdbqt  # Fusión rígida HSP90 + Pose #1 PROTAC
│   ├── config_docking2_vhl.txt                # Configuración Grid Box para VHL
│   └── resultado_docking2_vhl.pdbqt           # Poses del Segundo Docking (-6.561 kcal/mol)
│
├── 04_complejo_ternario_final/                # 🏆 Modelos 3D finales del Complejo Ternario
│   ├── complejo_ternario_limpio.pdb           # Dominios catalíticos plegados + PROTAC con CONECT (¡Ideal PyMOL!)
│   ├── complejo_ternario_completo.pdb         # Cadenas completas + PROTAC con CONECT
│   ├── protac_en_complejo.pdb / .pdbqt        # Conformación puente final del PROTAC
│   └── receptor_ternario_hsp90_vhl.pdbqt      # Receptores combinados HSP90 + VHL
│
├── 05_visor_3d/                               # 🖥️ Visualización interactiva en navegador
│   └── visor_3d_complejo_ternario.html        # Visor web 3Dmol.js con superficies PPI y puentes H
│
├── bin/                                       # ⚙️ Motor de simulación
│   └── vina                                   # Ejecutable AutoDock Vina v1.2.5 (macOS arm64)
│
├── docs/                                      # 📚 Documentación técnica detallada paso a paso
│   ├── 01_fundamentos_biologicos_y_quimicos.md
│   ├── 02_arquitectura_y_pipeline_computacional.md
│   ├── 03_analisis_fisicoquimico_y_estabilidad.md
│   └── 04_guia_visualizacion_3d_y_ejecucion.md
│
└── wiki/                                      # 🌐 Wiki del proyecto
    ├── Home.md
    ├── Glosario-Bioinformatico.md
    ├── Preguntas-Frecuentes-FAQ.md
    └── Hoja-de-Ruta-HADDOCK-y-Dinamica-Molecular.md
```

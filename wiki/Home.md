# Wiki del Proyecto: Simulación Computacional del Complejo Ternario PROTAC `HSP90α – PROTAC – VHL`

Bienvenido a la Wiki técnica y conceptual del proyecto. Aquí encontrarás guías rápidas, glosario de términos bioinformáticos, respuestas a dudas frecuentes y la hoja de ruta para escalar este modelo a servidores de acoplamiento flexible (**HADDOCK / AlphaFold 3**) y **Dinámica Molecular (GROMACS / OpenMM)**.

---

## Índice de Páginas de la Wiki

1. 📖 **[Glosario Bioinformático y Químico](file:///Users/bue221/Downloads/danna/wiki/Glosario-Bioinformatico.md)**
   * Definiciones sencillas y rigurosas de: *PROTAC*, *Warhead*, *Degrón*, *E3 Ligasa*, *SMILES*, *MMFF94s*, *PDB vs. SDF vs. PDBQT*, *Cargas de Gasteiger*, *Grid Box*, *Interfaz PPI* y *Choques Estéricos*.
2. ❓ **[Preguntas Frecuentes (FAQ)](file:///Users/bue221/Downloads/danna/wiki/Preguntas-Frecuentes-FAQ.md)**
   * ¿Por qué no se puede meter todo en un solo archivo `.pdb` crudo?
   * ¿Por qué AutoDock Vina no tiene botón o icono de aplicación gráfica?
   * ¿Por qué al principio parecía haber un espacio entre las dos proteínas y cómo se resolvió?
   * ¿Por qué recortamos los residuos 224–732 de HSP90 en el visor limpio?
3. 🚀 **[Hoja de Ruta: HADDOCK, AlphaFold 3 y Dinámica Molecular (MD)](file:///Users/bue221/Downloads/danna/wiki/Hoja-de-Ruta-HADDOCK-y-Dinamica-Molecular.md)**
   * Cómo llevar nuestro archivo [`complejo_ternario_limpio.pdb`](file:///Users/bue221/Downloads/danna/complejo_ternario_limpio.pdb) y [`alphafold3_protac_input.json`](file:///Users/bue221/Downloads/danna/alphafold3_protac_input.json) al siguiente nivel experimental y de publicación.

---

## Resumen Ejecutivo del Modelo Actual

* **Diana Terapéutica:** HSP90-α (Dominio N-terminal catalítico, bolsillo `Asp93`).
* **E3 Ligasa Reclutada:** Von Hippel-Lindau (`VHL`, bolsillo `Tyr98` / `His115`).
* **Fármaco Bifuncional:** `NVP-AUY922 (AUY)` — `PEG2 (LNK)` — `VH032 (VHL)`.
* **Afinidad en HSP90:** `-9.489 kcal/mol` ($K_d \approx 110.8\text{ nM}$).
* **Afinidad en VHL:** `-6.561 kcal/mol` ($K_d \approx 15.5\ \mu\text{M}$).
* **Interfaz Proteína–Proteína (PPI):** `121 contactos < 5.0 Å` (`308 contactos < 6.0 Å`), distancia mínima `2.729 Å`, **0 choques estéricos (`< 2.5 Å`)** y puente `PEG2` relajado a `6.40 Å`.

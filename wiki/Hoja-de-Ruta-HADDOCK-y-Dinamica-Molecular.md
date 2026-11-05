# Hoja de Ruta: HADDOCK, AlphaFold 3 y Dinámica Molecular (MD)

Nuestro pipeline actual en AutoDock Vina + optimización torsional PPI produjo un complejo ternario libre de choques (`0 clashes < 2.5 Å`), con `121 contactos PPI < 5.0 Å` y energías de anclaje de `-9.49 kcal/mol` (HSP90) y `-6.56 kcal/mol` (VHL).

Para llevar este modelo de un **resultado computacional preliminar** a un **artículo científico publicable**, estos son los 3 pasos siguientes estándar en bioinformática estructural:

---

## Paso 1: Predicción Co-plegada en AlphaFold 3 Server

En [`main.py`](file:///Users/bue221/Downloads/danna/main.py) ya generamos automáticamente el archivo oficial [`alphafold3_protac_input.json`](file:///Users/bue221/Downloads/danna/alphafold3_protac_input.json), que contiene:
* La secuencia del dominio N-terminal de **HSP90-α** (`Cadena A`, residuos 9–236).
* La secuencia del dominio E3 de **VHL** (`Cadena B`, residuos 54–213).
* El código **SMILES** completo de nuestro PROTAC (`Cadena C`).

---

## Paso 2: Docking Proteína–Proteína Flexible Guiado en HADDOCK 2.4

A diferencia de AutoDock Vina (donde las cadenas laterales del receptor son rígidas), **HADDOCK** (*High Ambiguity Driven protein-protein DOCKing*) permite que las cadenas laterales y el esqueleto superficial de ambas proteínas se reacomoden en agua explícita:

1. Sube [`complejo_ternario_limpio.pdb`](file:///Users/bue221/Downloads/danna/complejo_ternario_limpio.pdb) separado por cadenas al servidor web **HADDOCK 2.4**:
   * **Molécula 1:** `HSP90` (Cadena A) + `PROTAC` (`macromodelo_hsp90_protac.pdb`).
   * **Molécula 2:** `VHL` (Cadena B, `vhl.pdb`).
2. Define como **Residuos Activos (*AIRs*)**:
   * En la Molécula 1: el residuo `VHL 3` del PROTAC y los residuos superficiales del borde del bolsillo de HSP90 (`99, 100, 101, 102, 105, 106, 157, 160`).
   * En la Molécula 2: los residuos del bolsillo de VHL (`35, 38, 42, 43, 44, 45 [Tyr98], 46, 47, 57, 58, 59, 62 [His115]`).
3. HADDOCK ejecutará tres fases (`it0` cuerpo rígido $\to$ `it1` recocido simulado semiflexible $\to$ `itw` refinamiento en capa de agua explícita) y te entregará el *HADDOCK Score* y el área superficial enterrada (*Buried Surface Area*, BSA en $\text{\AA}^2$).

---

## Paso 3: Relajación por Dinámica Molecular (GROMACS / OpenMM)

La prueba definitiva de que el complejo ternario no se separa a temperatura corporal ($310\text{ K}$) consiste en simular su movimiento durante **`50 a 100 nanosegundos (ns)`** en una caja de agua explícita (`TIP3P`) con iones fisiológicos ($\text{NaCl } 0.15\text{ M}$):

1. **Parametrización de campos de fuerza:**
   * Proteínas (`HSP90` y `VHL`): Campo de fuerzas **`AMBER ff19SB`** o **`CHARMM36m`**.
   * Ligando (`PROTAC`): Campo de fuerzas **`GAFF2`** (*General Amber Force Field 2*) con cargas `AM1-BCC` generadas mediante `Antechamber` / `OpenFF`.
2. **Protocolo de simulación:**
   * Minimización de energía (*Steepest Descent*, 5000 pasos) para relajar cualquier contacto cercano.
   * Equilibrado `NVT` ($100\text{ ps}$ a $310\text{ K}$) y `NPT` ($1\text{ ns}$ a $1\text{ atm}$).
   * Producción `MD` ($100\text{ ns}$) sin restricciones.
3. **Qué debes medir al terminar la Dinámica Molecular:**
   * **RMSD (*Root-Mean-Square Deviation*):** Si el RMSD del PROTAC se mantiene estable ($< 2.5\text{ \AA}$) durante los $100\text{ ns}$, el complejo es dinámicamente estable.
   * **Persistencia de Puentes de Hidrógeno:** Que los puentes de hidrógeno con `HSP90 Asp93` y `VHL Tyr98 / His115` se mantengan presentes durante $> 80\text{ \%}$ del tiempo de simulación.
   * **Energía Libre MM/GBSA o MM/PBSA:** Cálculo preciso de la energía libre de unión promedio considerando la solvatación acuosa.

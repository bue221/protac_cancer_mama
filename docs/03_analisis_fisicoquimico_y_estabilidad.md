# 03. Análisis Fisicoquímico, Termodinámico y de Estabilidad del Complejo

Este documento explica cómo leer e interpretar cada número que arrojan AutoDock Vina y nuestro script [`analizar_estabilidad.py`](file:///Users/bue221/Downloads/danna/analizar_estabilidad.py) para responder con rigor científico a la pregunta: **¿Es estable esta conexión PROTAC?**

---

## 1. ¿Qué Significa la Energía Libre de Unión ($\Delta G$) en AutoDock Vina?

En termodinámica química, cuando dos moléculas se unen espontáneamente, liberan energía. Por eso **un valor más negativo de $\Delta G$ (en `kcal/mol`) significa una unión más fuerte y más estable**:

$$\Delta G = RT \ln(K_d) \quad \Longleftrightarrow \quad K_d = e^{\frac{\Delta G}{R \cdot T}}$$

Donde:
* $R = 0.001987\text{ kcal/(mol}\cdot\text{K)}$ es la constante de los gases ideales.
* $T = 298.15\text{ K}$ ($25\ ^\circ\text{C}$) es la temperatura estándar.
* $K_d$ es la **constante de disociación**: la concentración a la cual el 50 % de las proteínas están unidas al fármaco. **Mientras más pequeño es $K_d$ (nanomolar $\text{nM}$ < micromolar $\mu\text{M}$ < milimolar $\text{mM}$), más potente es el acoplamiento.**

### Escala de Referencia en Docking Molecular
| Rango de $\Delta G$ (`kcal/mol`) | Constante $K_d$ equivalente | Interpretación Biofarmacéutica |
| :---: | :---: | :--- |
| $0\text{ a }-4.0$ | $> 1\text{ mM}$ | Unión muy débil o inespecífica (no funcional). |
| $-5.5\text{ a }-7.0$ | $90\ \mu\text{M}\text{ a }7\ \mu\text{M}$ | **Unión micromolar estable** (típica de ligandos reclutadores de E3 como `VH032`). |
| $-8.0\text{ a }-10.0$ | $1.3\ \mu\text{M}\text{ a }45\text{ nM}$ | **Alta afinidad nanomolar** (típica de inhibidores clínicos potentes como `NVP-AUY922`). |
| $< -11.0$ | $< 8\text{ nM}$ | Afinidad sub-nanomolar extremadamente fuerte. |

---

## 2. Desglose de las Energías Obtenidas en Nuestro Proyecto

### A. Primer Docking (`HSP90-α + PROTAC`): `-9.489 kcal/mol` ($K_d \approx 110.8\text{ nM}$)
* El extremo **NVP-AUY922 (`AUY`)** entra profundamente en el bolsillo N-terminal de HSP90-α.
* Su anillo resorcinol forma un puente de hidrógeno corto (`2.98 Å`) con el carboxilato de **`Asp93`**, mientras la amida forma un puente de hidrógeno (`2.56 Å`) con **`Asn106`** y el isoxazol interactúa con **`Gly97`** (`2.76 Å`).

### B. Segundo Docking (`VHL + PROTAC`): `-6.561 kcal/mol` ($K_d \approx 15.5\ \mu\text{M}$)
* El extremo **VH032 (`VHL`)** se aloja en el surco superficial de la ligasa VHL.
* El grupo hidroxiprolina (`O53`/`C54`) se ancla frente a **`Tyr98`** (`TYR 45`) e **`His115`** (`HIS 62`), exactamente como ocurre en el complejo cristalográfico experimental de VHL con VH032 (`PDB: 4W9H`).

### C. Evaluación del Complejo Ternario Completo (`--local_only` en Vina)
Cuando evaluamos el PROTAC haciendo de puente entre ambas proteínas simultáneamente:
* **Energía Intermolecular Receptor–Ligando:** **`-15.885 a -18.647 kcal/mol`**. Es prácticamente la suma de las interacciones favorables de ambos bolsillos ($\approx -9.5 + (-6.6) = -16.1\text{ kcal/mol}$), lo que demuestra que **ninguno de los dos extremos tuvo que salirse de su bolsillo activo para formar el puente**.
* **Penalización Entrópica Torsional (`+9.19 a +10.79 kcal/mol`):** Como un PROTAC tiene 23 enlaces rotables, congelar su movimiento dentro del complejo ternario tiene un costo entrópico natural que Vina descuenta automáticamente para dar la energía libre neta ($\Delta G_{\text{neto}} = -6.69\text{ a }-7.86\text{ kcal/mol}$).

---

## 3. Análisis Geométrico de la Interfaz Proteína–Proteína (PPI)

Para validar que el modelo no sufra ni del problema de **"colisión atómica"** ni del problema de **"dos islas desconectadas"**, evaluamos cuatro métricas geométricas:

1. **Choques Estéricos Severos ($d < 2.5\text{ \AA}$): `0 choques`**
   * Dos átomos pesados no enlazados no pueden acercarse a menos de ~`2.5 Å` porque sus nubes electrónicas se repelen violentamente (*repulsión de Born / Pauli*). Nuestro complejo tiene **cero pares atómicos por debajo de `2.5 Å`**.
2. **Distancia Mínima Inter-Proteína (`HSP90 ↔ VHL`): `2.729 Å`**
   * Indica que las superficies de HSP90-α y VHL se tocan suavemente a distancia óptima de puente de hidrógeno / contacto de van der Waals (`2.7 – 3.5 Å`).
3. **Contactos Cooperativos en la Interfaz PPI (`121 pares < 5.0 Å` y `308 pares < 6.0 Å`):**
   * En lugar de estar separadas por vacío, **10 aminoácidos superficiales de HSP90-α** (`Thr99`, `Lys100`, `Ala101`, `Asp102`, `Gly104`, `Asn105`, `Asp156`, `Asp157`, `Glu158`, `Tyr160`) abrazan a **13 aminoácidos superficiales de VHL** (`Ser32`, `Trp35`, `Asn37`, `Pro41`, `Pro42`, `Gln43`, `Pro44`, `Tyr45`, `Pro46`, `Thr47`, `His54`, `Ala69`, `Val72`).
4. **Extensión del Puente `PEG2` (`N32 ↔ N42`): `6.40 Å`**
   * Un linker `PEG2` estirado al máximo a la fuerza mide `> 9.0 Å`. Al acercar las dos proteínas en su interfaz cooperativa PPI, el puente `PEG2` se relaja a **`6.40 Å`**, adoptando la conformación *gauche* natural de los poliéteres en agua.

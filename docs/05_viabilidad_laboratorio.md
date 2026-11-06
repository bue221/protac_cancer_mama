# 05. Viabilidad de Laboratorio (Comprobación Computacional)

**Fecha:** 2026-11-06T21:01:34Z
**Veredicto:** `viable_con_reservas`

La molécula es candidata razonable a síntesis modular, pero hay alertas o métricas fronterizas que un químico medicinal debe revisar.

## Propiedades fisicoquímicas

| Propiedad | Valor |
|---|---|
| `formula` | C52H65N7O11S |
| `mw` | 996.2 |
| `clogp` | 5.38 |
| `tpsa` | 238.15 |
| `hbd` | 6 |
| `hba` | 15 |
| `rotatable_bonds` | 20 |
| `rings` | 7 |
| `qed` | 0.054 |
| `sa_score` | 4.88 |
| `heavy_atoms` | 71 |

## Cómo se llegó a estos cálculos

Priorizar si AUY922–PEG2–VH032 merece intentarse en un laboratorio de química medicinal, antes de gastar reactivos o tiempo de síntesis.

### Pipeline

1. Se parte del SMILES canónico definido en scripts/01_construir_protac.py.
1. RDKit valida química, estereoquímica, propiedades (MW, cLogP, TPSA, QED) y SA Score.
1. Se confirman por substructure match los tres bloques: AUY922, PEG2 y VH032.
1. Se aplican filtros PAINS/Brenk como alertas de revisión (no vetos ciegos).
1. Sobre el PDB ternario se miden choques (<2.5 Å), contactos PPI (<5 Å) y largo del linker.
1. El veredicto agrega pass/warn/fail: 0 fail y reservas controladas → candidata modular.

### Herramientas

- RDKit (Sanitize, descriptores, QED, FilterCatalog, substructure match)
- SA Score Ertl (rdkit.Contrib.SA_Score)
- NumPy / SciPy (distancias en el complejo PDB)
- Modelo ternario generado por docking Vina + scripts/02_ensamblar_complejo_ternario.py

### Qué no demuestra

- Rendimiento sintético real ni pureza HPLC
- Permeabilidad celular o estabilidad metabólica
- Degradación de HSP90 en células (hace falta Western blot / ensayobiología)
- ΔG experimental: los scores de Vina no se usan aquí como Kd de laboratorio

## Checklist

### ✅ Valencia y aromaticidad (RDKit Sanitize)

La molécula sanitiza sin errores de valencia ni aromaticidad.


**Cómo se calculó:** RDKit aplica Chem.SanitizeMol sobre el SMILES del PROTAC: corrige aromaticidad Kekulé/aromática, comprueba valencias y detecta estructuras imposibles.

**Por qué importa:** Si la molécula no sanitiza, el SMILES está mal o es químicamente inválido: no tiene sentido hablar de síntesis ni de docking.

### ✅ Una sola pieza covalente

Warhead, linker y ligando E3 están unidos en una sola molécula.


**Cómo se calculó:** Se cuenta el número de fragmentos covalentes con Chem.GetMolFrags. Un PROTAC bifuncional debe ser exactamente 1 pieza.

**Por qué importa:** Si hay 2+ fragmentos, warhead y ligando E3 no están unidos: no hay quimera, solo una mezcla de moléculas sueltas.

### ✅ Elementos compatibles con síntesis orgánica típica

Elementos presentes: C, N, O, S.


**Cómo se calculó:** Se listan los símbolos atómicos del grafo molecular y se comparan contra el set típico de química orgánica medicinal (C, H, N, O, S, halógenos, P).

**Por qué importa:** Elementos exóticos implican química poco estándar, toxicidad o reagentes difíciles de manejar en un lab académico/industrial típico.

### ✅ Estereocentros definidos (crítico para VH032)

3 estereocentros asignados. Configuraciones: 42:S, 51:R, 54:S.


**Cómo se calculó:** Chem.FindMolChiralCenters(includeUnassigned=True) localiza centros quirales en el SMILES. Contamos cuántos tienen configuración R/S asignada (crítica en la hidroxiprolina de VH032).

**Por qué importa:** VH032 reconoce VHL de forma estereoespecífica. Un centro sin asignar deja ambigüedad: podrías sintetizar el diastereómero inactivo.

### ✅ Bloque modular detectable: Warhead: NVP-AUY922 (Luminespib)

Subestructura encontrada (1 coincidencia/s). Esto soporta una retrosíntesis por acoplamientos amida entre warhead, PEG2 y VH032.


**Cómo se calculó:** Substructure match RDKit: se busca el SMILES del warhead NVP-AUY922 dentro del PROTAC completo (GetSubstructMatches).

**Por qué importa:** Confirma que el extremo HSP90 es el inhibidor conocido Luminespib, no otra quimera improvisada. Eso habilita comprar/preparar el bloque.

### ✅ Bloque modular detectable: Linker (Cadena PEG2)

Subestructura encontrada (1 coincidencia/s). Esto soporta una retrosíntesis por acoplamientos amida entre warhead, PEG2 y VH032.


**Cómo se calculó:** Match de la subestructura PEG2 (NH–CH2–CH2–O–CH2–CH2–O–CH2–C=O) dentro del SMILES global.

**Por qué importa:** El linker es el mango sintético: PEG2 es commodity y se acopla por amidas. Sin él no hay puente geométrico entre bolsillos.

### ✅ Bloque modular detectable: Ligando E3 (VH032 para VHL)

Subestructura encontrada (1 coincidencia/s). Esto soporta una retrosíntesis por acoplamientos amida entre warhead, PEG2 y VH032.


**Cómo se calculó:** Match de la subestructura VH032 (hidroxiprolina + tert-leucina + metiltiazol-bencilo) en el PROTAC.

**Por qué importa:** Garantiza que el extremo E3 es el ligando documentado para VHL (familia del cristal 4W9H), base de la mayoría de PROTACs VHL.

### ✅ Ruta retrosintética modular plausible

Desconexión estándar: (1) NVP-AUY922 (ácido/amida) + (2) espaciador PEG2 comercial + (3) VH032. Ambos extremos se unen por acoplamientos amida (HATU/EDCI u equivalentes), química rutinaria en laboratorios de química medicinal de PROTACs. NVP-AUY922 y VH032 son ligandos publicados/comercialmente documentados; PEG2 es commodity.


**Cómo se calculó:** Si los tres bloques anteriores están presentes, se declara una desconexión retrosintética clásica de PROTAC: warhead + linker + ligando E3 unidos por dos acoplamientos amida.

**Por qué importa:** La viabilidad de lab de un PROTAC casi nunca es ‘síntesis total de cero’; es química convergente de bloques conocidos. Sin esa lógica modular, el SA Score solo no basta.

### ⚠️ Synthetic Accessibility Score (Ertl / RDKit)

SA = 4.88 (1=fácil, 10=difícil). Dificultad media-alta (esperable en PROTACs). Mitigable por síntesis convergente de 3 bloques.


**Cómo se calculó:** Synthetic Accessibility Score de Ertl (módulo RDKit Contrib SA_Score/sascorer): combina fragmentación en ‘building blocks’ frecuentes y penalizaciones por tamaño, estereoquímica y rareza estructural. Escala 1 (fácil) → 10 (muy difícil).

**Por qué importa:** Estima cuán ‘sintetizable’ parece la molécula a un químico. En PROTACs modulares valores ~3–6.5 suelen ser aceptables porque la dificultad se reparte entre bloques ya conocidos.

### ⚠️ QED en contexto PROTAC (no Rule-of-5 clásica)

QED = 0.054. Los PROTACs suelen violar Lipinski (MW>500, TPSA alta). Un QED bajo NO invalida la viabilidad; indica que no es un oral small-molecule clásico.


**Cómo se calculó:** Quantitative Estimate of Drug-likeness (Bickerton): score 0–1 que combina MW, LogP, HBD/HBA, PSA, rotables, aromáticos, etc., calibrado para small molecules orales clásicos.

**Por qué importa:** Sirve de contexto, no de veto. Los PROTACs suelen tener QED bajo (MW>800, TPSA alta). Interpretarlo con Rule-of-5 castigaría injustamente una quimera bifuncional válida.

### ✅ Peso molecular en ventana típica de PROTAC

MW = 996.2 g/mol. Ventana orientativa 600–1200 g/mol para quimeras bifuncionales.


**Cómo se calculó:** Descriptors.MolWt de RDKit sobre el grafo sin hidrógenos implícitos mal contados; se compara con la ventana heurística 600–1200 g/mol reportada para muchas quimeras PROTAC.

**Por qué importa:** Por debajo, a menudo no hay dos warheads + linker útiles; por encima, permeabilidad y formulación se vuelven muy difíciles.

### ✅ Lipofilia (cLogP) manejable

cLogP = 5.38. Fuera de ~1–7 aumenta riesgo de agregación o permeabilidad pobre.


**Cómo se calculó:** cLogP de Wildman–Crippen (Descriptors.MolLogP). Se acepta ~1–7 como rango manejable para PROTACs celulares.

**Por qué importa:** Muy lipofílico → agregación/promiscuidad; muy hidrofílico → mala permeación. No predice actividad, pero sí riesgo de ‘mala mol’.

### ✅ Enlaces rotables del linker (flexibilidad)

20 enlaces rotables. Necesarios para el puente ternario, pero exceso implica penalización entrópica en docking/MD.


**Cómo se calculó:** rdMolDescriptors.CalcNumRotatableBonds cuenta enlaces simples no terminales rotables en toda la molécula (incluido el PEG2).

**Por qué importa:** Sin flexibilidad el puente no conecta ambos bolsillos; con exceso hay costo entrópico alto (Vina/MD lo penalizan) y más conformaciones improductivas.

### ⚠️ Filtros PAINS / Brenk

Se detectaron 1 alerta(s): Aliphatic_long_chain. En PROTACs basados en NVP-AUY922 esto puede ser esperado (p.ej. motivos fenólicos del warhead). Requiere revisión química, no es un rechazo automático.


**Cómo se calculó:** RDKit FilterCatalog con catálogos PAINS y Brenk: patrones subestructurales asociados a falsos positivos en screening o a motivos reactivos/problemáticos.

**Por qué importa:** Alertan al químico medicinal. En warheads fenólicos como AUY922 pueden aparecer de forma esperada: son WARN para revisión, no un fail automático del diseño PROTAC.

### ✅ Choques estéricos proteína–proteína (< 2.5 Å)

0 choques; distancia mínima HSP90↔VHL = 2.729 Å.


**Cómo se calculó:** Sobre complejo_ternario_limpio.pdb se toman coordenadas pesadas de cadenas A (HSP90) y B (VHL). SciPy cdist calcula todas las distancias; se cuentan pares < 2.5 Å (criterio de choque severo).

**Por qué importa:** Dos proteínas no pueden atravesarse. 0 choques es el mínimo para decir que el ensamblaje ternario es geométricamente admisible.

### ✅ Contactos interfaciales (< 5.0 Å)

121 pares atómicos < 5.0 Å (evidencia geométrica de PPI posible).


**Cómo se calculó:** Misma matriz de distancias A↔B: se cuentan pares atómicos < 5.0 Å como proxy de interfaz proteína–proteína cooperativa.

**Por qué importa:** Un PROTAC eficaz suele inducir o aprovechar contacto PPI. Muchos pares cercanos sugieren abrazo superficial; pocos sugieren dos islas unidas solo por un cable.

### ✅ Extensión efectiva del puente PEG2 (N32↔N42)

7.00 Å. Ventana geométrica orientativa 5–9 Å para PEG2 relajado.


**Cómo se calculó:** En protac_en_complejo.pdb se miden las coordenadas de los átomos N32 y N42 (extremos del PEG2 etiquetados por RDKit) y su distancia euclídea.

**Por qué importa:** Un PEG2 hiper-estirado (>~9 Å) actúa como cuerda tensa; uno colapsado puede no puente. ~5–9 Å indica conformación relajada compatible con el abrazo PPI.

### ⚠️ Límite de evidencia del modelo 3D

0 choques y contactos PPI demuestran que existe una geometría estéricamente admisible. NO demuestran estabilidad en agua, cooperatividad experimental ni degradación celular. Siguiente nivel: HADDOCK/MD + síntesis + Western blot de HSP90.


**Cómo se calculó:** No es un cálculo numérico extra: es una meta-evaluación del alcance del pipeline (docking rígido + optimización de torsiones + refino local).

**Por qué importa:** Evita sobreinterpretar. Geometría sin choques ≠ Kd experimental ≠ degradación celular. Obliga al siguiente paso (MD/síntesis/ensayo).

## Alcance honesto

- Esta comprobación **no** certifica actividad PROTAC en células.
- Esta comprobación **no** sustituye un plan sintético con cantidades, protectores y purificación.
- Soporta la decisión de **seguir / pausar** antes de gastar reactivos.

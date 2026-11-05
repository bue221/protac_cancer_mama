# 02. Arquitectura y Pipeline Computacional: Cómo se Hizo Paso a Paso

Este documento detalla la ingeniería computacional detrás de cada etapa del proyecto: **por qué se tomaron estas decisiones técnicas**, **qué hace cada herramienta por dentro** y **cómo fluyen los datos desde una cadena de texto SMILES hasta el complejo ternario 3D refinado**.

---

## Etapa 1: Construcción 3D del PROTAC desde SMILES (`main.py`)

### ¿Qué problema resuelve `main.py`?
Cuando escribimos la fórmula de un fármaco en texto (**SMILES**), solo tenemos un grafo plano en 2D (quién está unido con quién), pero no tenemos coordenadas $(x, y, z)$ reales en el espacio 3D. Además, si generas un PROTAC grande en el vacío sin cuidado, los dos extremos aromáticos (`AUY` y `VH032`) se atraen entre sí y la molécula se dobla en forma de "U" cerrada (*colapso hidrofóbico intramolecular*), quedando inservible para conectar dos proteínas distintas.

### ¿Cómo lo hace `main.py`?
1. **Validación y protonación (`RDKit`):** Convierte el SMILES en un objeto molecular sanitizado y añade explícitamente los **65 átomos de hidrógeno** (`Chem.AddHs(mol)`), indispensables para calcular repulsiones estéricas reales.
2. **Muestreo conformacional 3D (`ETKDGv3`):** Genera 12 geometrías tridimensionales iniciales usando geometría de distancias con conocimiento experimental de torsiones de anillos pequeños.
3. **Minimización física guiada (`MMFF94s`):** Aplica el campo de fuerzas cuántico-empírico *Merck Molecular Force Field 94s* colocando inicialmente los ángulos diedros del puente PEG2 en zig-zag extendido (`180°`) y relajando enlaces, ángulos y anillos hasta converger en un mínimo de energía libre de tensión (`216.65 kcal/mol`).
4. **Etiquetado modular y exportación dual (`PDB` + `SDF`):**
   * Etiqueta cada átomo según su subestructura: `AUY` (residuo 1), `LNK` (residuo 2) y `VHL` (residuo 3).
   * Exporta **`protac_optimizado.pdb`** (para visores 3D) y **`protac_optimizado.sdf`** (crucial porque el formato `.sdf` guarda explícitamente qué enlaces son simples, dobles o aromáticos).

---

## Etapa 2: Por Qué Separar los Archivos y Convertir a `.pdbqt` con Meeko

### 1. ¿Por qué no se pueden dejar HSP90, VHL y el PROTAC concatenados en un solo archivo?
Si tienes las tres estructuras pegadas en un mismo archivo `.pdb`:
* El software de preparación cree que todo es una única megamolécula rota.
* Las proteínas (**cerraduras**) usan **plantillas de aminoácidos estándar** (`ALA`, `ASP`, `TYR`...) y se tratan como bloques rígidos o con cadenas laterales específicas.
* El PROTAC (**llave**) es una molécula orgánica sintética que requiere **percepción química de anillos, asignación de enlaces rotables (`ROOT`/`BRANCH`) y cálculo de cargas parciales desde su grafo químico**.

Por eso dividimos los datos en tres archivos independientes:
* [`hsp90.pdb`](file:///Users/bue221/Downloads/danna/hsp90.pdb) (`P07900-HS90A_HUMAN.pdb`)
* [`vhl.pdb`](file:///Users/bue221/Downloads/danna/vhl.pdb) (`P40337-VHL_HUMAN.pdb`)
* [`protac.pdb`](file:///Users/bue221/Downloads/danna/protac.pdb) / [`protac_optimizado.sdf`](file:///Users/bue221/Downloads/danna/protac_optimizado.sdf)

### 2. ¿Qué es el formato `.pdbqt` y qué hace Meeko?
AutoDock Vina no lee archivos `.pdb` normales porque un `.pdb` solo tiene coordenadas $(x, y, z)$. Vina necesita un archivo **`.pdbqt`**, que añade tres datos físicos esenciales:
1. **`Q` (Carga parcial de Gasteiger):** Qué tan positivo o negativo es cada átomo (por ejemplo, el oxígeno del resorcinol `O14` tiene carga `-0.508` y su hidrógeno polar `H80` tiene `+0.293`).
2. **`T` (Tipo atómico de AutoDock):** Distingue entre un carbono alifático (`C`), un carbono aromático en anillo (`A`), un nitrógeno aceptor de puente de hidrógeno (`NA`), un oxígeno aceptor (`OA`) y un hidrógeno donador polar (`HD`).
3. **Árbol de Torsión (`ROOT` / `BRANCH` / `ENDBRANCH`):** En `ligando_protac.pdbqt`, Meeko fusiona los hidrógenos no polares (unidos a carbono) para acelerar el cálculo y construye un árbol jerárquico con los **23 enlaces simples rotables** del PROTAC (incluyendo toda la cadena `PEG2`), dejando rígidos los anillos aromáticos y los enlaces amida planos.

Comandos ejecutados con **Meeko 0.8.0**:
```bash
# Receptores proteicos (añade hidrógenos polares HD y cargas por plantilla con Gemmi)
python3 -m meeko.cli.mk_prepare_receptor --read_pdb hsp90.pdb -p receptor_hsp90.pdbqt
python3 -m meeko.cli.mk_prepare_receptor --read_pdb vhl.pdb -p receptor_vhl.pdbqt

# Ligando PROTAC (lee órdenes de enlace exactos desde el SDF)
python3 -m meeko.cli.mk_prepare_ligand -i protac_optimizado.sdf -o ligando_protac.pdbqt
```

---

## Etapa 3: Estrategia de Docking Secuencial en AutoDock Vina

### ¿Cómo sabe AutoDock Vina dónde buscar? (La *Grid Box*)
Si le pides a Vina que busque en toda la proteína HSP90 entera (732 aminoácidos), tardaría horas y probaría sitios irrelevantes. En cambio, definimos una **caja de búsqueda tridimensional (*Grid Box*)** centrada exactamente en los aminoácidos del bolsillo activo:

1. **Caja del Primer Docking (`config_hsp90.txt`):**
   * Calculamos el centro geométrico de los residuos catalíticos del bolsillo N-terminal de HSP90-α (`Asn51`, `Lys58`, `Asp93`, `Gly97`, `Met98`, `Leu107`, `Phe138`, `Val150`, `Thr184`, `Val186`):
     * `center_x = 20.362`, `center_y = 9.405`, `center_z = -32.578`
     * `size_x = 30.0`, `size_y = 30.0`, `size_z = 30.0` (en Ångströms, suficiente para alojar el warhead `AUY` en el fondo del bolsillo y permitir que el puente `PEG2` + `VH032` salgan por el canal hacia el exterior).
   * **Resultado (`resultado_docking1_hsp90.pdbqt`):** El **Modo 1** alcanzó **`-9.489 kcal/mol`**, posicionando el warhead `AUY` a `4.33 Å` del centro del bolsillo (`Asp93`) y dejando el extremo `VH032` proyectado hacia afuera (`14.29 Å`).

2. **Caja del Segundo Docking (`config_vhl.txt`):**
   * Calculamos el centro geométrico del bolsillo de reconocimiento de hidroxiprolina en `vhl.pdb` (`Trp35` [`Trp88`], `Tyr45` [`Tyr98`], `His57` [`His110`], `Ser58` [`Ser111`], `Tyr59` [`Tyr112`], `His62` [`His115`]):
     * `center_x = 4.265`, `center_y = 7.318`, `center_z = -12.503`
     * `size_x = 30.0`, `size_y = 30.0`, `size_z = 30.0`
   * **Resultado (`resultado_docking2_vhl.pdbqt`):** El modo activo con `VH032` dentro del bolsillo alcanzó **`-6.561 kcal/mol`**, orientando la hidroxiprolina frente a `Tyr98` (`TYR 45`) e `His115` (`HIS 62`).

---

## Etapa 4: Ensamblaje del Complejo Ternario y Optimización PPI (`simular_complejo_ternario.py`)

Aquí resolvimos el reto central de los complejos ternarios PROTAC:
1. **Alineamiento Rígido Inicial (Superposición SVD de Kabsch):** Tomamos la proteína **VHL** junto con su extremo `VH032` acoplado en el Segundo Docking y la superpusimos matemáticamente sobre el extremo saliente del macromodelo **HSP90 + PROTAC (Modo 1)**.
2. **Optimización de Torsiones del Linker PEG2 con Potencial PPI (Estilo HADDOCK):**
   * Manteniendo fijo el warhead `AUY` dentro del bolsillo de HSP90 y fijo el ligando `VH032` dentro del bolsillo de VHL, rotamos únicamente los ángulos diedros de los enlaces simples del puente `PEG2` usando el optimizador `Powell` de `SciPy`.
   * La función objetivo aplica:
     * **Barrera repulsiva estricta ($< 2.75\text{ \AA}$)** sobre todos los átomos para garantizar **0 choques estéricos ($< 2.5\text{ \AA}$)**.
     * **Recompensa atractiva Proteína–Proteína ($2.75\text{ \AA} \le d \le 5.2\text{ \AA}$)** que empuja a VHL y HSP90 a formar un abrazo interfacial amplio (**121 pares atómicos $< 5.0\text{ \AA}$** y **308 pares $< 6.0\text{ \AA}$**).
     * **Relajación del puente PEG2** a una distancia compacta de **`6.40 Å`** (conformación *gauche* natural, eliminando el aspecto de "cuerda tensa").
3. **Refinamiento Local Simultáneo en AutoDock Vina (`--local_only`):**
   * Unimos `HSP90` (Cadena A) y `VHL` (Cadena B) en un receptor ternario combinado (`receptor_ternario_hsp90_vhl.pdbqt`) y ejecutamos `./vina --local_only --autobox` para relajar localmente todos los grados de libertad del PROTAC en presencia de ambas proteínas a la vez.
4. **Reconstrucción Química Exacta con `RDKit` (`CONECT`):**
   * Finalmente, mapeamos las coordenadas refinadas de los 77 átomos del `.pdbqt` de vuelta a los **136 átomos originales** de `protac_optimizado.sdf`, relajamos los hidrógenos alifáticos con `MMFF94s` y exportamos [`complejo_ternario_limpio.pdb`](file:///Users/bue221/Downloads/danna/complejo_ternario_limpio.pdb) y [`complejo_ternario_final.pdb`](file:///Users/bue221/Downloads/danna/complejo_ternario_final.pdb) con todos sus registros `CONECT` intactos.

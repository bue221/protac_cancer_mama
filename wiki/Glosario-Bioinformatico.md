# Glosario Bioinformático y Químico

Si algunos términos del proyecto te resultan nuevos, aquí tienes una guía clara con analogías sencillas.

---

### 1. Conceptos Biológicos
* **PROTAC (*Proteolysis-Targeting Chimera*):** Molécula con dos cabezas unidas por un cable (*linker*). Una cabeza sujeta a la proteína dañina (HSP90-α) y la otra sujeta a una enzima destructora (VHL) para que la célula elimine a la proteína dañina.
* **Warhead ("Ojiva"):** La mitad del PROTAC que se une a la proteína enferma que queremos destruir. En nuestro caso es **NVP-AUY922 (Luminespib)**.
* **Ligando E3 / Degrón:** La otra mitad del PROTAC que recluta a la ubiquitina ligasa E3. En nuestro caso es **VH032**, que imita al péptido natural que reconoce VHL.
* **Linker ("Cable conector"):** La cadena central que une el *warhead* con el *ligando E3*. Usamos **PEG2** (dos unidades de polietilenglicol).
* **Interfaz Proteína–Proteína (PPI):** La zona de contacto físico donde la superficie exterior de HSP90-α se apoya contra la superficie exterior de VHL cuando el PROTAC las acerca.
* **Cooperatividad ($\alpha$):** Si al acercarse las dos proteínas sus aminoácidos superficiales se atraen (puentes de hidrógeno, contactos hidrofóbicos), ayudan al PROTAC a mantener el complejo unido ($\alpha > 1$, cooperatividad positiva). Si chocan, se repelen ($\alpha < 1$, cooperatividad negativa).

---

### 2. Formatos de Archivo (`.pdb`, `.sdf`, `.pdbqt`)
* **SMILES (*Simplified Molecular-Input Line-Entry System*):** Forma de escribir la estructura de una molécula en una sola línea de texto (por ejemplo, `O=Cc1noc...`). Dice qué átomos están conectados, pero no tiene coordenadas 3D.
* **`.pdb` (*Protein Data Bank*):** Formato estándar para guardar las coordenadas 3D $(x, y, z)$ de proteínas y fármacos. **Limitación:** No guarda explícitamente si un enlace es simple o doble; depende de las líneas `CONECT` al final del archivo para dibujar los enlaces de moléculas pequeñas.
* **`.sdf` (*Structure-Data File*):** Formato químico ideal para fármacos porque guarda tanto las coordenadas 3D $(x, y, z)$ como una tabla exacta de enlaces simples (`1`), dobles (`2`) y aromáticos (`4`). Por eso **Meeko** necesita leer el `.sdf` para preparar el ligando sin errores.
* **`.pdbqt`:** Formato exclusivo de **AutoDock / AutoDock Vina**. Toma un `.pdb` y le agrega dos columnas al final de cada línea: la **carga eléctrica parcial (`Q`)** y el **tipo de átomo (`T`)**, además de etiquetas `ROOT` y `BRANCH` que indican qué enlaces pueden girar durante la simulación.

---

### 3. Conceptos Físicos y de Simulación
* **Cargas Parciales de Gasteiger:** Cálculo matemático rápido que determina qué fracción de carga eléctrica ($\delta^+$ o $\delta^-$) tiene cada átomo según la electronegatividad de sus vecinos.
* **Hidrógenos Polares (`HD`):** Hidrógenos unidos a oxígeno o nitrógeno (`-OH`, `-NH`). Son los únicos capaces de formar **puentes de hidrógeno**; por eso AutoDock Vina los mantiene explícitos y oculta los hidrógenos unidos a carbono.
* **Grid Box (Caja de Búsqueda):** Cubo imaginario en 3D (definido por su centro `center_x, y, z` y tamaño `size_x, y, z` en Ångströms) que le indica a AutoDock Vina exactamente en qué cavidad de la proteína debe probar a encajar el fármaco.
* **Choque Estérico (*Steric Clash*):** Error físico que ocurre cuando dos átomos no enlazados quedan a menos de `2.5 Å` de distancia, superponiendo sus nubes electrónicas. Un modelo válido debe tener **0 choques estéricos**.
* **MMFF94s (*Merck Molecular Force Field*):** Modelo matemático de física molecular (en `RDKit`) que trata los enlaces como resortes para encontrar la forma 3D más relajada de una molécula orgánica.

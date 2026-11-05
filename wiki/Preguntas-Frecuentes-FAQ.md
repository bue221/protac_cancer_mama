# Preguntas Frecuentes (FAQ)

Respuestas directas a las dudas más comunes durante el desarrollo y análisis del proyecto.

---

### 1. ¿Por qué no podíamos dejar HSP90, VHL y el PROTAC juntos en un solo bloque de texto `.pdb`?
Porque las proteínas (**receptores**) y el fármaco (**ligando**) siguen reglas matemáticas distintas:
* Las proteínas se parametrizan usando diccionarios de los 20 aminoácidos naturales y permanecen rígidas durante el docking en Vina.
* El PROTAC es una molécula sintética con anillos aromáticos y una cadena flexible (`PEG2`) que necesita que **Meeko** detecte sus enlaces rotables (`ROOT`/`BRANCH`) y calcule sus cargas de Gasteiger desde su estructura `.sdf`.
Si están pegados en un solo archivo, el programa falla al no distinguir quién es la cerradura y quién es la llave.

---

### 2. ¿Cómo se "abre" AutoDock Vina? ¿Por qué no aparece una ventana cuando lo ejecuto?
**AutoDock Vina no es un programa visual con botones**, sino un motor de cálculo matemático que corre en la Terminal (línea de comandos).
* **Lo que hace Vina:** Recibe `receptor.pdbqt`, `ligando.pdbqt` y las coordenadas de la caja (`config.txt`), prueba millones de rotaciones/traslaciones y escribe un archivo de salida (`resultado.pdbqt`) con las mejores poses y sus energías en `kcal/mol`.
* **Dónde se ve el resultado en 3D:** En un visor molecular gráfico como nuestro [`visor_3d_complejo_ternario.html`](file:///Users/bue221/Downloads/danna/visor_3d_complejo_ternario.html), **PyMOL** o **UCSF ChimeraX**.

---

### 3. ¿Por qué al principio las dos proteínas se veían como "dos islas separadas por una cuerda" y cómo se solucionó?
Ocurrieron dos cosas que ya quedaron corregidas en la versión final:
1. **En la optimización inicial:** Solo le habíamos pedido al algoritmo que evitara choques ($d > 2.5\text{ \AA}$) sin premiar el contacto superficial amplio entre HSP90 y VHL. Al agregar un **potencial atractivo Proteína–Proteína (estilo HADDOCK)** sobre los enlaces rotables del linker `PEG2`, las dos proteínas giraron sobre la bisagra del `PEG2` hasta abrazarse (**121 contactos $< 5.0\text{ \AA}$ y 308 contactos $< 6.0\text{ \AA}$**), reduciendo la extensión del linker de `8.98 Å` a **`6.40 Å`** (conformación *gauche* relajada).
2. **En la visualización:** Ver solo cintas (*ribbons/cartoon*) oculta el volumen real de las cadenas laterales de los aminoácidos. Al activar la **superficie molecular volumétrica (`Modo Superficie`)** en [`visor_3d_complejo_ternario.html`](file:///Users/bue221/Downloads/danna/visor_3d_complejo_ternario.html), se aprecia claramente cómo la superficie azul de HSP90 y la superficie magenta de VHL sellan por completo el canal alrededor del PROTAC.

---

### 4. ¿Cuál es la diferencia entre `complejo_ternario_limpio.pdb` y `complejo_ternario_final.pdb`?
* **[`complejo_ternario_limpio.pdb`](file:///Users/bue221/Downloads/danna/complejo_ternario_limpio.pdb) (Recomendado para visualización y HADDOCK):** Contiene únicamente los **dominios catalíticos plegados** que participan en el complejo ternario (**HSP90 NTD residuos 14–223** y **VHL residuos 10–158**) más el PROTAC completo con sus registros `CONECT`. Elimina las colas desordenadas de baja confianza de AlphaFold (como el bucle cargado 224–275 de HSP90) que tapaban la cámara.
* **[`complejo_ternario_final.pdb`](file:///Users/bue221/Downloads/danna/complejo_ternario_final.pdb):** Conserva exactamente la misma geometría acoplada pero incluye los 732 aminoácidos completos de `hsp90.pdb` y los 160 aminoácidos de `vhl.pdb`.

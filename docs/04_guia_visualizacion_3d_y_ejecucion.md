# 04. Guía de Visualización 3D y Ejecución Local

Esta guía explica cómo inspeccionar en 3D los modelos generados usando el **visor web interactivo incluido** o software científico de escritorio (**PyMOL** y **UCSF ChimeraX**).

---

## 1. Visor 3D Web Interactivo (`visor_3d_complejo_ternario.html`)

No necesitas instalar ningún programa pesado para explorar el complejo ternario. Ejecuta en tu terminal de macOS:

```bash
open /Users/bue221/Downloads/danna/visor_3d_complejo_ternario.html
```

### Controles del Ratón / Trackpad
* **Rotar en 3D:** Clic izquierdo + arrastrar (o arrastrar con un dedo).
* **Hacer Zoom:** Rueda del ratón o pellizcar con dos dedos en el trackpad.
* **Trasladar (Pan):** Clic derecho + arrastrar (o `Ctrl` + clic + arrastrar).

### Botones de la Interfaz Superior Izquierda
1. **`Vista General PPI`:** Centra la cámara en la zona de contacto entre **HSP90-α (azul)** y **VHL (rosa/magenta)**.
2. **`Bolsillo HSP90 (AUY)`:** Acerca la cámara al warhead **NVP-AUY922 (verde)** dentro del bolsillo de `Asp93` y `Asn106`.
3. **`Interfaz + PEG2`:** Enfoca el puente **PEG2 (amarillo)** rodeado por las superficies de ambas proteínas.
4. **`Bolsillo VHL (VH032)`:** Acerca la cámara al ligando **VH032 (naranja)** frente a `Tyr98` (`TYR 45`) e `His115` (`HIS 62`).
5. **`Modo Superficie (PPI / Total / Off)`:** Alterna entre:
   * **Modo 1 (Por defecto):** Superficie molecular volumétrica sobre los bolsillos y la interfaz de contacto Proteína–Proteína (permite ver cómo encajan ambas proteínas sin tapar las hélices internas).
   * **Modo 2 (Superficie Total):** Superficie volumétrica completa de ambos dominios proteicos para comprobar que no existe brecha vacía entre HSP90 y VHL.
   * **Modo 3 (Off):** Oculta las superficies para inspeccionar con claridad los puentes de hidrógeno (cilindros punteados amarillos).

---

## 2. Cómo Abrir y Estilizar el Complejo en PyMOL

Si tienes **PyMOL** instalado en tu Mac, abre el archivo [`complejo_ternario_limpio.pdb`](file:///Users/bue221/Downloads/danna/complejo_ternario_limpio.pdb) y pega estos comandos en la línea de comandos de PyMOL para obtener una figura con calidad de revista científica:

```python
# 1. Cargar el complejo ternario limpio (con enlaces CONECT RDKit)
load /Users/bue221/Downloads/danna/complejo_ternario_limpio.pdb, ternario

# 2. Fondo oscuro o blanco limpio y calidad de renderizado
bg_color white
set valence, 1
set stick_radius, 0.20

# 3. Colorear las dos proteínas por cadena
hide everything, all
show cartoon, chain A or chain B
color marine, chain A          # HSP90-alpha NTD
color warmpink, chain B        # E3 Ligasa VHL

# 4. Mostrar y colorear el PROTAC por sus 3 módulos funcionales
show sticks, chain C
color tv_green, chain C and resn AUY
color tv_yellow, chain C and resn LNK
color tv_orange, chain C and resn VHL
hide sticks, chain C and elem H

# 5. Mostrar superficies semitransparentes en la interfaz PPI
create surf_hsp90, chain A and resi 51+55+58+93+97+98+99+100+101+102+104+105+106+107+137+138+150+156+157+158+160+184
create surf_vhl, chain B and resi 14+16+32+35+37+38+41+42+43+44+45+46+47+54+57+58+59+62+69+72
show surface, surf_hsp90 or surf_vhl
set transparency, 0.55, surf_hsp90 or surf_vhl

# 6. Dibujar puentes de hidrógeno automáticamente entre el PROTAC y ambos bolsillos
distance hbonds_ternario, (chain C), (chain A or chain B), 3.5, mode=2
color yellow, hbonds_ternario
zoom chain C, 12
```

---

## 3. Cómo Abrirlo en UCSF ChimeraX

En la barra de comandos de **UCSF ChimeraX**, ejecuta:

```text
open /Users/bue221/Downloads/danna/complejo_ternario_limpio.pdb
color /A dodger blue
color /B hot pink
style /C stick
color /C:AUY limegreen
color /C:LNK gold
color /C:VHL darkorange
hbonds /C restrict both reveal true
surface /A /B transparency 60
view /C
```

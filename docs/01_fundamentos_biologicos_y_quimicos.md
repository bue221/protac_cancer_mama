# 01. Fundamentos Biológicos y Químicos del Proyecto

Este documento explica **desde cero y en lenguaje claro** qué estamos haciendo biológicamente, por qué elegimos cada pieza molecular y cómo funciona el mecanismo de degradación dirigida de proteínas.

---

## 1. Los Tres Actores Biológicos

### A. La Proteína Diana: HSP90-α (*Heat Shock Protein 90 Alpha*, `P07900`)
* **¿Qué es?** Es una proteína "chaperona" que ayuda a plegar y estabilizar cientos de otras proteínas dentro de la célula.
* **¿Por qué queremos destruirla?** En muchos tipos de cáncer, las células tumorales dependen de HSP90-α para mantener activas oncoproteínas mutadas (como HER2, AKT, B-RAF, CDK4). Si eliminamos HSP90-α, las proteínas del cáncer se despliegan y la célula tumoral muere.
* **Su punto débil (El Bolsillo N-terminal):** Para funcionar, HSP90-α necesita unir y romper moléculas de **ATP** en una cavidad profunda llamada **dominio N-terminal (NTD, aminoácidos 9 a 236)**. En el fondo de ese bolsillo está el aminoácido **`Asp93` (Ácido Aspártico 93)**, que actúa como el "enchufe" donde se conecta el ATP.

### B. El Camión de Reciclaje Celular: La E3 Ligasa VHL (`P40337`)
* **¿Cómo destruye la célula sus propias proteínas viejas?** Usa el **Sistema Ubiquitina–Proteasoma (UPS)**:
  1. Las enzimas llamadas **Ubiquitina Ligasas E3** (como **VHL**) reconocen proteínas que deben eliminarse y les pegan una etiqueta química llamada **Ubiquitina**.
  2. Cuando una proteína acumula una cadena de ubiquitinas, el **Proteasoma 26S** (la trituradora celular) la reconoce y la corta en pedazos.
* **¿Qué reconoce VHL normalmente?** En condiciones normales de oxígeno, VHL reconoce una prolina hidroxilada (**Hidroxiprolina, Hyp**) de la proteína HIF-1α gracias a dos aminoácidos clave en la superficie de VHL: **`Tyr98` (Tirosina 98)** e **`His115` (Histidina 115)**.

### C. El Puente Secuestrador: Nuestro PROTAC (`AUY922 – PEG2 – VH032`)
Normalmente, **VHL ignora por completo a HSP90-α** porque no tienen afinidad natural entre sí. Aquí entra el **PROTAC** (*Proteolysis-Targeting Chimera*): una molécula bifuncional diseñada para obligar a VHL y HSP90-α a juntarse.

---

## 2. Anatomía Química de Nuestro PROTAC

En [`main.py`](file:///Users/bue221/Downloads/danna/main.py) ensamblamos químicamente tres bloques en una sola molécula continua:

```text
[Warhead: NVP-AUY922 (AUY)] ─── [Linker: Cadena PEG2 (LNK)] ─── [Ligando E3: VH032 (VHL)]
     (Atrapa a HSP90-α)              (Puente flexible)                (Atrapa a VHL)
```

### Bloque 1: Warhead `NVP-AUY922` (Etiqueta `AUY`, Residuo `1`)
* **Estructura:** Contiene un anillo **resorcinol** (benceno con dos grupos `-OH` en `O14` y `O17` y un grupo isopropilo), un anillo **isoxazol** (`N4–O5`) y una cola **fenil-morfolina** (`N24..O27`).
* **¿Por qué funciona?** Los grupos `-OH` del resorcinol imitan exactamente los puentes de hidrógeno que forma la adenina del ATP con el aminoácido **`Asp93`** en el fondo del bolsillo de HSP90-α, pero con una afinidad miles de veces mayor ($K_d$ en el rango nanomolar). Mientras el resorcinol se clava en el fondo del bolsillo, el grupo amida (`C2=O1`) apunta hacia la salida del bolsillo, dándonos el punto perfecto para atar el cable conector (linker) sin estorbar la unión.

### Bloque 2: Linker `PEG2` (Etiqueta `LNK`, Residuo `2`)
* **Estructura:** Dos unidades de etilenglicol (`-NH-CH2-CH2-O-CH2-CH2-O-CH2-C(=O)-`).
* **¿Por qué PEG2?**
  * Es **soluble en agua** gracias a sus átomos de oxígeno tipo éter (`O35` y `O38`), evitando que el PROTAC sea demasiado grasoso (hidrofóbico).
  * Tiene **8 enlaces simples rotables**, lo que funciona como una bisagra articulada en 3D.
  * Al ser un linker corto-medio, cuando adopta su conformación natural curvada (*gauche*, ~`6.4 Å`), **obliga a que la superficie de HSP90-α y la superficie de VHL entren en contacto físico directo** (formando una interfaz cooperativa Proteína–Proteína, PPI).

### Bloque 3: Ligando E3 `VH032` (Etiqueta `VHL`, Residuo `3`)
* **Estructura:** Posee en su centro un anillo de **trans-4-hidroxiprolina** (`O53`), flanqueado por un grupo **tert-leucina** (`C44–C47`) y un grupo aromático **metiltiazol-bencilo** (`C60..S65`).
* **¿Por qué funciona?** El grupo `-OH` (`O53`) de la hidroxiprolina encaja como una llave maestra en el bolsillo de **VHL**, formando puentes de hidrógeno con **`Tyr98`** (`TYR 45` en la numeración de `vhl.pdb`) e **`His115`** (`HIS 62`), mientras el anillo aromático se apila contra **`Phe91`** (`PHE 38`) y **`Trp88`** (`TRP 35`).

---

## 3. ¿Por qué el Complejo Ternario Necesita un "Abrazo" Proteína–Proteína (PPI)?

Un error común al imaginar un PROTAC es pensar en dos globos flotando lejos, unidos por un hilo largo. En la realidad física dentro de la célula:
1. **Si las dos proteínas quedan lejos ("dos islas conectadas por una cuerda"):** El complejo se mueve caóticamente, el agua empuja a las proteínas en direcciones opuestas y la transferencia de ubiquitina falla.
2. **Cuando las dos proteínas se tocan suavemente (Cooperatividad Positiva, $\alpha > 1$):** Los aminoácidos superficiales alrededor de la boca del bolsillo de HSP90 (`Thr99`, `Lys100`, `Ala101`, `Asn105`, `Asp157`) encajan contra los aminoácidos superficiales alrededor del bolsillo de VHL (`Pro42`, `Gln43`, `Pro44`, `Tyr98`, `Pro46`, `Thr47`). Ese "abrazo" sin choques estéricos oculta al linker del agua y multiplica la estabilidad del complejo ternario.

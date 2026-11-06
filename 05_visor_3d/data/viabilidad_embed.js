window.VIABILIDAD_DATA = {
  "generated_at": "2026-11-06T21:01:34Z",
  "molecule": {
    "name": "AUY922–PEG2–VH032",
    "smiles": "O=C(c1noc(-c2cc(C(C)C)c(O)cc2O)c1-c3ccc(CN4CCOCC4)cc3)NCCOCCOCC(=O)N[C@@H](C(C)(C)C)C(=O)N5C[C@H](O)C[C@H]5C(=O)NCc6ccc(-c7scnc7C)cc6",
    "target": "HSP90-alpha (P07900)",
    "e3_ligase": "VHL (P40337)"
  },
  "propiedades": {
    "formula": "C52H65N7O11S",
    "mw": 996.2,
    "clogp": 5.38,
    "tpsa": 238.15,
    "hbd": 6,
    "hba": 15,
    "rotatable_bonds": 20,
    "rings": 7,
    "qed": 0.054,
    "sa_score": 4.88,
    "heavy_atoms": 71
  },
  "metodologia": {
    "objetivo": "Priorizar si AUY922–PEG2–VH032 merece intentarse en un laboratorio de química medicinal, antes de gastar reactivos o tiempo de síntesis.",
    "pipeline": [
      "Se parte del SMILES canónico definido en scripts/01_construir_protac.py.",
      "RDKit valida química, estereoquímica, propiedades (MW, cLogP, TPSA, QED) y SA Score.",
      "Se confirman por substructure match los tres bloques: AUY922, PEG2 y VH032.",
      "Se aplican filtros PAINS/Brenk como alertas de revisión (no vetos ciegos).",
      "Sobre el PDB ternario se miden choques (<2.5 Å), contactos PPI (<5 Å) y largo del linker.",
      "El veredicto agrega pass/warn/fail: 0 fail y reservas controladas → candidata modular."
    ],
    "herramientas": [
      "RDKit (Sanitize, descriptores, QED, FilterCatalog, substructure match)",
      "SA Score Ertl (rdkit.Contrib.SA_Score)",
      "NumPy / SciPy (distancias en el complejo PDB)",
      "Modelo ternario generado por docking Vina + scripts/02_ensamblar_complejo_ternario.py"
    ],
    "no_demuestra": [
      "Rendimiento sintético real ni pureza HPLC",
      "Permeabilidad celular o estabilidad metabólica",
      "Degradación de HSP90 en células (hace falta Western blot / ensayobiología)",
      "ΔG experimental: los scores de Vina no se usan aquí como Kd de laboratorio"
    ]
  },
  "checks": [
    {
      "id": "sanitize",
      "titulo": "Valencia y aromaticidad (RDKit Sanitize)",
      "status": "pass",
      "detalle": "La molécula sanitiza sin errores de valencia ni aromaticidad.",
      "como": "RDKit aplica Chem.SanitizeMol sobre el SMILES del PROTAC: corrige aromaticidad Kekulé/aromática, comprueba valencias y detecta estructuras imposibles.",
      "porque": "Si la molécula no sanitiza, el SMILES está mal o es químicamente inválido: no tiene sentido hablar de síntesis ni de docking."
    },
    {
      "id": "conectividad",
      "titulo": "Una sola pieza covalente",
      "status": "pass",
      "detalle": "Warhead, linker y ligando E3 están unidos en una sola molécula.",
      "como": "Se cuenta el número de fragmentos covalentes con Chem.GetMolFrags. Un PROTAC bifuncional debe ser exactamente 1 pieza.",
      "porque": "Si hay 2+ fragmentos, warhead y ligando E3 no están unidos: no hay quimera, solo una mezcla de moléculas sueltas."
    },
    {
      "id": "elementos",
      "titulo": "Elementos compatibles con síntesis orgánica típica",
      "status": "pass",
      "detalle": "Elementos presentes: C, N, O, S.",
      "como": "Se listan los símbolos atómicos del grafo molecular y se comparan contra el set típico de química orgánica medicinal (C, H, N, O, S, halógenos, P).",
      "porque": "Elementos exóticos implican química poco estándar, toxicidad o reagentes difíciles de manejar en un lab académico/industrial típico."
    },
    {
      "id": "estereocentros",
      "titulo": "Estereocentros definidos (crítico para VH032)",
      "status": "pass",
      "detalle": "3 estereocentros asignados. Configuraciones: 42:S, 51:R, 54:S.",
      "valor": {
        "asignados": 3,
        "sin_asignar": 0
      },
      "como": "Chem.FindMolChiralCenters(includeUnassigned=True) localiza centros quirales en el SMILES. Contamos cuántos tienen configuración R/S asignada (crítica en la hidroxiprolina de VH032).",
      "porque": "VH032 reconoce VHL de forma estereoespecífica. Un centro sin asignar deja ambigüedad: podrías sintetizar el diastereómero inactivo."
    },
    {
      "id": "bloque_warhead",
      "titulo": "Bloque modular detectable: Warhead: NVP-AUY922 (Luminespib)",
      "status": "pass",
      "detalle": "Subestructura encontrada (1 coincidencia/s). Esto soporta una retrosíntesis por acoplamientos amida entre warhead, PEG2 y VH032.",
      "como": "Substructure match RDKit: se busca el SMILES del warhead NVP-AUY922 dentro del PROTAC completo (GetSubstructMatches).",
      "porque": "Confirma que el extremo HSP90 es el inhibidor conocido Luminespib, no otra quimera improvisada. Eso habilita comprar/preparar el bloque."
    },
    {
      "id": "bloque_linker",
      "titulo": "Bloque modular detectable: Linker (Cadena PEG2)",
      "status": "pass",
      "detalle": "Subestructura encontrada (1 coincidencia/s). Esto soporta una retrosíntesis por acoplamientos amida entre warhead, PEG2 y VH032.",
      "como": "Match de la subestructura PEG2 (NH–CH2–CH2–O–CH2–CH2–O–CH2–C=O) dentro del SMILES global.",
      "porque": "El linker es el mango sintético: PEG2 es commodity y se acopla por amidas. Sin él no hay puente geométrico entre bolsillos."
    },
    {
      "id": "bloque_e3_ligand",
      "titulo": "Bloque modular detectable: Ligando E3 (VH032 para VHL)",
      "status": "pass",
      "detalle": "Subestructura encontrada (1 coincidencia/s). Esto soporta una retrosíntesis por acoplamientos amida entre warhead, PEG2 y VH032.",
      "como": "Match de la subestructura VH032 (hidroxiprolina + tert-leucina + metiltiazol-bencilo) en el PROTAC.",
      "porque": "Garantiza que el extremo E3 es el ligando documentado para VHL (familia del cristal 4W9H), base de la mayoría de PROTACs VHL."
    },
    {
      "id": "ruta_modular",
      "titulo": "Ruta retrosintética modular plausible",
      "status": "pass",
      "detalle": "Desconexión estándar: (1) NVP-AUY922 (ácido/amida) + (2) espaciador PEG2 comercial + (3) VH032. Ambos extremos se unen por acoplamientos amida (HATU/EDCI u equivalentes), química rutinaria en laboratorios de química medicinal de PROTACs. NVP-AUY922 y VH032 son ligandos publicados/comercialmente documentados; PEG2 es commodity.",
      "ruta_sugerida": [
        "Preparar o adquirir NVP-AUY922 (Luminespib) con mango de acoplamiento",
        "Acopiar amida al linker NH2–PEG2–COOH (o equivalente protegido)",
        "Acopiar el extremo carboxilo del linker al NH2 de VH032",
        "Desproteger hidroxiprolina si aplica y purificar por HPLC"
      ],
      "como": "Si los tres bloques anteriores están presentes, se declara una desconexión retrosintética clásica de PROTAC: warhead + linker + ligando E3 unidos por dos acoplamientos amida.",
      "porque": "La viabilidad de lab de un PROTAC casi nunca es ‘síntesis total de cero’; es química convergente de bloques conocidos. Sin esa lógica modular, el SA Score solo no basta."
    },
    {
      "id": "sa_score",
      "titulo": "Synthetic Accessibility Score (Ertl / RDKit)",
      "status": "warn",
      "detalle": "SA = 4.88 (1=fácil, 10=difícil). Dificultad media-alta (esperable en PROTACs). Mitigable por síntesis convergente de 3 bloques.",
      "valor": 4.88,
      "rango_aceptable_protac": "≤ 6.5 con ruta modular",
      "como": "Synthetic Accessibility Score de Ertl (módulo RDKit Contrib SA_Score/sascorer): combina fragmentación en ‘building blocks’ frecuentes y penalizaciones por tamaño, estereoquímica y rareza estructural. Escala 1 (fácil) → 10 (muy difícil).",
      "porque": "Estima cuán ‘sintetizable’ parece la molécula a un químico. En PROTACs modulares valores ~3–6.5 suelen ser aceptables porque la dificultad se reparte entre bloques ya conocidos."
    },
    {
      "id": "qed_contexto_protac",
      "titulo": "QED en contexto PROTAC (no Rule-of-5 clásica)",
      "status": "warn",
      "detalle": "QED = 0.054. Los PROTACs suelen violar Lipinski (MW>500, TPSA alta). Un QED bajo NO invalida la viabilidad; indica que no es un oral small-molecule clásico.",
      "valor": 0.054,
      "como": "Quantitative Estimate of Drug-likeness (Bickerton): score 0–1 que combina MW, LogP, HBD/HBA, PSA, rotables, aromáticos, etc., calibrado para small molecules orales clásicos.",
      "porque": "Sirve de contexto, no de veto. Los PROTACs suelen tener QED bajo (MW>800, TPSA alta). Interpretarlo con Rule-of-5 castigaría injustamente una quimera bifuncional válida."
    },
    {
      "id": "mw_ventana_protac",
      "titulo": "Peso molecular en ventana típica de PROTAC",
      "status": "pass",
      "detalle": "MW = 996.2 g/mol. Ventana orientativa 600–1200 g/mol para quimeras bifuncionales.",
      "valor": 996.2,
      "como": "Descriptors.MolWt de RDKit sobre el grafo sin hidrógenos implícitos mal contados; se compara con la ventana heurística 600–1200 g/mol reportada para muchas quimeras PROTAC.",
      "porque": "Por debajo, a menudo no hay dos warheads + linker útiles; por encima, permeabilidad y formulación se vuelven muy difíciles."
    },
    {
      "id": "logp_ventana",
      "titulo": "Lipofilia (cLogP) manejable",
      "status": "pass",
      "detalle": "cLogP = 5.38. Fuera de ~1–7 aumenta riesgo de agregación o permeabilidad pobre.",
      "valor": 5.38,
      "como": "cLogP de Wildman–Crippen (Descriptors.MolLogP). Se acepta ~1–7 como rango manejable para PROTACs celulares.",
      "porque": "Muy lipofílico → agregación/promiscuidad; muy hidrofílico → mala permeación. No predice actividad, pero sí riesgo de ‘mala mol’."
    },
    {
      "id": "flexibilidad",
      "titulo": "Enlaces rotables del linker (flexibilidad)",
      "status": "pass",
      "detalle": "20 enlaces rotables. Necesarios para el puente ternario, pero exceso implica penalización entrópica en docking/MD.",
      "valor": 20,
      "como": "rdMolDescriptors.CalcNumRotatableBonds cuenta enlaces simples no terminales rotables en toda la molécula (incluido el PEG2).",
      "porque": "Sin flexibilidad el puente no conecta ambos bolsillos; con exceso hay costo entrópico alto (Vina/MD lo penalizan) y más conformaciones improductivas."
    },
    {
      "id": "alertas",
      "titulo": "Filtros PAINS / Brenk",
      "status": "warn",
      "detalle": "Se detectaron 1 alerta(s): Aliphatic_long_chain. En PROTACs basados en NVP-AUY922 esto puede ser esperado (p.ej. motivos fenólicos del warhead). Requiere revisión química, no es un rechazo automático.",
      "alertas": [
        "Aliphatic_long_chain"
      ],
      "como": "RDKit FilterCatalog con catálogos PAINS y Brenk: patrones subestructurales asociados a falsos positivos en screening o a motivos reactivos/problemáticos.",
      "porque": "Alertan al químico medicinal. En warheads fenólicos como AUY922 pueden aparecer de forma esperada: son WARN para revisión, no un fail automático del diseño PROTAC."
    },
    {
      "id": "choques",
      "titulo": "Choques estéricos proteína–proteína (< 2.5 Å)",
      "status": "pass",
      "detalle": "0 choques; distancia mínima HSP90↔VHL = 2.729 Å.",
      "valor": {
        "clashes": 0,
        "dmin": 2.729,
        "contacts_5A": 121
      },
      "como": "Sobre complejo_ternario_limpio.pdb se toman coordenadas pesadas de cadenas A (HSP90) y B (VHL). SciPy cdist calcula todas las distancias; se cuentan pares < 2.5 Å (criterio de choque severo).",
      "porque": "Dos proteínas no pueden atravesarse. 0 choques es el mínimo para decir que el ensamblaje ternario es geométricamente admisible."
    },
    {
      "id": "contactos_ppi",
      "titulo": "Contactos interfaciales (< 5.0 Å)",
      "status": "pass",
      "detalle": "121 pares atómicos < 5.0 Å (evidencia geométrica de PPI posible).",
      "valor": 121,
      "como": "Misma matriz de distancias A↔B: se cuentan pares atómicos < 5.0 Å como proxy de interfaz proteína–proteína cooperativa.",
      "porque": "Un PROTAC eficaz suele inducir o aprovechar contacto PPI. Muchos pares cercanos sugieren abrazo superficial; pocos sugieren dos islas unidas solo por un cable."
    },
    {
      "id": "linker_span",
      "titulo": "Extensión efectiva del puente PEG2 (N32↔N42)",
      "status": "pass",
      "detalle": "7.00 Å. Ventana geométrica orientativa 5–9 Å para PEG2 relajado.",
      "valor": 7.0,
      "como": "En protac_en_complejo.pdb se miden las coordenadas de los átomos N32 y N42 (extremos del PEG2 etiquetados por RDKit) y su distancia euclídea.",
      "porque": "Un PEG2 hiper-estirado (>~9 Å) actúa como cuerda tensa; uno colapsado puede no puente. ~5–9 Å indica conformación relajada compatible con el abrazo PPI."
    },
    {
      "id": "limites_modelo",
      "titulo": "Límite de evidencia del modelo 3D",
      "status": "warn",
      "detalle": "0 choques y contactos PPI demuestran que existe una geometría estéricamente admisible. NO demuestran estabilidad en agua, cooperatividad experimental ni degradación celular. Siguiente nivel: HADDOCK/MD + síntesis + Western blot de HSP90.",
      "como": "No es un cálculo numérico extra: es una meta-evaluación del alcance del pipeline (docking rígido + optimización de torsiones + refino local).",
      "porque": "Evita sobreinterpretar. Geometría sin choques ≠ Kd experimental ≠ degradación celular. Obliga al siguiente paso (MD/síntesis/ensayo)."
    }
  ],
  "veredicto": {
    "nivel": "viable_con_reservas",
    "resumen": "La molécula es candidata razonable a síntesis modular, pero hay alertas o métricas fronterizas que un químico medicinal debe revisar.",
    "contadores": {
      "pass": 14,
      "warn": 4,
      "fail": 0,
      "total": 18
    }
  },
  "disclaimer": "Resultado computacional preliminar para priorización. La viabilidad real de laboratorio requiere validación experimental.",
  "navegacion": {
    "visor_3d": "visor.html",
    "wiki": "wiki/index.html",
    "docs": "../docs/05_viabilidad_laboratorio.md"
  }
};

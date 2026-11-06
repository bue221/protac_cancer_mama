"""
Paso 4: Comprobación computacional de viabilidad de laboratorio del PROTAC
HSP90α – [AUY922–PEG2–VH032] – VHL.

Qué responde (y qué NO responde):
- SÍ: ¿la molécula es químicamente válida, ensamblable de forma modular a partir
  de bloques conocidos, y pasa filtros de alertas / accesibilidad sintética?
- SÍ: ¿el modelo 3D ternario actual está libre de choques estéricos graves?
- NO: no garantiza que un químico la sintetice al primer intento, ni que degrade
  HSP90 en células. Eso requiere síntesis experimental y ensayos biológicos.
"""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from rdkit import Chem, RDLogger
from rdkit.Chem import (
    Descriptors,
    FilterCatalog,
    QED,
    rdMolDescriptors,
)
from rdkit.Chem.FilterCatalog import FilterCatalogParams
from scipy.spatial.distance import cdist

RDLogger.DisableLog("rdApp.warning")

import importlib.util

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(
    0,
    str(Path(Chem.__file__).resolve().parents[1] / "Contrib" / "SA_Score"),
)

import sascorer  # noqa: E402

_spec = importlib.util.spec_from_file_location(
    "construir_protac", ROOT / "scripts" / "01_construir_protac.py"
)
_mod = importlib.util.module_from_spec(_spec)
assert _spec.loader is not None
_spec.loader.exec_module(_mod)
PROTAC_COMPONENTES = _mod.PROTAC_COMPONENTES
PROTAC_SMILES = _mod.PROTAC_SMILES


OUT_JSON = ROOT / "05_visor_3d" / "data" / "viabilidad_laboratorio.json"
OUT_JS = ROOT / "05_visor_3d" / "data" / "viabilidad_embed.js"
OUT_WEB_JSON = ROOT / "web" / "public" / "data" / "viabilidad_laboratorio.json"
OUT_MD = ROOT / "docs" / "05_viabilidad_laboratorio.md"
COMPLEX_PDB = ROOT / "04_complejo_ternario_final" / "complejo_ternario_limpio.pdb"
PROTAC_PDB = ROOT / "04_complejo_ternario_final" / "protac_en_complejo.pdb"


def _status(ok: bool, warn: bool = False) -> str:
    if ok and not warn:
        return "pass"
    if warn:
        return "warn"
    return "fail"


# Cómo se calcula + por qué importa (explicación pedagógica del checklist)
CHECK_METODOLOGIA: dict[str, dict[str, str]] = {
    "sanitize": {
        "como": (
            "RDKit aplica Chem.SanitizeMol sobre el SMILES del PROTAC: corrige "
            "aromaticidad Kekulé/aromática, comprueba valencias y detecta "
            "estructuras imposibles."
        ),
        "porque": (
            "Si la molécula no sanitiza, el SMILES está mal o es químicamente "
            "inválido: no tiene sentido hablar de síntesis ni de docking."
        ),
    },
    "conectividad": {
        "como": (
            "Se cuenta el número de fragmentos covalentes con Chem.GetMolFrags. "
            "Un PROTAC bifuncional debe ser exactamente 1 pieza."
        ),
        "porque": (
            "Si hay 2+ fragmentos, warhead y ligando E3 no están unidos: no hay "
            "quimera, solo una mezcla de moléculas sueltas."
        ),
    },
    "elementos": {
        "como": (
            "Se listan los símbolos atómicos del grafo molecular y se comparan "
            "contra el set típico de química orgánica medicinal (C, H, N, O, S, "
            "halógenos, P)."
        ),
        "porque": (
            "Elementos exóticos implican química poco estándar, toxicidad o "
            "reagentes difíciles de manejar en un lab académico/industrial típico."
        ),
    },
    "estereocentros": {
        "como": (
            "Chem.FindMolChiralCenters(includeUnassigned=True) localiza centros "
            "quirales en el SMILES. Contamos cuántos tienen configuración R/S "
            "asignada (crítica en la hidroxiprolina de VH032)."
        ),
        "porque": (
            "VH032 reconoce VHL de forma estereoespecífica. Un centro sin asignar "
            "deja ambigüedad: podrías sintetizar el diastereómero inactivo."
        ),
    },
    "bloque_warhead": {
        "como": (
            "Substructure match RDKit: se busca el SMILES del warhead NVP-AUY922 "
            "dentro del PROTAC completo (GetSubstructMatches)."
        ),
        "porque": (
            "Confirma que el extremo HSP90 es el inhibidor conocido Luminespib, "
            "no otra quimera improvisada. Eso habilita comprar/preparar el bloque."
        ),
    },
    "bloque_linker": {
        "como": (
            "Match de la subestructura PEG2 (NH–CH2–CH2–O–CH2–CH2–O–CH2–C=O) "
            "dentro del SMILES global."
        ),
        "porque": (
            "El linker es el mango sintético: PEG2 es commodity y se acopla por "
            "amidas. Sin él no hay puente geométrico entre bolsillos."
        ),
    },
    "bloque_e3_ligand": {
        "como": (
            "Match de la subestructura VH032 (hidroxiprolina + tert-leucina + "
            "metiltiazol-bencilo) en el PROTAC."
        ),
        "porque": (
            "Garantiza que el extremo E3 es el ligando documentado para VHL "
            "(familia del cristal 4W9H), base de la mayoría de PROTACs VHL."
        ),
    },
    "ruta_modular": {
        "como": (
            "Si los tres bloques anteriores están presentes, se declara una "
            "desconexión retrosintética clásica de PROTAC: warhead + linker + "
            "ligando E3 unidos por dos acoplamientos amida."
        ),
        "porque": (
            "La viabilidad de lab de un PROTAC casi nunca es ‘síntesis total de "
            "cero’; es química convergente de bloques conocidos. Sin esa lógica "
            "modular, el SA Score solo no basta."
        ),
    },
    "sa_score": {
        "como": (
            "Synthetic Accessibility Score de Ertl (módulo RDKit Contrib "
            "SA_Score/sascorer): combina fragmentación en ‘building blocks’ "
            "frecuentes y penalizaciones por tamaño, estereoquímica y rareza "
            "estructural. Escala 1 (fácil) → 10 (muy difícil)."
        ),
        "porque": (
            "Estima cuán ‘sintetizable’ parece la molécula a un químico. En "
            "PROTACs modulares valores ~3–6.5 suelen ser aceptables porque la "
            "dificultad se reparte entre bloques ya conocidos."
        ),
    },
    "qed_contexto_protac": {
        "como": (
            "Quantitative Estimate of Drug-likeness (Bickerton): score 0–1 que "
            "combina MW, LogP, HBD/HBA, PSA, rotables, aromáticos, etc., calibrado "
            "para small molecules orales clásicos."
        ),
        "porque": (
            "Sirve de contexto, no de veto. Los PROTACs suelen tener QED bajo "
            "(MW>800, TPSA alta). Interpretarlo con Rule-of-5 castigaría "
            "injustamente una quimera bifuncional válida."
        ),
    },
    "mw_ventana_protac": {
        "como": (
            "Descriptors.MolWt de RDKit sobre el grafo sin hidrógenos implícitos "
            "mal contados; se compara con la ventana heurística 600–1200 g/mol "
            "reportada para muchas quimeras PROTAC."
        ),
        "porque": (
            "Por debajo, a menudo no hay dos warheads + linker útiles; por "
            "encima, permeabilidad y formulación se vuelven muy difíciles."
        ),
    },
    "logp_ventana": {
        "como": (
            "cLogP de Wildman–Crippen (Descriptors.MolLogP). Se acepta ~1–7 como "
            "rango manejable para PROTACs celulares."
        ),
        "porque": (
            "Muy lipofílico → agregación/promiscuidad; muy hidrofílico → mala "
            "permeación. No predice actividad, pero sí riesgo de ‘mala mol’."
        ),
    },
    "flexibilidad": {
        "como": (
            "rdMolDescriptors.CalcNumRotatableBonds cuenta enlaces simples no "
            "terminales rotables en toda la molécula (incluido el PEG2)."
        ),
        "porque": (
            "Sin flexibilidad el puente no conecta ambos bolsillos; con exceso "
            "hay costo entrópico alto (Vina/MD lo penalizan) y más conformaciones "
            "improductivas."
        ),
    },
    "alertas": {
        "como": (
            "RDKit FilterCatalog con catálogos PAINS y Brenk: patrones "
            "subestructurales asociados a falsos positivos en screening o a "
            "motivos reactivos/problemáticos."
        ),
        "porque": (
            "Alertan al químico medicinal. En warheads fenólicos como AUY922 "
            "pueden aparecer de forma esperada: son WARN para revisión, no un "
            "fail automático del diseño PROTAC."
        ),
    },
    "choques": {
        "como": (
            "Sobre complejo_ternario_limpio.pdb se toman coordenadas pesadas de "
            "cadenas A (HSP90) y B (VHL). SciPy cdist calcula todas las "
            "distancias; se cuentan pares < 2.5 Å (criterio de choque severo)."
        ),
        "porque": (
            "Dos proteínas no pueden atravesarse. 0 choques es el mínimo para "
            "decir que el ensamblaje ternario es geométricamente admisible."
        ),
    },
    "contactos_ppi": {
        "como": (
            "Misma matriz de distancias A↔B: se cuentan pares atómicos < 5.0 Å "
            "como proxy de interfaz proteína–proteína cooperativa."
        ),
        "porque": (
            "Un PROTAC eficaz suele inducir o aprovechar contacto PPI. Muchos "
            "pares cercanos sugieren abrazo superficial; pocos sugieren dos "
            "islas unidas solo por un cable."
        ),
    },
    "linker_span": {
        "como": (
            "En protac_en_complejo.pdb se miden las coordenadas de los átomos "
            "N32 y N42 (extremos del PEG2 etiquetados por RDKit) y su distancia "
            "euclídea."
        ),
        "porque": (
            "Un PEG2 hiper-estirado (>~9 Å) actúa como cuerda tensa; uno "
            "colapsado puede no puente. ~5–9 Å indica conformación relajada "
            "compatible con el abrazo PPI."
        ),
    },
    "limites_modelo": {
        "como": (
            "No es un cálculo numérico extra: es una meta-evaluación del alcance "
            "del pipeline (docking rígido + optimización de torsiones + "
            "refino local)."
        ),
        "porque": (
            "Evita sobreinterpretar. Geometría sin choques ≠ Kd experimental ≠ "
            "degradación celular. Obliga al siguiente paso (MD/síntesis/ensayo)."
        ),
    },
    "modelo_ternario": {
        "como": "Se verifica que exista el PDB del complejo ternario limpio en disco.",
        "porque": "Sin modelo 3D no se pueden validar choques ni contactos PPI.",
    },
}


METODOLOGIA_GENERAL = {
    "objetivo": (
        "Priorizar si AUY922–PEG2–VH032 merece intentarse en un laboratorio de "
        "química medicinal, antes de gastar reactivos o tiempo de síntesis."
    ),
    "pipeline": [
        "Se parte del SMILES canónico definido en scripts/01_construir_protac.py.",
        "RDKit valida química, estereoquímica, propiedades (MW, cLogP, TPSA, QED) y SA Score.",
        "Se confirman por substructure match los tres bloques: AUY922, PEG2 y VH032.",
        "Se aplican filtros PAINS/Brenk como alertas de revisión (no vetos ciegos).",
        "Sobre el PDB ternario se miden choques (<2.5 Å), contactos PPI (<5 Å) y largo del linker.",
        "El veredicto agrega pass/warn/fail: 0 fail y reservas controladas → candidata modular.",
    ],
    "herramientas": [
        "RDKit (Sanitize, descriptores, QED, FilterCatalog, substructure match)",
        "SA Score Ertl (rdkit.Contrib.SA_Score)",
        "NumPy / SciPy (distancias en el complejo PDB)",
        "Modelo ternario generado por docking Vina + scripts/02_ensamblar_complejo_ternario.py",
    ],
    "no_demuestra": [
        "Rendimiento sintético real ni pureza HPLC",
        "Permeabilidad celular o estabilidad metabólica",
        "Degradación de HSP90 en células (hace falta Western blot / ensayobiología)",
        "ΔG experimental: los scores de Vina no se usan aquí como Kd de laboratorio",
    ],
}


def enrich_checks(checks: list[dict]) -> list[dict]:
    """Añade campos 'como' y 'porque' a cada ítem del checklist."""
    enriched = []
    for check in checks:
        meta = CHECK_METODOLOGIA.get(check["id"], {})
        item = dict(check)
        if "como" in meta:
            item["como"] = meta["como"]
        if "porque" in meta:
            item["porque"] = meta["porque"]
        enriched.append(item)
    return enriched


def check_quimica_basica(mol: Chem.Mol) -> list[dict]:
    checks = []
    try:
        Chem.SanitizeMol(mol)
        checks.append(
            {
                "id": "sanitize",
                "titulo": "Valencia y aromaticidad (RDKit Sanitize)",
                "status": "pass",
                "detalle": "La molécula sanitiza sin errores de valencia ni aromaticidad.",
            }
        )
    except Exception as exc:  # noqa: BLE001
        checks.append(
            {
                "id": "sanitize",
                "titulo": "Valencia y aromaticidad (RDKit Sanitize)",
                "status": "fail",
                "detalle": f"Fallo de sanitización: {exc}",
            }
        )
        return checks

    if len(Chem.GetMolFrags(mol)) != 1:
        checks.append(
            {
                "id": "conectividad",
                "titulo": "Una sola pieza covalente",
                "status": "fail",
                "detalle": "El SMILES produce más de un fragmento; no es un PROTAC continuo.",
            }
        )
    else:
        checks.append(
            {
                "id": "conectividad",
                "titulo": "Una sola pieza covalente",
                "status": "pass",
                "detalle": "Warhead, linker y ligando E3 están unidos en una sola molécula.",
            }
        )

    atoms = {a.GetSymbol() for a in mol.GetAtoms()}
    allowed = {"C", "H", "N", "O", "S", "F", "Cl", "Br", "I", "P"}
    weird = sorted(atoms - allowed)
    checks.append(
        {
            "id": "elementos",
            "titulo": "Elementos compatibles con síntesis orgánica típica",
            "status": _status(not weird),
            "detalle": (
                f"Elementos presentes: {', '.join(sorted(atoms))}."
                if not weird
                else f"Elementos no estándar para este flujo: {', '.join(weird)}."
            ),
        }
    )
    return checks


def check_estereoquimica(mol: Chem.Mol) -> list[dict]:
    centers = Chem.FindMolChiralCenters(mol, includeUnassigned=True)
    assigned = [c for c in centers if c[1] != "?"]
    unassigned = [c for c in centers if c[1] == "?"]
    checks = [
        {
            "id": "estereocentros",
            "titulo": "Estereocentros definidos (crítico para VH032)",
            "status": _status(len(unassigned) == 0, warn=len(centers) == 0),
            "detalle": (
                f"{len(assigned)} estereocentros asignados"
                + (f"; {len(unassigned)} sin asignar" if unassigned else "")
                + f". Configuraciones: {', '.join(f'{i}:{cfg}' for i, cfg in assigned) or 'ninguna'}."
            ),
            "valor": {"asignados": len(assigned), "sin_asignar": len(unassigned)},
        }
    ]
    return checks


def check_bloques_modulares(mol: Chem.Mol) -> list[dict]:
    checks = []
    hallazgos = {}
    for clave, info in PROTAC_COMPONENTES.items():
        patron = Chem.MolFromSmiles(info["smiles_subestructura"])
        matches = mol.GetSubstructMatches(patron) if patron is not None else ()
        hallazgos[clave] = len(matches)
        ok = len(matches) >= 1
        checks.append(
            {
                "id": f"bloque_{clave}",
                "titulo": f"Bloque modular detectable: {info['nombre']}",
                "status": _status(ok),
                "detalle": (
                    f"Subestructura encontrada ({len(matches)} coincidencia/s). "
                    "Esto soporta una retrosíntesis por acoplamientos amida entre "
                    "warhead, PEG2 y VH032."
                    if ok
                    else "No se detectó la subestructura esperada; revisar SMILES."
                ),
            }
        )

    # Ruta sintética típica de PROTAC (narrativa computacional, no protocolo experimental)
    ruta_ok = all(hallazgos.get(k, 0) >= 1 for k in ("warhead", "linker", "e3_ligand"))
    checks.append(
        {
            "id": "ruta_modular",
            "titulo": "Ruta retrosintética modular plausible",
            "status": _status(ruta_ok),
            "detalle": (
                "Desconexión estándar: (1) NVP-AUY922 (ácido/amida) + (2) espaciador "
                "PEG2 comercial + (3) VH032. Ambos extremos se unen por acoplamientos "
                "amida (HATU/EDCI u equivalentes), química rutinaria en laboratorios "
                "de química medicinal de PROTACs. NVP-AUY922 y VH032 son ligandos "
                "publicados/comercialmente documentados; PEG2 es commodity."
                if ruta_ok
                else "No se pudo justificar la desconexión modular completa."
            ),
            "ruta_sugerida": [
                "Preparar o adquirir NVP-AUY922 (Luminespib) con mango de acoplamiento",
                "Acopiar amida al linker NH2–PEG2–COOH (o equivalente protegido)",
                "Acopiar el extremo carboxilo del linker al NH2 de VH032",
                "Desproteger hidroxiprolina si aplica y purificar por HPLC",
            ],
        }
    )
    return checks


def check_propiedades_y_sa(mol: Chem.Mol) -> tuple[list[dict], dict]:
    mw = float(Descriptors.MolWt(mol))
    logp = float(Descriptors.MolLogP(mol))
    tpsa = float(rdMolDescriptors.CalcTPSA(mol))
    hbd = int(rdMolDescriptors.CalcNumHBD(mol))
    hba = int(rdMolDescriptors.CalcNumHBA(mol))
    rot = int(rdMolDescriptors.CalcNumRotatableBonds(mol))
    rings = int(rdMolDescriptors.CalcNumRings(mol))
    formula = rdMolDescriptors.CalcMolFormula(mol)
    qed = float(QED.qed(mol))
    sa = float(sascorer.calculateScore(mol))

    props = {
        "formula": formula,
        "mw": round(mw, 2),
        "clogp": round(logp, 2),
        "tpsa": round(tpsa, 2),
        "hbd": hbd,
        "hba": hba,
        "rotatable_bonds": rot,
        "rings": rings,
        "qed": round(qed, 3),
        "sa_score": round(sa, 2),
        "heavy_atoms": mol.GetNumHeavyAtoms(),
    }

    checks = []

    # SA Score: 1 (fácil) .. 10 (muy difícil). PROTACs modulares suelen ~3–6.
    if sa <= 4.5:
        sa_status, sa_note = "pass", "Accesibilidad sintética favorable para una quimera modular."
    elif sa <= 6.5:
        sa_status, sa_note = (
            "warn",
            "Dificultad media-alta (esperable en PROTACs). Mitigable por síntesis convergente de 3 bloques.",
        )
    else:
        sa_status, sa_note = "fail", "SA Score alto: síntesis probablemente compleja o poco práctica."

    checks.append(
        {
            "id": "sa_score",
            "titulo": "Synthetic Accessibility Score (Ertl / RDKit)",
            "status": sa_status,
            "detalle": f"SA = {sa:.2f} (1=fácil, 10=difícil). {sa_note}",
            "valor": round(sa, 2),
            "rango_aceptable_protac": "≤ 6.5 con ruta modular",
        }
    )

    # QED bajo es normal en PROTACs; no fallar por Rule-of-5.
    checks.append(
        {
            "id": "qed_contexto_protac",
            "titulo": "QED en contexto PROTAC (no Rule-of-5 clásica)",
            "status": "warn" if qed < 0.3 else "pass",
            "detalle": (
                f"QED = {qed:.3f}. Los PROTACs suelen violar Lipinski (MW>500, TPSA alta). "
                "Un QED bajo NO invalida la viabilidad; indica que no es un oral small-molecule clásico."
            ),
            "valor": round(qed, 3),
        }
    )

    # Ventanas orientativas publicadas para PROTACs orales/celulares (heurísticas, no dogmas)
    mw_ok = 600 <= mw <= 1200
    checks.append(
        {
            "id": "mw_ventana_protac",
            "titulo": "Peso molecular en ventana típica de PROTAC",
            "status": _status(mw_ok, warn=not mw_ok and 500 <= mw <= 1400),
            "detalle": f"MW = {mw:.1f} g/mol. Ventana orientativa 600–1200 g/mol para quimeras bifuncionales.",
            "valor": round(mw, 2),
        }
    )

    logp_ok = 1.0 <= logp <= 7.0
    checks.append(
        {
            "id": "logp_ventana",
            "titulo": "Lipofilia (cLogP) manejable",
            "status": _status(logp_ok, warn=not logp_ok),
            "detalle": f"cLogP = {logp:.2f}. Fuera de ~1–7 aumenta riesgo de agregación o permeabilidad pobre.",
            "valor": round(logp, 2),
        }
    )

    checks.append(
        {
            "id": "flexibilidad",
            "titulo": "Enlaces rotables del linker (flexibilidad)",
            "status": _status(8 <= rot <= 25, warn=rot > 25 or rot < 6),
            "detalle": (
                f"{rot} enlaces rotables. Necesarios para el puente ternario, pero "
                "exceso implica penalización entrópica en docking/MD."
            ),
            "valor": rot,
        }
    )

    return checks, props


def check_alertas_estructurales(mol: Chem.Mol) -> list[dict]:
    params = FilterCatalogParams()
    params.AddCatalog(FilterCatalogParams.FilterCatalogs.PAINS)
    params.AddCatalog(FilterCatalogParams.FilterCatalogs.BRENK)
    catalog = FilterCatalog.FilterCatalog(params)
    hits = catalog.GetMatches(mol)
    nombres = sorted({h.GetDescription() for h in hits})

    # Resorcinol / fenoles de AUY922 pueden disparar alertas; contextualizar.
    pains = [n for n in nombres if "pains" in n.lower() or n.lower().startswith("pains")]
    # Filter descriptions vary; keep all
    if not nombres:
        return [
            {
                "id": "alertas",
                "titulo": "Filtros PAINS / Brenk",
                "status": "pass",
                "detalle": "Sin alertas PAINS/Brenk detectadas por RDKit FilterCatalog.",
                "alertas": [],
            }
        ]

    # Si hay alertas, warn (no fail automático): PROTACs con warheads conocidos las disparan
    return [
        {
            "id": "alertas",
            "titulo": "Filtros PAINS / Brenk",
            "status": "warn",
            "detalle": (
                f"Se detectaron {len(nombres)} alerta(s): {', '.join(nombres[:8])}"
                + ("…" if len(nombres) > 8 else "")
                + ". En PROTACs basados en NVP-AUY922 esto puede ser esperado "
                "(p.ej. motivos fenólicos del warhead). Requiere revisión química, "
                "no es un rechazo automático."
            ),
            "alertas": nombres,
        }
    ]


def check_modelo_estructural() -> list[dict]:
    checks = []
    if not COMPLEX_PDB.exists():
        return [
            {
                "id": "modelo_ternario",
                "titulo": "Modelo ternario disponible",
                "status": "fail",
                "detalle": f"No se encontró {COMPLEX_PDB}",
            }
        ]

    hsp, vhl = [], []
    with COMPLEX_PDB.open(encoding="utf-8") as f:
        for line in f:
            if not line.startswith("ATOM"):
                continue
            xyz = [float(line[30:38]), float(line[38:46]), float(line[46:54])]
            if line[21] == "A":
                hsp.append(xyz)
            elif line[21] == "B":
                vhl.append(xyz)
    hsp_a = np.array(hsp)
    vhl_a = np.array(vhl)
    d = cdist(hsp_a, vhl_a)
    clashes = int(np.sum(d < 2.5))
    contacts = int(np.sum(d < 5.0))
    dmin = float(d.min())

    checks.append(
        {
            "id": "choques",
            "titulo": "Choques estéricos proteína–proteína (< 2.5 Å)",
            "status": _status(clashes == 0),
            "detalle": f"{clashes} choques; distancia mínima HSP90↔VHL = {dmin:.3f} Å.",
            "valor": {"clashes": clashes, "dmin": round(dmin, 3), "contacts_5A": contacts},
        }
    )
    checks.append(
        {
            "id": "contactos_ppi",
            "titulo": "Contactos interfaciales (< 5.0 Å)",
            "status": _status(contacts >= 40, warn=contacts < 80),
            "detalle": f"{contacts} pares atómicos < 5.0 Å (evidencia geométrica de PPI posible).",
            "valor": contacts,
        }
    )

    linker_span = None
    if PROTAC_PDB.exists():
        pos = {}
        with PROTAC_PDB.open(encoding="utf-8") as f:
            for line in f:
                if line.startswith("HETATM"):
                    aname = line[12:16].strip()
                    elem = line[76:78].strip() or aname[0]
                    if elem == "H":
                        continue
                    xyz = np.array(
                        [float(line[30:38]), float(line[38:46]), float(line[46:54])]
                    )
                    pos[aname] = xyz
        if "N32" in pos and "N42" in pos:
            linker_span = float(np.linalg.norm(pos["N32"] - pos["N42"]))
            ok = 5.0 <= linker_span <= 9.0
            checks.append(
                {
                    "id": "linker_span",
                    "titulo": "Extensión efectiva del puente PEG2 (N32↔N42)",
                    "status": _status(ok, warn=not ok),
                    "detalle": f"{linker_span:.2f} Å. Ventana geométrica orientativa 5–9 Å para PEG2 relajado.",
                    "valor": round(linker_span, 2),
                }
            )

    checks.append(
        {
            "id": "limites_modelo",
            "titulo": "Límite de evidencia del modelo 3D",
            "status": "warn",
            "detalle": (
                "0 choques y contactos PPI demuestran que existe una geometría "
                "estéricamente admisible. NO demuestran estabilidad en agua, "
                "cooperatividad experimental ni degradación celular. Siguiente "
                "nivel: HADDOCK/MD + síntesis + Western blot de HSP90."
            ),
        }
    )
    return checks


def veredicto(checks: list[dict]) -> dict:
    fails = [c for c in checks if c["status"] == "fail"]
    warns = [c for c in checks if c["status"] == "warn"]
    passes = [c for c in checks if c["status"] == "pass"]

    if fails:
        nivel = "no_viable_computacionalmente"
        resumen = (
            "Hay bloqueos duros (química inválida, bloques ausentes o choques graves). "
            "No se recomienda avanzar a síntesis hasta corregirlos."
        )
    elif len(warns) >= 4:
        nivel = "viable_con_reservas"
        resumen = (
            "La molécula es candidata razonable a síntesis modular, pero hay alertas "
            "o métricas fronterizas que un químico medicinal debe revisar."
        )
    else:
        nivel = "viable_modular_en_papel"
        resumen = (
            "Comprobación computacional favorable: química válida, bloques conocidos "
            "detectables, SA Score tolerable y modelo ternario sin choques graves. "
            "Apto para planificar síntesis de prueba; no sustituye el experimento."
        )

    return {
        "nivel": nivel,
        "resumen": resumen,
        "contadores": {
            "pass": len(passes),
            "warn": len(warns),
            "fail": len(fails),
            "total": len(checks),
        },
    }


def render_markdown(report: dict) -> str:
    lines = [
        "# 05. Viabilidad de Laboratorio (Comprobación Computacional)",
        "",
        f"**Fecha:** {report['generated_at']}",
        f"**Veredicto:** `{report['veredicto']['nivel']}`",
        "",
        report["veredicto"]["resumen"],
        "",
        "## Propiedades fisicoquímicas",
        "",
        "| Propiedad | Valor |",
        "|---|---|",
    ]
    for k, v in report["propiedades"].items():
        lines.append(f"| `{k}` | {v} |")
    metodo = report.get("metodologia", {})
    if metodo:
        lines += ["", "## Cómo se llegó a estos cálculos", "", metodo.get("objetivo", ""), ""]
        lines.append("### Pipeline")
        lines.append("")
        for step in metodo.get("pipeline", []):
            lines.append(f"1. {step}")
        lines += ["", "### Herramientas", ""]
        for tool in metodo.get("herramientas", []):
            lines.append(f"- {tool}")
        lines += ["", "### Qué no demuestra", ""]
        for item in metodo.get("no_demuestra", []):
            lines.append(f"- {item}")

    lines += ["", "## Checklist", ""]
    for c in report["checks"]:
        icon = {"pass": "✅", "warn": "⚠️", "fail": "❌"}[c["status"]]
        lines += [f"### {icon} {c['titulo']}", "", c["detalle"], ""]
        if c.get("como"):
            lines += ["", f"**Cómo se calculó:** {c['como']}"]
        if c.get("porque"):
            lines += ["", f"**Por qué importa:** {c['porque']}"]
        lines.append("")
    lines += [
        "## Alcance honesto",
        "",
        "- Esta comprobación **no** certifica actividad PROTAC en células.",
        "- Esta comprobación **no** sustituye un plan sintético con cantidades, "
        "protectores y purificación.",
        "- Soporta la decisión de **seguir / pausar** antes de gastar reactivos.",
        "",
    ]
    return "\n".join(lines)


def main() -> None:
    print("1. Validando SMILES del PROTAC y ejecutando checklist de laboratorio...")
    mol = Chem.MolFromSmiles(PROTAC_SMILES)
    if mol is None:
        print("Error: SMILES inválido.")
        sys.exit(1)

    checks: list[dict] = []
    checks += check_quimica_basica(mol)
    checks += check_estereoquimica(mol)
    checks += check_bloques_modulares(mol)
    prop_checks, props = check_propiedades_y_sa(mol)
    checks += prop_checks
    checks += check_alertas_estructurales(mol)
    checks += check_modelo_estructural()
    checks = enrich_checks(checks)

    report = {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "molecule": {
            "name": "AUY922–PEG2–VH032",
            "smiles": PROTAC_SMILES,
            "target": "HSP90-alpha (P07900)",
            "e3_ligase": "VHL (P40337)",
        },
        "propiedades": props,
        "metodologia": METODOLOGIA_GENERAL,
        "checks": checks,
        "veredicto": veredicto(checks),
        "disclaimer": (
            "Resultado computacional preliminar para priorización. "
            "La viabilidad real de laboratorio requiere validación experimental."
        ),
        "navegacion": {
            "visor_3d": "visor.html",
            "wiki": "wiki/index.html",
            "docs": "../docs/05_viabilidad_laboratorio.md",
        },
    }

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_WEB_JSON.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(report, indent=2, ensure_ascii=False)
    OUT_JSON.write_text(payload, encoding="utf-8")
    OUT_WEB_JSON.write_text(payload, encoding="utf-8")
    # Embed legacy para el portal HTML estático (file://)
    OUT_JS.write_text(
        "window.VIABILIDAD_DATA = " + payload + ";\n",
        encoding="utf-8",
    )
    OUT_MD.write_text(render_markdown(report), encoding="utf-8")

    v = report["veredicto"]
    print("\n" + "=" * 72)
    print("  COMPROBACIÓN DE VIABILIDAD DE LABORATORIO (COMPUTACIONAL)")
    print("=" * 72)
    print(f"  Veredicto : {v['nivel']}")
    print(f"  Resumen   : {v['resumen']}")
    print(
        f"  Checklist : {v['contadores']['pass']} pass | "
        f"{v['contadores']['warn']} warn | {v['contadores']['fail']} fail"
    )
    print(f"  SA Score  : {props['sa_score']} | MW: {props['mw']} | cLogP: {props['clogp']}")
    print(f"  JSON      : {OUT_JSON.relative_to(ROOT)}")
    print(f"  Web JSON  : {OUT_WEB_JSON.relative_to(ROOT)}")
    print(f"  Embed JS  : {OUT_JS.relative_to(ROOT)}")
    print(f"  Markdown  : {OUT_MD.relative_to(ROOT)}")
    print("=" * 72 + "\n")


if __name__ == "__main__":
    main()

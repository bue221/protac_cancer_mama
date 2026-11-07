import json
import sys
from rdkit import Chem
from rdkit.Chem import AllChem, Descriptors, rdMolDescriptors, rdMolTransforms


# =====================================================================
# 1. DEFINICIÓN MODULAR Y ENTENDIBLE DEL PROTAC
# =====================================================================
# Un PROTAC se compone de 3 bloques funcionales unidos químicamente:
#   [Warhead: NVP-AUY922] --- [Linker: PEG2] --- [Ligando E3: VHL (VH032)]
PROTAC_COMPONENTES = {
    "warhead": {
        "nombre": "Warhead: NVP-AUY922 (Luminespib)",
        "funcion": "Inhibidor de Hsp90 (isoxazol + resorcinol + fenil-morfolina)",
        "smiles_subestructura": "O=Cc1noc(-c2cc(C(C)C)c(O)cc2O)c1-c3ccc(CN4CCOCC4)cc3",
        "res_name": "AUY",
        "res_num": 1,
    },
    "linker": {
        "nombre": "Linker (Cadena PEG2)",
        "funcion": "Conecta el NVP-AUY922 con el ligando VHL dándole flexibilidad espacial",
        "smiles_subestructura": "NCCOCCOCC(=O)",
        "res_name": "LNK",
        "res_num": 2,
    },
    "e3_ligand": {
        "nombre": "Ligando E3 (VH032 para VHL)",
        "funcion": "Recluta la ubiquitina ligasa E3 (VHL) para degradar Hsp90",
        "smiles_subestructura": "N[C@@H](C(C)(C)C)C(=O)N1C[C@H](O)C[C@H]1C(=O)NCc2ccc(c3scnc3C)cc2",
        "res_name": "VHL",
        "res_num": 3,
    },
}

# SMILES ordenado de forma 100% contigua de izquierda a derecha:
# [Átomos 0..30: NVP-AUY922] -> [Átomos 31..40: Linker PEG2] -> [Átomos 41..70: Ligando VHL]
PROTAC_SMILES = (
    "O=C(c1noc(-c2cc(C(C)C)c(O)cc2O)c1-c3ccc(CN4CCOCC4)cc3)"  # <--- [AUY] NVP-AUY922 (Luminespib)
    "NCCOCCOCC(=O)"  # <--- [LNK] Linker PEG2
    "N[C@@H](C(C)(C)C)C(=O)N5C[C@H](O)C[C@H]5C(=O)NCc6ccc(-c7scnc7C)cc6"  # <--- [VHL] Ligando E3 (VH032)
)


def construir_y_validar_mol(smiles: str) -> Chem.Mol:
    """Convierte el código SMILES en una molécula RDKit validada y con hidrógenos."""
    print("1. Leyendo y validando estructura química (SMILES)...")
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        print("Error: El código SMILES no es válido. Revisa los enlaces químicos.")
        sys.exit(1)

    Chem.SanitizeMol(mol)
    # Añadimos hidrógenos explícitos (indispensables para un cálculo físico realista)
    mol_h = Chem.AddHs(mol)
    return mol_h


def etiquetar_regiones_pdb(mol: Chem.Mol) -> None:
    """
    Asigna nombres de residuo (WAR, LNK, VHL) a cada átomo en el archivo PDB
    para que al abrirlo en PyMOL, ChimeraX o AutoDock sea fácil identificar cada parte.
    """
    # Por defecto etiquetamos todo como warhead y luego refinamos por subestructura
    mapa_atomos = {}

    for clave, info in PROTAC_COMPONENTES.items():
        patron = Chem.MolFromSmiles(info["smiles_subestructura"])
        if patron is not None:
            coincidencias = mol.GetSubstructMatches(patron)
            for match in coincidencias:
                for atom_idx in match:
                    mapa_atomos[atom_idx] = (info["res_name"], info["res_num"])

    for atom in mol.GetAtoms():
        idx = atom.GetIdx()
        # Si es un hidrógeno, hereda la región del átomo pesado al que está unido
        if atom.GetAtomicNum() == 1 and atom.GetNeighbors():
            vecino_idx = atom.GetNeighbors()[0].GetIdx()
            res_name, res_num = mapa_atomos.get(vecino_idx, ("AUY", 1))
        else:
            res_name, res_num = mapa_atomos.get(idx, ("AUY", 1))

        mi = Chem.AtomPDBResidueInfo()
        simbolo = atom.GetSymbol()
        nombre_atomo = f"{simbolo}{idx + 1}"[:4].ljust(4)
        mi.SetName(nombre_atomo)
        mi.SetResidueName(res_name)
        mi.SetResidueNumber(res_num)
        mi.SetChainId("A")
        mi.SetIsHeteroAtom(True)
        atom.SetMonomerInfo(mi)


def generar_conformero_estable(
    mol: Chem.Mol, num_conformeros: int = 12, max_iters: int = 2000
) -> tuple[int, float]:
    """
    Genera múltiples conformaciones 3D usando ETKDGv3, evita el colapso hidrofóbico
    en vacío manteniendo el linker PEG2 en conformación extendida (all-trans),
    minimiza con MMFF94s y alinea la molécula sobre el eje X.
    """
    print(f"2. Generando {num_conformeros} conformaciones 3D (Método ETKDGv3)...")
    params = AllChem.ETKDGv3()
    params.randomSeed = 42
    params.useSmallRingTorsions = True
    params.pruneRmsThresh = 0.5

    cids = AllChem.EmbedMultipleConfs(mol, numConfs=num_conformeros, params=params)
    if not cids:
        params.useRandomCoords = True
        cids = AllChem.EmbedMultipleConfs(mol, numConfs=num_conformeros, params=params)

    if not cids:
        print("Error: No se pudieron generar coordenadas 3D para el PROTAC.")
        sys.exit(1)

    print(
        f"3. Minimizando en conformación extendida (MMFF94s, evitando plegamiento en 'U')..."
    )
    # Ruta de átomos enlazados a lo largo del puente [Isoxazol -> C(=O) -> PEG2 -> VHL]
    cadena_puente = [2, 1, 31, 32, 33, 34, 35, 36, 37, 38, 39, 41, 42, 47, 49]
    propiedades_mmff = AllChem.MMFFGetMoleculeProperties(mol, mmffVariant="MMFF94s")

    mejor_cid = cids[0]
    menor_energia = 1e9

    for cid in cids:
        conf = mol.GetConformer(cid)
        # 1) Colocar los diedros del linker PEG2 en zig-zag extendido (180° trans)
        for k in range(len(cadena_puente) - 3):
            rdMolTransforms.SetDihedralDeg(
                conf,
                cadena_puente[k],
                cadena_puente[k + 1],
                cadena_puente[k + 2],
                cadena_puente[k + 3],
                180.0,
            )

        # 2) Primera etapa: minimizar con guía de torsión y distancia entre extremos
        ff = AllChem.MMFFGetMoleculeForceField(mol, propiedades_mmff, confId=cid)
        for k in range(1, len(cadena_puente) - 3):
            ff.MMFFAddTorsionConstraint(
                cadena_puente[k],
                cadena_puente[k + 1],
                cadena_puente[k + 2],
                cadena_puente[k + 3],
                False,
                165.0,
                195.0,
                30.0,
            )
        ff.MMFFAddDistanceConstraint(31, 39, False, 9.5, 11.5, 80.0)
        ff.MMFFAddDistanceConstraint(1, 49, False, 15.0, 19.0, 80.0)
        ff.MMFFAddDistanceConstraint(10, 65, False, 24.0, 34.0, 50.0)
        ff.Minimize(maxIts=max_iters)

        # 3) Segunda etapa: relajar enlaces y anillos locales manteniendo separación biológica
        ff2 = AllChem.MMFFGetMoleculeForceField(mol, propiedades_mmff, confId=cid)
        ff2.MMFFAddDistanceConstraint(31, 39, False, 9.2, 11.5, 15.0)
        ff2.MMFFAddDistanceConstraint(1, 49, False, 14.5, 19.5, 15.0)
        ff2.MMFFAddDistanceConstraint(10, 65, False, 22.0, 34.0, 15.0)
        ff2.Minimize(maxIts=max_iters)

        # Evaluar la energía física pura MMFF94s de este confórmero extendido
        ff_puro = AllChem.MMFFGetMoleculeForceField(mol, propiedades_mmff, confId=cid)
        energia_actual = ff_puro.CalcEnergy()
        if energia_actual < menor_energia:
            menor_energia = energia_actual
            mejor_cid = cid

    # Alinear el confórmero ganador sobre el eje X principal para visualización limpia
    rdMolTransforms.CanonicalizeConformer(mol.GetConformer(mejor_cid))

    print(
        f"   Confórmero extendido más estable (ID #{mejor_cid}) | Energía MMFF94s: {menor_energia:.2f} kcal/mol"
    )
    return mejor_cid, menor_energia


def mostrar_resumen_protac(mol: Chem.Mol, energia: float) -> None:
    """Imprime una ficha técnica clara y entendible de las propiedades del PROTAC."""
    mol_sin_h = Chem.RemoveHs(mol)
    peso_mol = Descriptors.MolWt(mol_sin_h)
    logp = Descriptors.MolLogP(mol_sin_h)
    hbd = rdMolDescriptors.CalcNumHBD(mol_sin_h)
    hba = rdMolDescriptors.CalcNumHBA(mol_sin_h)
    rot_bonds = rdMolDescriptors.CalcNumRotatableBonds(mol_sin_h)
    tpsa = rdMolDescriptors.CalcTPSA(mol_sin_h)

    print("\n" + "=" * 65)
    print("               RESUMEN ESTRUCTURAL DEL PROTAC")
    print("=" * 65)
    print("ARQUITECTURA MODULAR (Etiquetas en el PDB):")
    for info in PROTAC_COMPONENTES.values():
        print(
            f"  • [{info['res_name']}] {info['nombre']}\n"
            f"          Función: {info['funcion']}"
        )
    print("-" * 65)
    print("PROPIEDADES FISICOQUÍMICAS Y ESTABILIDAD:")
    print(f"  • Fórmula molecular     : {rdMolDescriptors.CalcMolFormula(mol_sin_h)}")
    print(f"  • Peso molecular (MW)   : {peso_mol:.2f} g/mol")
    print(f"  • Lipofilicidad (cLogP) : {logp:.2f}")
    print(f"  • Donadores puente H    : {hbd}")
    print(f"  • Aceptores puente H    : {hba}")
    print(f"  • Enlaces rotables      : {rot_bonds} (alta flexibilidad típica de PROTAC)")
    print(f"  • Área polar (TPSA)     : {tpsa:.2f} Å²")
    print(f"  • Energía mínima 3D     : {energia:.2f} kcal/mol (MMFF94s convergente)")
    print("=" * 65 + "\n")


def exportar_archivos(mol: Chem.Mol, conf_id: int) -> None:
    """Exporta el confórmero más estable en formatos PDB, SDF y JSON para AlphaFold 3."""
    print("4. Etiquetando regiones funcionales (AUY / LNK / VHL) y exportando...")
    etiquetar_regiones_pdb(mol)

    pdb_filename = "01_estructuras_iniciales/protac.pdb"
    sdf_filename = "01_estructuras_iniciales/protac.sdf"
    # Local AF3 (código abierto): acepta SMILES custom del PROTAC
    af3_local_json = "01_estructuras_iniciales/alphafold3_local_input.json"
    # AlphaFold Server (web): exige ARRAY de jobs + proteinChain; NO acepta SMILES custom
    af_server_json = "01_estructuras_iniciales/alphafold_server_hsp90_vhl.json"

    # Guardar PDB del confórmero extendido de mínima energía
    Chem.MolToPDBFile(mol, pdb_filename, confId=conf_id)

    # Guardar SDF (conserva órdenes de enlace exactos, ideal para AutoDock Vina / Meeko)
    writer = Chem.SDWriter(sdf_filename)
    writer.write(mol, confId=conf_id)
    writer.close()

    hsp90_ntd = (
        "DQPMEEEEVETFAFQAEIAQLMSLIINTFYSNKEIFLRELISNSSDALDKIRYESLTDPSKLDSGKELHINL"
        "IPNKQDRTLTIVDTGIGMTKADLINNLGTIAKSGTKAFMEALQAGADISMIGQFGVGFYSAYLVAEKVTVIT"
        "KHNDDEQYAWESSAGGSFTVRTDTGEPMGRGTKVILHLKEDQTEYLEERRIKEIVKKHSQFIGYPITLFVEK"
        "ERDKEVSDDEAE"
    )
    vhl_domain = (
        "MEAGRPRPVLRSVNSREPSQVIFCNRSPRVVLPVWLNFDGEPQPYPTLPPGTGRRIHSYRGHLWLFRDAGTH"
        "DGLLVNQTELFVPSLNVDGQPIFANITLPVYTLKERCLQVVRSLVKPENYRRLDIVRSLYEDLEDHPNVQKD"
        "LERLTQERIAHQRMGD"
    )

    # Formato local AlphaFold 3 (dialect alphafold3 + SMILES del PROTAC)
    af3_local_payload = {
        "name": "Complejo_Ternario_Hsp90_PROTAC_AUY922_VHL",
        "modelSeeds": [42],
        "sequences": [
            {
                "protein": {
                    "id": "A",
                    "description": "Hsp90-alpha N-terminal domain (UniProt P07900, residuos 9-236)",
                    "sequence": hsp90_ntd,
                }
            },
            {
                "protein": {
                    "id": "B",
                    "description": "Von Hippel-Lindau (VHL) E3 ligase domain (UniProt P40337, residuos 54-213)",
                    "sequence": vhl_domain,
                }
            },
            {
                "ligand": {
                    "id": "C",
                    "smiles": PROTAC_SMILES,
                }
            },
        ],
        "dialect": "alphafold3",
        "version": 1,
    }
    with open(af3_local_json, "w", encoding="utf-8") as f:
        json.dump(af3_local_payload, f, indent=2, ensure_ascii=False)

    # Formato AlphaFold Server (DEBE ser una lista; proteinChain + count; sin SMILES custom)
    af_server_payload = [
        {
            "name": "HSP90_NTD_VHL_PPI_sin_PROTAC",
            "modelSeeds": [],
            "sequences": [
                {
                    "proteinChain": {
                        "sequence": hsp90_ntd,
                        "count": 1,
                    }
                },
                {
                    "proteinChain": {
                        "sequence": vhl_domain,
                        "count": 1,
                    }
                },
            ],
            "dialect": "alphafoldserver",
            "version": 1,
        }
    ]
    with open(af_server_json, "w", encoding="utf-8") as f:
        json.dump(af_server_payload, f, indent=2, ensure_ascii=False)

    # Compatibilidad: el nombre antiguo ahora apunta al JSON del Server (upload web)
    legacy_name = "01_estructuras_iniciales/alphafold3_input.json"
    with open(legacy_name, "w", encoding="utf-8") as f:
        json.dump(af_server_payload, f, indent=2, ensure_ascii=False)

    print(f"   ✓ Archivo PDB guardado como  : {pdb_filename} (extendido y ordenado: AUY -> LNK -> VHL)")
    print(f"   ✓ Archivo SDF guardado como  : {sdf_filename} (conserva enlaces dobles/aromáticos)")
    print(f"   ✓ AF Server (subir aquí)     : {af_server_json}")
    print(f"   ✓ AF3 local (+ SMILES PROTAC): {af3_local_json}")
    print(
        "   ⚠ AlphaFold Server NO acepta SMILES custom del PROTAC; "
        "el JSON del Server predice solo HSP90+VHL (PPI)."
    )


def generar_modelo_3d() -> None:
    mol = construir_y_validar_mol(PROTAC_SMILES)
    mejor_cid, menor_energia = generar_conformero_estable(
        mol, num_conformeros=12, max_iters=2000
    )
    exportar_archivos(mol, mejor_cid)
    mostrar_resumen_protac(mol, menor_energia)


if __name__ == "__main__":
    generar_modelo_3d()


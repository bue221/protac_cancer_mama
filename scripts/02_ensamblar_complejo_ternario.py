"""
Paso 2: Ensamblaje, optimización de la Interfaz Proteína–Proteína (PPI),
refinamiento local en AutoDock Vina y exportación con conectividades RDKit (CONECT)
del Complejo Ternario: HSP90α – PROTAC (AUY922-PEG2-VH032) – VHL.
"""
import importlib.util
import subprocess
import numpy as np
from rdkit import Chem
from rdkit.Chem import AllChem
from scipy.spatial.distance import cdist
from scipy.optimize import minimize

# Cargar PROTAC_COMPONENTES desde scripts/01_construir_protac.py
spec = importlib.util.spec_from_file_location(
    "construir_protac", "scripts/01_construir_protac.py"
)
mod_protac = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod_protac)
PROTAC_COMPONENTES = mod_protac.PROTAC_COMPONENTES


def parse_pdbqt_models(filename: str):
    models = []
    curr_m, curr_aff, curr_atoms, curr_lines = None, None, {}, []
    with open(filename, encoding="utf-8") as f:
        for line in f:
            if line.startswith("MODEL"):
                curr_m = int(line.split()[1])
                curr_aff = None
                curr_atoms = {}
                curr_lines = []
            elif line.startswith("REMARK VINA RESULT:") and curr_aff is None:
                curr_aff = float(line.split()[3])
            elif line.startswith("ATOM") or line.startswith("HETATM"):
                idx = int(line[6:11].strip())
                curr_atoms[idx] = np.array(
                    [float(line[30:38]), float(line[38:46]), float(line[46:54])]
                )
                curr_lines.append(line)
            elif line.startswith("ENDMDL"):
                models.append((curr_m, curr_aff, curr_atoms, curr_lines))
    return models


def rot_axis(axis: np.ndarray, theta: float) -> np.ndarray:
    axis = axis / np.linalg.norm(axis)
    K = np.array(
        [[0.0, -axis[2], axis[1]], [axis[2], 0.0, -axis[0]], [-axis[1], axis[0], 0.0]]
    )
    return np.eye(3) + np.sin(theta) * K + (1.0 - np.cos(theta)) * (K @ K)


def build_rdkit_pdb_block(mol_orig: Chem.Mol, pq_to_rd: dict, pq_coords: dict) -> str:
    mol = Chem.Mol(mol_orig)
    conf = mol.GetConformer()
    fixed_rd = set()
    for pq_idx, rd_idx in pq_to_rd.items():
        conf.SetAtomPosition(rd_idx, pq_coords[pq_idx].tolist())
        fixed_rd.add(rd_idx)

    rng = np.random.default_rng(42)
    for atom in mol.GetAtoms():
        if atom.GetIdx() not in fixed_rd:
            parent = atom.GetNeighbors()[0]
            p_pos = np.array(conf.GetAtomPosition(parent.GetIdx()))
            conf.SetAtomPosition(
                atom.GetIdx(), (p_pos + rng.uniform(-0.6, 0.6, 3)).tolist()
            )

    mp = AllChem.MMFFGetMoleculeProperties(mol, mmffVariant="MMFF94s")
    ff = AllChem.MMFFGetMoleculeForceField(mol, mp)
    for rd_idx in fixed_rd:
        ff.MMFFAddPositionConstraint(rd_idx, 0.0, 2000.0)
    ff.Minimize(maxIts=500)

    mapa_atomos = {}
    for info in PROTAC_COMPONENTES.values():
        patron = Chem.MolFromSmiles(info["smiles_subestructura"])
        if patron is not None:
            for match in mol.GetSubstructMatches(patron):
                for atom_idx in match:
                    mapa_atomos[atom_idx] = (info["res_name"], info["res_num"])

    for atom in mol.GetAtoms():
        idx = atom.GetIdx()
        if atom.GetAtomicNum() == 1 and atom.GetNeighbors():
            vec_idx = atom.GetNeighbors()[0].GetIdx()
            res_name, res_num = mapa_atomos.get(vec_idx, ("AUY", 1))
        else:
            res_name, res_num = mapa_atomos.get(idx, ("AUY", 1))
        mi = Chem.AtomPDBResidueInfo()
        nombre = f"{atom.GetSymbol()}{idx + 1}"[:4].ljust(4)
        mi.SetName(nombre)
        mi.SetResidueName(res_name)
        mi.SetResidueNumber(res_num)
        mi.SetChainId("C")
        mi.SetIsHeteroAtom(True)
        atom.SetMonomerInfo(mi)

    return Chem.MolToPDBBlock(mol)


def main():
    print("1. Cargando estructuras desde 01_estructuras_iniciales/ y 03_docking_secuencial/...")
    with open("01_estructuras_iniciales/hsp90.pdb", encoding="utf-8") as f:
        hsp_full_lines = [l for l in f if l.startswith("ATOM")]
    hsp_ntd_lines = [l for l in hsp_full_lines if 14 <= int(l[22:26].strip()) <= 223]
    hsp_coords = np.array(
        [[float(l[30:38]), float(l[38:46]), float(l[46:54])] for l in hsp_ntd_lines]
    )

    with open("01_estructuras_iniciales/vhl.pdb", encoding="utf-8") as f:
        vhl_full_lines = [l for l in f if l.startswith("ATOM")]
    vhl_core_lines = [l for l in vhl_full_lines if 10 <= int(l[22:26].strip()) <= 158]
    vhl_coords = np.array(
        [[float(l[30:38]), float(l[38:46]), float(l[46:54])] for l in vhl_core_lines]
    )
    vhl_full_coords = np.array(
        [[float(l[30:38]), float(l[38:46]), float(l[46:54])] for l in vhl_full_lines]
    )

    with open("02_preparacion_pdbqt/receptor_hsp90.pdbqt", encoding="utf-8") as f:
        hsp_pdbqt_lines = [
            l
            for l in f
            if (l.startswith("ATOM") or l.startswith("HETATM"))
            and 14 <= int(l[22:26].strip()) <= 223
        ]
    with open("02_preparacion_pdbqt/receptor_vhl.pdbqt", encoding="utf-8") as f:
        vhl_pdbqt_lines = [
            l
            for l in f
            if (l.startswith("ATOM") or l.startswith("HETATM"))
            and 10 <= int(l[22:26].strip()) <= 158
        ]
    vhl_pdbqt_coords = np.array(
        [[float(l[30:38]), float(l[38:46]), float(l[46:54])] for l in vhl_pdbqt_lines]
    )

    m1_list = parse_pdbqt_models("03_docking_secuencial/resultado_docking1_hsp90.pdbqt")
    m2_list = parse_pdbqt_models("03_docking_secuencial/resultado_docking2_vhl.pdbqt")
    _, aff1, atoms1, _ = m1_list[0]
    _, aff2, atoms2, _ = m2_list[2]

    print(
        f"2. Optimizando Interfaz Proteína-Proteína (PPI) y puente PEG2 (D1: {aff1:.3f} | D2: {aff2:.3f} kcal/mol)..."
    )
    bonds = [
        (9, 7, [6, 5, 4, 3, 2, 1, 10] + list(range(42, 78))),
        (7, 6, [5, 4, 3, 2, 1] + list(range(42, 78))),
        (6, 5, [4, 3, 2, 1] + list(range(42, 78))),
        (5, 4, [3, 2, 1] + list(range(42, 78))),
        (4, 3, [2, 1] + list(range(42, 78))),
        (3, 2, [1] + list(range(42, 78))),
        (2, 1, list(range(42, 78))),
        (1, 42, list(range(43, 78))),
        (42, 43, list(range(44, 78))),
        (45, 47, list(range(48, 78))),
    ]

    auy_center = np.mean([atoms1[i] for i in range(8, 42)], axis=0)
    hsp_near = hsp_coords[np.linalg.norm(hsp_coords - auy_center, axis=1) < 20.0]

    base_atoms = {k: v.copy() for k, v in atoms1.items()}
    anchor_idx = [42, 43, 44, 45, 47]
    P = np.array([atoms2[i] for i in anchor_idx])
    Q = np.array([base_atoms[i] for i in anchor_idx])
    cP, cQ = P.mean(axis=0), Q.mean(axis=0)
    U, S, Vt = np.linalg.svd((P - cP).T @ (Q - cQ))
    d = np.linalg.det(U @ Vt)
    R0 = U @ np.diag([1.0, 1.0, 1.0 if d > 0 else -1.0]) @ Vt
    for i in range(45, 78):
        base_atoms[i] = (atoms2[i] - cP) @ R0 + cQ
    vhl_base = (vhl_coords - cP) @ R0 + cQ
    vhl_full_base = (vhl_full_coords - cP) @ R0 + cQ
    vhl_pdbqt_base = (vhl_pdbqt_coords - cP) @ R0 + cQ

    vh_center0 = np.mean([base_atoms[i] for i in range(45, 78)], axis=0)
    vhl_near_mask = np.linalg.norm(vhl_base - vh_center0, axis=1) < 20.0

    def apply_angles(thetas):
        atoms = {k: v.copy() for k, v in base_atoms.items()}
        vhl_curr = vhl_base.copy()
        vhl_f_curr = vhl_full_base.copy()
        vhl_q_curr = vhl_pdbqt_base.copy()
        for (p1, p2, moving), th in zip(bonds, thetas):
            R = rot_axis(atoms[p2] - atoms[p1], th)
            orig = atoms[p1]
            for idx in moving:
                atoms[idx] = (atoms[idx] - orig) @ R.T + orig
            vhl_curr = (vhl_curr - orig) @ R.T + orig
            vhl_f_curr = (vhl_f_curr - orig) @ R.T + orig
            vhl_q_curr = (vhl_q_curr - orig) @ R.T + orig
        return atoms, vhl_curr, vhl_f_curr, vhl_q_curr

    def obj(thetas):
        atoms, vhl_curr, _, _ = apply_angles(thetas)
        vhl_n = vhl_curr[vhl_near_mask]
        d_mat = cdist(hsp_near, vhl_n)
        clashes = np.sum(np.maximum(0.0, 2.75 - d_mat) ** 2) * 10000.0
        favorable_ppi = np.sum((d_mat >= 2.75) & (d_mat <= 5.2))
        vh_xyz = np.array([atoms[i] for i in range(42, 78)])
        auy_xyz = np.array([atoms[i] for i in range(1, 42)])
        d_vh_hsp = cdist(vh_xyz, hsp_near)
        d_auy_vhl = cdist(auy_xyz, vhl_n)
        lig_clash = (
            np.sum(np.maximum(0.0, 2.75 - d_vh_hsp) ** 2) * 10000.0
            + np.sum(np.maximum(0.0, 2.75 - d_auy_vhl) ** 2) * 10000.0
        )
        linker_dist = np.linalg.norm(atoms[7] - atoms[45])
        linker_compact = np.maximum(0.0, linker_dist - 6.8) ** 2 * 25.0
        return clashes + lig_clash - favorable_ppi * 2.0 + linker_compact

    best_res = None
    best_val = 1e18
    rng = np.random.default_rng(42)
    for _ in range(15):
        x0 = rng.uniform(-np.pi, np.pi, size=len(bonds))
        res = minimize(obj, x0, method="Powell", options={"maxiter": 350})
        if res.fun < best_val:
            best_val = res.fun
            best_res = res.x

    atoms_opt, vhl_opt, vhl_full_opt, vhl_pdbqt_opt = apply_angles(best_res)

    rec_ternario_path = "04_complejo_ternario_final/receptor_ternario_hsp90_vhl.pdbqt"
    prot_ternario_in = "04_complejo_ternario_final/protac_antes_refinar.pdbqt"
    prot_ternario_out = "04_complejo_ternario_final/protac_en_complejo.pdbqt"

    with open(rec_ternario_path, "w", encoding="utf-8") as f:
        for l in hsp_pdbqt_lines:
            f.write(l)
        for l, xyz in zip(vhl_pdbqt_lines, vhl_pdbqt_opt):
            f.write(
                l[:21]
                + "B"
                + l[22:30]
                + f"{xyz[0]:8.3f}{xyz[1]:8.3f}{xyz[2]:8.3f}"
                + l[54:]
            )

    with open(
        "03_docking_secuencial/mejor_pose_hsp90.pdbqt", encoding="utf-8"
    ) as f_in, open(prot_ternario_in, "w", encoding="utf-8") as f_out:
        for l in f_in:
            if l.startswith("ATOM") or l.startswith("HETATM"):
                idx = int(l[6:11].strip())
                xyz = atoms_opt[idx]
                f_out.write(
                    l[:30] + f"{xyz[0]:8.3f}{xyz[1]:8.3f}{xyz[2]:8.3f}" + l[54:]
                )
            else:
                f_out.write(l)

    print("3. Ejecutando refinamiento local en AutoDock Vina (--local_only)...")
    subprocess.run(
        [
            "./bin/vina",
            "--receptor",
            rec_ternario_path,
            "--ligand",
            prot_ternario_in,
            "--autobox",
            "--local_only",
            "--out",
            prot_ternario_out,
        ],
        check=True,
    )

    print("4. Reconstruyendo archivos PDB finales con conectividades RDKit (CONECT)...")
    mol_orig = Chem.MolFromMolFile(
        "01_estructuras_iniciales/protac.sdf", removeHs=False
    )
    conf_orig = mol_orig.GetConformer()
    orig_xyz = np.array(
        [
            [
                conf_orig.GetAtomPosition(i).x,
                conf_orig.GetAtomPosition(i).y,
                conf_orig.GetAtomPosition(i).z,
            ]
            for i in range(mol_orig.GetNumAtoms())
        ]
    )

    pq_to_rd = {}
    with open("02_preparacion_pdbqt/ligando_protac.pdbqt", encoding="utf-8") as f:
        for line in f:
            if line.startswith("ATOM") or line.startswith("HETATM"):
                pq_idx = int(line[6:11].strip())
                xyz = np.array(
                    [float(line[30:38]), float(line[38:46]), float(line[46:54])]
                )
                pq_to_rd[pq_idx] = int(np.argmin(np.linalg.norm(orig_xyz - xyz, axis=1)))

    pq_refined = {}
    with open(prot_ternario_out, encoding="utf-8") as f:
        for line in f:
            if line.startswith("ATOM") or line.startswith("HETATM"):
                idx = int(line[6:11].strip())
                pq_refined[idx] = np.array(
                    [float(line[30:38]), float(line[38:46]), float(line[46:54])]
                )

    protac_pdb_block = build_rdkit_pdb_block(mol_orig, pq_to_rd, pq_refined)
    with open(
        "04_complejo_ternario_final/protac_en_complejo.pdb", "w", encoding="utf-8"
    ) as f:
        f.write(protac_pdb_block)

    with open(
        "04_complejo_ternario_final/complejo_ternario_limpio.pdb", "w", encoding="utf-8"
    ) as f:
        f.write(
            "HEADER    COMPLEJO TERNARIO PPI-OPTIMIZADO HSP90(14-223)-PROTAC-VHL(10-158)\n"
        )
        f.writelines(hsp_ntd_lines)
        f.write("TER\n")
        for l, xyz in zip(vhl_core_lines, vhl_opt):
            f.write(
                l[:21]
                + "B"
                + l[22:30]
                + f"{xyz[0]:8.3f}{xyz[1]:8.3f}{xyz[2]:8.3f}"
                + l[54:]
            )
        f.write("TER\n")
        f.write(protac_pdb_block)

    with open(
        "04_complejo_ternario_final/complejo_ternario_completo.pdb",
        "w",
        encoding="utf-8",
    ) as f:
        f.write("HEADER    COMPLEJO TERNARIO PPI-OPTIMIZADO HSP90-PROTAC-VHL\n")
        f.writelines(hsp_full_lines)
        f.write("TER\n")
        for l, xyz in zip(vhl_full_lines, vhl_full_opt):
            f.write(
                l[:21]
                + "B"
                + l[22:30]
                + f"{xyz[0]:8.3f}{xyz[1]:8.3f}{xyz[2]:8.3f}"
                + l[54:]
            )
        f.write("TER\n")
        f.write(protac_pdb_block)

    print("   ✓ Completado en 04_complejo_ternario_final/")


if __name__ == "__main__":
    main()

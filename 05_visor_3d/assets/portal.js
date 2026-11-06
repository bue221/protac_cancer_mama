function statusLabel(status) {
  if (status === "pass") return "PASS";
  if (status === "warn") return "WARN";
  return "FAIL";
}

function verdictClass(nivel) {
  if (nivel === "viable_modular_en_papel") return "pass";
  if (nivel === "viable_con_reservas") return "warn";
  return "fail";
}

function verdictTitle(nivel) {
  const map = {
    viable_modular_en_papel: "Viable modular (en papel)",
    viable_con_reservas: "Viable con reservas",
    no_viable_computacionalmente: "No viable computacionalmente",
  };
  return map[nivel] || nivel;
}

async function loadViabilidad(targetIds) {
  const root = document.getElementById(targetIds.root);
  if (!root) return;

  try {
    if (window.VIABILIDAD_DATA) {
      renderViabilidad(window.VIABILIDAD_DATA, targetIds);
      return;
    }
    const res = await fetch("data/viabilidad_laboratorio.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderViabilidad(data, targetIds);
  } catch (err) {
    root.innerHTML = `<p class="loading">No se pudo cargar el reporte.
      Ejecuta <code>./.venv/bin/python3 scripts/04_viabilidad_laboratorio.py</code>
      desde la raíz del repo. (${err.message})</p>`;
  }
}

function renderViabilidad(data, ids) {
  const v = data.veredicto;
  const props = data.propiedades;
  const cls = verdictClass(v.nivel);

  const summary = document.getElementById(ids.summary);
  if (summary) {
    summary.innerHTML = `
      <div class="card">
        <span class="pill ${cls}">${verdictTitle(v.nivel)}</span>
        <p style="margin-top:12px;color:var(--text);line-height:1.5">${v.resumen}</p>
        <p style="margin-top:10px;font-size:0.88rem">
          Checklist: <b>${v.contadores.pass}</b> pass ·
          <b>${v.contadores.warn}</b> warn ·
          <b>${v.contadores.fail}</b> fail ·
          generado ${data.generated_at}
        </p>
        <p style="margin-top:10px;font-size:0.85rem">${data.disclaimer}</p>
      </div>
      <div class="card">
        <h2>Propiedades clave</h2>
        <div class="metrics" style="margin-top:12px">
          <div class="metric"><span>Fórmula</span><b style="font-size:0.95rem">${props.formula}</b></div>
          <div class="metric"><span>MW</span><b>${props.mw}</b></div>
          <div class="metric"><span>cLogP</span><b>${props.clogp}</b></div>
          <div class="metric"><span>TPSA</span><b>${props.tpsa}</b></div>
          <div class="metric"><span>SA Score</span><b>${props.sa_score}</b></div>
          <div class="metric"><span>QED</span><b>${props.qed}</b></div>
          <div class="metric"><span>Rotables</span><b>${props.rotatable_bonds}</b></div>
          <div class="metric"><span>Átomos pesados</span><b>${props.heavy_atoms}</b></div>
        </div>
      </div>`;
  }

  const list = document.getElementById(ids.checks);
  if (list) {
    list.innerHTML = data.checks
      .map((c) => {
        const ruta =
          c.ruta_sugerida && c.ruta_sugerida.length
            ? `<ol class="steps">${c.ruta_sugerida.map((s) => `<li>${s}</li>`).join("")}</ol>`
            : "";
        return `<article class="check">
          <header>
            <h3>${c.titulo}</h3>
            <span class="pill ${c.status}">${statusLabel(c.status)}</span>
          </header>
          <p>${c.detalle}</p>
          ${ruta}
        </article>`;
      })
      .join("");
  }

  const mini = document.getElementById(ids.mini);
  if (mini) {
    mini.innerHTML = `
      <span class="pill ${cls}">${verdictTitle(v.nivel)}</span>
      <p style="margin:10px 0 0;color:var(--muted);font-size:0.92rem;line-height:1.45">
        SA ${props.sa_score} · MW ${props.mw} · ${v.contadores.pass}/${v.contadores.total} checks en pass.
        <a class="more" href="viabilidad.html">Ver checklist completo →</a>
      </p>`;
  }
}

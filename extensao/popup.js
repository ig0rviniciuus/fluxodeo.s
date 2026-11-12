(function () {
  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const normalizar = (t) => (t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const plural = (d) => d === 0 ? "hoje" : d === 1 ? "há 1 dia" : "há " + d + " dias";

  /* ---------- Avisos e cópia ---------- */
  function avisar(msg) {
    const a = $("aviso"); a.textContent = msg; a.classList.add("on");
    clearTimeout(avisar._t); avisar._t = setTimeout(() => a.classList.remove("on"), 1500);
  }
  async function copiar(texto, rotulo) {
    try { await navigator.clipboard.writeText(texto); avisar("Copiado: " + (rotulo || texto)); }
    catch (e) { avisar("Não foi possível copiar. Selecione o texto manualmente."); }
  }
  function tornarCopiavel(node, texto, rotulo, titulo) {
    node.classList.add("copiavel"); node.tabIndex = 0; node.title = titulo || "Clique para copiar";
    node.addEventListener("click", (e) => { e.stopPropagation(); copiar(texto, rotulo); });
    node.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); copiar(texto, rotulo); } });
  }

  // Máscara: copia o título em maiúsculas + o modelo de descrição
  function baseMascara(m) {
    return m.replace(/\s*-?\s*SAC\s+Suporte\s*$/i, "").trim().toUpperCase();
  }
  function textoMascara(m, tipoKey) {
    const base = baseMascara(m);
    const linhas = (MODELOS_POR_TIPO[tipoKey] || {})[base] || MODELOS_MASCARA[base];
    const corpo = linhas ? linhas.map((l) => l.trimEnd()).join("\n") : MODELO_DESCRICAO;
    return base + " - SAC SUPORTE\n" + corpo;
  }
  function mascaraCopiavel(node, m, tipoKey) {
    const titulo = baseMascara(m) + " - SAC SUPORTE";
    node.classList.add("masc-copia");
    tornarCopiavel(node, textoMascara(m, tipoKey), titulo + " (com o modelo da descrição)",
      "Clique para copiar o título e o modelo da descrição");
  }

  /* ---------- Abas ---------- */
  const abas = ["calc", "fluxo", "masc", "ajuda"];
  document.querySelectorAll(".aba").forEach((b) => b.addEventListener("click", () => {
    document.querySelectorAll(".aba").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
    abas.forEach((p) => { $("painel-" + p).hidden = p !== b.dataset.aba; });
  }));

  /* ---------- Boas-vindas (só na primeira vez) ---------- */
  try {
    if (!localStorage.getItem("fluxoos-boasvindas-ok")) $("boas-vindas").hidden = false;
  } catch (e) { $("boas-vindas").hidden = false; }
  $("fechar-boas-vindas").addEventListener("click", () => {
    $("boas-vindas").hidden = true;
    try { localStorage.setItem("fluxoos-boasvindas-ok", "1"); } catch (e) {}
  });

  /* ---------- Calculadora ---------- */
  const $tipo = $("f-tipo"), $masc = $("f-masc"), $data = $("f-data"), $prob = $("f-problema");
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const iso = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  $data.max = iso(hoje);

  $tipo.appendChild(new Option("Selecione…", ""));
  const gOutras = document.createElement("optgroup"); gOutras.label = "Outros atendimentos";
  Object.entries(TIPOS_SO_ULTIMA).forEach(([k, v]) => gOutras.appendChild(new Option(v.nome, k)));
  const gAbertas = document.createElement("optgroup"); gAbertas.label = "O.S do SAC Suporte";
  const gEquip = document.createElement("optgroup"); gEquip.label = "Equipamento danificado (Comodato Danificado)";
  Object.entries(TIPOS_OS).forEach(([k, v]) => (v.grupo === "equip" ? gEquip : gAbertas).appendChild(new Option(v.nome, k)));
  $tipo.append(gAbertas, gEquip, gOutras);

  $prob.appendChild(new Option("Selecione…", ""));
  PROBLEMAS.forEach((p) => $prob.appendChild(new Option(p.nome, p.nome)));

  function diasDesde(v) {
    const [a, m, d] = v.split("-").map(Number);
    return Math.round((hoje - new Date(a, m - 1, d)) / 86400000);
  }

  // Renumera os passos visíveis (1, 2, 3…)
  function numerar() {
    let n = 0;
    document.querySelectorAll("#form .passo").forEach((p) => {
      if (p.hidden) return;
      p.querySelector(".num").textContent = ++n;
    });
  }

  function atualizarMascaras() {
    const t = TIPOS_OS[$tipo.value];
    $masc.innerHTML = "";
    const tem = t && t.mascaras.length > 1;
    $("passo-masc").hidden = !tem || (typeof modoPreventivo === "function" && modoPreventivo());
    if (tem) {
      t.mascaras.filter((m) => !/^outros/i.test(m)).forEach((m) => $masc.appendChild(new Option(m, m)));
      $masc.appendChild(new Option("Outros", ""));
      $masc.value = "";
    }
    numerar();
  }

  function atualizarPrazo() {
    const p = $("prazo");
    if (document.querySelector('input[name="inativo"]:checked').value === "sim") { $("bloco-problema").hidden = true; numerar(); return; }
    if (!$data.value) { p.hidden = true; $("bloco-problema").hidden = true; numerar(); return; }
    const d = diasDesde($data.value);
    p.hidden = false;
    if (d < 0) {
      p.className = "prazo ruim"; p.textContent = "Data no futuro. Confira.";
      $("bloco-problema").hidden = true;
    } else if (d <= 60) {
      p.className = "prazo ok";
      p.textContent = cap(plural(d)) + ": dentro do prazo.";
      $("bloco-problema").hidden = true; $prob.value = "";
    } else {
      p.className = "prazo alerta";
      p.textContent = cap(plural(d)) + ": passou de 60 dias, o fluxo recomeça.";
      $("bloco-problema").hidden = false;
    }
    numerar();
  }

  const modoPreventivo = () => document.querySelector('input[name="inativo"]:checked').value === "sim";
  function atualizarPreventivo() {
    const prev = modoPreventivo();
    $("passo-prev-2").hidden = !prev;
    document.querySelectorAll("#form .passo.hist").forEach((p) => { p.dataset.oculto = prev ? "1" : ""; });
    if (prev) {
      document.querySelectorAll("#form .passo.hist").forEach((p) => { p.hidden = true; });
    } else {
      $("passo-1").hidden = false; $("passo-data").hidden = false;
      document.querySelectorAll('input[name="prev"]').forEach((r) => { r.checked = false; });
      atualizarMascaras(); atualizarPrazo();
    }
    $("erro").hidden = true; $("resultado").hidden = true;
    numerar();
  }
  document.querySelectorAll('input[name="inativo"]').forEach((r) => r.addEventListener("change", atualizarPreventivo));

  $tipo.addEventListener("change", () => { atualizarMascaras(); $("erro").hidden = true; });
  $data.addEventListener("change", atualizarPrazo);
  $data.addEventListener("input", atualizarPrazo);
  atualizarMascaras();

  function mostrarErro(msg, campo) {
    const e = $("erro"); e.textContent = msg; e.hidden = false; $("resultado").hidden = true; campo.focus();
  }

  $("form").addEventListener("submit", (e) => {
    e.preventDefault();
    $("erro").hidden = true;
    const canc = document.querySelector('input[name="canc"]:checked').value;
    if (modoPreventivo()) {
      const sel = document.querySelector('input[name="prev"]:checked');
      if (!sel) return mostrarErro("Escolha o que foi identificado.", document.querySelector('input[name="prev"]'));
      const resP = decidirProximaOS({ cancelamento: canc, preventiva: sel.value, dias: null });
      return mostrarResultado(resP, null);
    }
    if (!$tipo.value) return mostrarErro("Escolha a última O.S.", $tipo);
    if (!$data.value) return mostrarErro("Informe a data.", $data);
    const dias = diasDesde($data.value);
    if (dias < 0) return mostrarErro("Data no futuro. Confira.", $data);

    const res = decidirProximaOS({ tipo: $tipo.value, mascara: $masc.value || null, dias, cancelamento: canc, problema: $prob.value || null });
    if (res.pedirProblema) return mostrarErro("Escolha o problema atual.", $prob);
    mostrarResultado(res, dias);
  });

  $("form").addEventListener("reset", () => {
    setTimeout(() => { atualizarPreventivo(); $("resultado").hidden = true; $("erro").hidden = true; }, 0);
  });

  function mostrarResultado(res, dias) {
    const tipo = TIPOS_OS[res.tipo];
    const box = $("resultado"); box.innerHTML = ""; box.hidden = false;
    box.className = "resultado " + tipo.cor;

    box.appendChild(el("p", "res-rotulo", "Abra esta O.S:"));
    const nome = el("p", "res-nome", tipo.nome); tornarCopiavel(nome, tipo.nome); box.appendChild(nome);
    box.appendChild(el("p", "res-texto suave", res.motivo + (dias === null ? "" : " Última O.S " + plural(dias) + ".")));

    // Máscara
    const bloco = el("div", "res-bloco");
    let selecionada = res.mascara;
    const btn = el("button", "btn btn-copiar"); btn.type = "button";
    const legenda = el("p", "res-acao-dica");

    function atualizarBotao() {
      btn.disabled = !selecionada;
      btn.textContent = selecionada ? "Copiar máscara " + baseMascara(selecionada) + " - SAC SUPORTE" : "Copiar máscara";
      legenda.textContent = selecionada ? "Cole na O.S e preencha os campos." : "Escolha a máscara do problema acima.";
    }
    function selecionar(mm, node) {
      selecionada = mm;
      bloco.querySelectorAll(".tag.sel").forEach((x) => x.classList.remove("sel"));
      node.classList.add("sel");
      atualizarBotao();
    }

    if (res.mascara) {
      bloco.appendChild(el("p", "res-sub", "Máscara"));
      const m = el("span", "tag destaque", res.mascara); mascaraCopiavel(m, res.mascara, res.tipo); bloco.appendChild(m);
    } else {
      bloco.appendChild(el("p", "res-sub", "Qual o problema do cliente?"));
      const wrap = el("div", "tags");
      tipo.mascaras.forEach((mm) => {
        const t = el("span", "tag", mm); mascaraCopiavel(t, mm, res.tipo);
        t.addEventListener("click", () => selecionar(mm, t));
        t.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") selecionar(mm, t); });
        wrap.appendChild(t);
      });
      bloco.appendChild(wrap);
    }
    box.appendChild(bloco);

    btn.addEventListener("click", () => {
      if (!selecionada) return;
      copiar(textoMascara(selecionada, res.tipo), baseMascara(selecionada) + " - SAC SUPORTE (com o modelo da descrição)");
      btn.classList.add("feito"); btn.textContent = "Máscara copiada ✓";
      setTimeout(() => { btn.classList.remove("feito"); atualizarBotao(); }, 1500);
    });
    atualizarBotao();
    const acao = el("div", "res-acao"); acao.append(btn, legenda); box.appendChild(acao);

    const sug = el("button", "link link-sug", "Falta algum caso? Envie uma sugestão");
    sug.type = "button";
    sug.addEventListener("click", irParaSugestao);
    box.appendChild(sug);

    box.scrollIntoView({ block: "nearest" });
  }

  function irParaSugestao() {
    document.querySelector('.aba[data-aba="ajuda"]').click();
    $("sugestao").scrollIntoView({ block: "start" });
    $("s-texto").focus();
  }

  /* ---------- Fluxo ---------- */
  $("regra-geral").textContent = REGRA_GERAL.replace(/^\s*regra geral:\s*/i, "");
  let filtro = "todas";
  const usados = [...new Set(FLUXO.map((f) => f.proxima))];
  [["todas", "Todas"], ...usados.map((k) => [k, TIPOS_OS[k].nome])].forEach(([chave, rotulo]) => {
    const b = el("button", "chip", rotulo); b.type = "button"; b.dataset.tipo = chave;
    b.setAttribute("aria-pressed", String(chave === filtro));
    b.addEventListener("click", () => {
      filtro = chave;
      document.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.tipo === filtro)));
      renderFluxo();
    });
    $("filtros").appendChild(b);
  });

  function renderFluxo() {
    const termo = normalizar($("busca").value.trim());
    const lista = $("lista"); lista.innerHTML = ""; let total = 0;
    FLUXO.forEach((item) => {
      const tipo = TIPOS_OS[item.proxima]; if (!tipo) return;
      if (filtro !== "todas" && item.proxima !== filtro) return;
      const alvo = normalizar([item.situacao, item.prazo, item.nota, item.excecao, item.mascara, tipo.nome].join(" "));
      if (termo && !termo.split(/\s+/).every((p) => alvo.includes(p))) return;
      total++;
      const li = el("li", "item");
      const sit = el("div", "situacao", item.situacao);
      const extras = [item.prazo, item.nota].filter(Boolean).join(" — ");
      if (extras) sit.appendChild(el("span", "meta", extras));
      const liga = el("div", "liga"); liga.setAttribute("aria-hidden", "true");
      const dest = el("div", "destino " + tipo.cor, tipo.nome);
      tornarCopiavel(dest, tipo.nome);
      if (item.mascara) {
        const dm = el("span", "dest-masc", item.mascara);
        if (item.mascara !== "Conforme o problema" && item.mascara.indexOf(",") < 0) mascaraCopiavel(dm, item.mascara, item.proxima);
        dest.appendChild(dm);
      }
      li.append(sit, liga, dest);
      if (item.excecao) li.appendChild(el("div", "excecao", item.excecao));
      lista.appendChild(li);
    });
    $("vazio").hidden = total > 0;
  }
  $("busca").addEventListener("input", renderFluxo);
  renderFluxo();

  /* ---------- Tipos de O.S ---------- */
  Object.entries(TIPOS_OS).forEach(([k, t]) => {
    const card = el("div", "masc-card " + t.cor);
    const h = el("h2", "masc-titulo", t.nome); tornarCopiavel(h, t.nome); card.appendChild(h);
    if (AJUDA_TIPOS[k]) card.appendChild(el("p", "masc-ajuda", AJUDA_TIPOS[k]));
    card.appendChild(el("p", "masc-rot", t.mascaras.length > 1 ? "Máscaras:" : "Máscara:"));
    const wrap = el("div", "tags");
    t.mascaras.forEach((m) => { const tg = el("span", "tag", m); mascaraCopiavel(tg, m, k); wrap.appendChild(tg); });
    card.appendChild(wrap); $("mascaras").appendChild(card);
  });

  /* ---------- Glossário ---------- */
  GLOSSARIO.forEach(([termo, def]) => {
    $("glossario").append(el("dt", null, termo), el("dd", null, def));
  });

  /* ---------- Sugestões ---------- */
  $("form-sug").addEventListener("submit", async (e) => {
    e.preventDefault();
    const st = $("s-status");
    const texto = $("s-texto").value.trim();
    const status = (msg, ok) => { st.textContent = msg; st.className = "sug-status " + (ok ? "ok" : "ruim"); st.hidden = false; };
    if (!texto) { status("Escreva a sugestão antes de enviar.", false); $("s-texto").focus(); return; }

    const dados = {
      tipo: $("s-tipo").value,
      texto,
      nome: $("s-nome").value.trim(),
      versao: (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getManifest) ? chrome.runtime.getManifest().version : "",
      data: new Date().toISOString()
    };
    const corpo = "Tipo: " + dados.tipo + "\nNome: " + (dados.nome || "-") + "\nVersão: " + dados.versao + "\n\n" + dados.texto;

    if (SUGESTAO_WEBHOOK) {
      try {
        const r = await fetch(SUGESTAO_WEBHOOK, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dados) });
        if (!r.ok) throw new Error(r.status);
        status("Sugestão enviada. Obrigado!", true);
        $("s-texto").value = "";
      } catch (err) {
        await copiar(corpo, "sugestão");
        status("Não foi possível enviar. A sugestão foi copiada: envie para seu supervisor.", false);
      }
    } else if (SUGESTAO_EMAIL) {
      const url = "mailto:" + SUGESTAO_EMAIL + "?subject=" + encodeURIComponent("Sugestão – Fluxo de O.S") + "&body=" + encodeURIComponent(corpo);
      window.open(url);
      status("Seu e-mail foi aberto com a sugestão. É só enviar.", true);
    } else {
      await copiar(corpo, "sugestão");
      status("Sugestão copiada. Envie para seu supervisor.", true);
    }
  });
})();

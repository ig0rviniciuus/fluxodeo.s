/*
 * CARREGADOR — busca o fluxo.json (regras, tipos e máscaras) no GitHub ao abrir a extensão.
 * Ordem: 1) versão online  2) última cópia salva neste computador  3) cópia que veio na instalação.
 * Assim as regras se atualizam sem reinstalar, e a extensão funciona mesmo sem internet.
 */
(async function () {
  const CHAVE = "fluxoos-dados";
  const valido = (d) => d && d.TIPOS_OS && d.TIPOS_SO_ULTIMA && Array.isArray(d.REGRAS) && Array.isArray(d.FLUXO) &&
    Array.isArray(d.PROBLEMAS) && d.MODELOS_MASCARA && d.AJUDA_TIPOS;
  const maisNovo = (a, b) => (!b ? a : !a ? b : (String(a.versao) >= String(b.versao) ? a : b));

  let dados = null, origem = "", erroOnline = false;

  // 1) Online (GitHub Pages)
  if (typeof FLUXO_URL === "string" && FLUXO_URL) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4000);
      const r = await fetch(FLUXO_URL + "?t=" + Date.now(), { cache: "no-store", signal: ctrl.signal });
      clearTimeout(t);
      if (r.ok) {
        const d = await r.json();
        if (!valido(d)) erroOnline = true;
        else {
          dados = d; origem = "online";
          try { localStorage.setItem(CHAVE, JSON.stringify(d)); } catch (e) {}
        }
      }
    } catch (e) { if (e instanceof SyntaxError) erroOnline = true; /* senão: sem conexão */ }
  }

  // 2) Cópia salva e 3) cópia da instalação — usa a mais nova das duas
  if (!dados) {
    let salva = null, local = null;
    try { const s = JSON.parse(localStorage.getItem(CHAVE)); if (valido(s)) salva = s; } catch (e) {}
    try { const r = await fetch("fluxo.json"); const d = await r.json(); if (valido(d)) local = d; } catch (e) {}
    dados = maisNovo(salva, local);
    origem = dados === salva ? "salva" : "local";
  }

  const status = document.getElementById("status-dados");
  if (!dados) {
    status.textContent = "Não foi possível carregar as regras. Fale com seu supervisor.";
    status.className = "status-dados ruim";
    return;
  }

  ["TIPOS_OS", "TIPOS_SO_ULTIMA", "REGRA_GERAL", "PROBLEMAS", "FLUXO", "AJUDA_TIPOS", "GLOSSARIO",
   "MODELO_DESCRICAO", "MODELOS_MASCARA", "MODELOS_POR_TIPO", "REGRAS"].forEach((k) => { globalThis[k] = dados[k]; });

  status.textContent = origem === "online"
    ? "Regras atualizadas · versão " + dados.versao
    : (erroOnline ? "Regras online com erro" : "Sem conexão com o GitHub") + " · usando regras " + (origem === "salva" ? "salvas" : "da instalação") + " (versão " + dados.versao + ")";
  status.className = "status-dados " + (origem === "online" ? "ok" : "alerta");

  const s = document.createElement("script");
  s.src = "popup.js";
  document.body.appendChild(s);
})();

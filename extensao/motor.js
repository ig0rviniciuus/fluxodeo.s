/*
 * MOTOR DE REGRAS — lê a lista REGRAS (vinda do fluxo.json) e decide a próxima O.S.
 * As regras são avaliadas de cima para baixo; a primeira que se aplicar vale.
 * Este arquivo não precisa ser editado para mudar regras: edite o fluxo.json.
 *
 * Condições possíveis em "se" (todas precisam ser verdadeiras):
 *   tipo: [lista de tipos]      grupo: "equip"            mascara: [lista de máscaras]
 *   diasMin / diasMax: número   cancelamento: "direto" | "indireto"
 *   preventiva: "los" | "pon" | "qualquer"
 * Resultado em "entao": { tipo, mascara, motivo }  ou  { doProblema: true, motivo }
 *   No motivo, {tipo} vira o nome da última O.S e {problema} o problema atual.
 */
function nomeTipo(chave) {
  return (TIPOS_OS[chave] || TIPOS_SO_ULTIMA[chave] || { nome: chave }).nome;
}

function condicaoAtende(se, c) {
  se = se || {};
  if (se.cancelamento && c.cancelamento !== se.cancelamento) return false;
  if (se.preventiva) {
    if (!c.preventiva) return false;
    if (se.preventiva !== "qualquer" && c.preventiva !== se.preventiva) return false;
  }
  if (se.tipo && !se.tipo.includes(c.tipo)) return false;
  if (se.grupo && !(TIPOS_OS[c.tipo] && TIPOS_OS[c.tipo].grupo === se.grupo)) return false;
  if (se.mascara && !se.mascara.includes(c.mascara)) return false;
  if (se.diasMax != null && !(c.dias !== null && c.dias !== undefined && c.dias <= se.diasMax)) return false;
  if (se.diasMin != null && !(c.dias !== null && c.dias !== undefined && c.dias >= se.diasMin)) return false;
  return true;
}

function decidirProximaOS(c) {
  c = Object.assign({ tipo: null, mascara: null, dias: null, cancelamento: "nao", problema: null, preventiva: null }, c);
  for (const regra of REGRAS) {
    if (!condicaoAtende(regra.se, c)) continue;
    const e = regra.entao || {};
    if (e.doProblema) {
      const p = PROBLEMAS.find((x) => x.nome === c.problema);
      if (!p) return { pedirProblema: true };
      return { tipo: p.tipo, mascara: p.mascara || null, motivo: (e.motivo || "").replace("{problema}", p.nome) };
    }
    return { tipo: e.tipo, mascara: e.mascara || null, motivo: (e.motivo || "").replace("{tipo}", nomeTipo(c.tipo)) };
  }
  return { tipo: "nivel1", mascara: null, motivo: "Nenhuma regra especial: use a máscara do problema." };
}

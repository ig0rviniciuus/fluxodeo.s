/*
 * REGRAS DA CALCULADORA — avaliadas de cima para baixo; a primeira que se aplicar vale.
 * Entrada: tipo da última O.S, máscara da última O.S (opcional), dias desde a última O.S
 * e se o cliente citou cancelamento ("nao", "indireto", "direto").
 * Saída: { tipo, mascara (sugerida, opcional), motivo }
 */
function decidirProximaOS({ tipo, mascara, dias, cancelamento, problema, preventiva }) {
  const r = (t, m, motivo) => ({ tipo: t, mascara: m || null, motivo });
  const ate = (n) => dias !== null && dias <= n;
  const FISC = "Fiscalização - SAC Suporte";

  // Cancelamento citado diretamente no contato atual
  if (cancelamento === "direto")
    return r("retencao", null, "Cliente pediu cancelamento.");

  // SUPORTE PREVENTIVO – cliente inativo ou não está no endereço
  if (preventiva) {
    if (preventiva === "los")
      return r("preventiva", "LOS", "Cliente inativo ou fora do endereço, com LOS.");
    if (preventiva === "pon")
      return r("preventiva", "PON Piscando", "Cliente inativo ou fora do endereço, com PON piscando.");
    return r("preventiva", "Outros - SAC Suporte", "Cliente inativo ou fora do endereço, sem vídeo nem relato.");
  }

  // REGRA GERAL – o fluxo só vale se a última O.S foi há até 60 dias
  // Depois disso, o fluxo é reiniciado pelo problema atual do cliente.
  if (dias !== null && dias > 60) {
    if (cancelamento === "indireto")
      return r("nivel1", "Propenso a Cancelamento", "Passou de 60 dias e o cliente deu a entender que quer cancelar.");
    const p = PROBLEMAS.find((x) => x.nome === problema);
    if (p)
      return r(p.tipo, p.mascara, "Passou de 60 dias: a O.S segue o problema atual (" + p.nome + ").");
    return { pedirProblema: true };
  }

  // Regra 7 – Nível I com máscara Propenso a Cancelamento → sempre Retenção
  if (tipo === "nivel1" && mascara === "Propenso a Cancelamento")
    return r("retencao", null, "Última O.S foi Propenso a Cancelamento.");

  // Regra 1 – ativação há até 2 dias
  if (tipo === "instalacao" && ate(2))
    return r("ativacao", null, "Ativação há até 3 dias.");

  // Exceção 3 – retenção volta para retenção
  if (tipo === "retencao")
    return r("retencao", null, "Última O.S foi Retenção.");

  // Exceção 4 – rede mesh volta para rede mesh
  if (tipo === "mesh")
    return r("mesh", "Suporte Rede Mesh - SAC Suporte", "Última O.S foi Rede Mesh.");

  // Fiscalização volta para fiscalização (também é a exceção da regra dos 2 dias)
  if (tipo === "fiscal")
    return r("fiscal", FISC, "Última O.S foi Fiscalização.");

  // Exceção 2 – mudança de endereço/local ou Nível II nos últimos 60 dias
  if (["mudancaendereco", "mudancalocal", "nivel2"].includes(tipo))
    return r("fiscal", FISC, "Última O.S foi " + nomeTipo(tipo) + ".");

  // Cancelamento citado de forma indireta / por humor
  if (cancelamento === "indireto")
    return r("nivel1", "Propenso a Cancelamento", "Cliente deu a entender que quer cancelar.");

  // Regras 3 e 4 – configuração realizada no SAC
  if (tipo === "configsac") {
    if (ate(15))
      return r("nivel1", "Rechamada", "Configuração no SAC há até 15 dias.");
    return r("nivel1", "Rechamada 60", "Configuração no SAC entre 16 e 60 dias.");
  }

  // Ativação Recente: contato em até 60 dias → Nível I – Instalou Recente
  if (tipo === "ativacao")
    return r("nivel1", "Instalou Recente", "Última O.S foi Ativação Recente.");

  // Nível I – Sem Acesso Remoto: contato em até 60 dias → Fiscalização
  if (tipo === "nivel1" && mascara === "Sem Acesso Remoto")
    return r("fiscal", FISC, "Última O.S foi Sem Acesso Remoto.");

  // Exceção 1 – suporte há até 2 dias
  if (ate(2))
    return r("recente", "Rechamada Externo - SAC Suporte", "Suporte há até 2 dias.");

  // Preventiva, equipamento danificado (máscara Comodato Danificado), Fibra Baixa e Fibra Danificada:
  // até 2 dias já caiu em Suporte Recente; de 3 a 60 dias → Fiscalização
  if (["preventiva", "fibrabaixa", "fibradanificada"].includes(tipo) || (TIPOS_OS[tipo] && TIPOS_OS[tipo].grupo === "equip"))
    return r("fiscal", FISC, "Última O.S foi " + nomeTipo(tipo) + " há mais de 2 dias.");

  // Ativação entre 3 e 60 dias
  if (tipo === "instalacao")
    return r("nivel1", "Instalou Recente", "Ativação entre 3 e 60 dias.");

  // Sequências que levam à Fiscalização (até 60 dias)
  if (tipo === "recente")
    return r("fiscal", FISC, "Última O.S foi Suporte Recente.");
  if (tipo === "nivel1" && mascara === "Rechamada Externo")
    return r("fiscal", FISC, "Última O.S foi Rechamada Externo.");
  if (tipo === "nivel1" && mascara === "Instalou Recente")
    return r("fiscal", FISC, "Última O.S foi Instalou Recente.");

  // Rechamada Externo – última O.S Nível I de 3 a 60 dias (até 2 dias já caiu em Suporte Recente)
  if (tipo === "nivel1")
    return r("nivel1", "Rechamada Externo", "Última O.S foi Nível I há mais de 2 dias.");

  // Padrão
  return r("nivel1", null, "Nenhuma regra especial: use a máscara do problema.");
}

function nomeTipo(chave) {
  return (TIPOS_OS[chave] || TIPOS_SO_ULTIMA[chave] || { nome: chave }).nome;
}

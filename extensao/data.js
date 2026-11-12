/*
 * FLUXO DE O.S — edite este arquivo para atualizar tipos, máscaras e fluxo.
 * As regras da calculadora ("Descobrir próxima O.S") ficam em regras.js.
 */

// Tipos de O.S que podem ser abertos, com as máscaras correspondentes
const TIPOS_OS = {
  nivel1: { nome: "O.S Nível I", cor: "nivel1", mascaras: [
    "Instalou Recente", "Rechamada 60", "Propenso a Cancelamento", "Quedas Constantes",
    "Sem Conexão", "Oscilação", "Velocidade Não Bate", "Lentidão", "Rechamada",
    "Rechamada Externo", "Equipamento Descolou", "Sem Acesso Remoto", "Outros - SAC Suporte"] },
  nivel2: { nome: "O.S Nível II", cor: "nivel2", mascaras: [
    "LOS", "PON Piscando", "Sinal Alto", "Outros - SAC Suporte"] },
  ativacao: { nome: "Ativação Recente", cor: "ativacao", mascaras: [
    "Quedas Constantes", "Sem Conexão", "Oscilação", "Velocidade Não Bate", "Lentidão",
    "Equipamento Descolou", "LOS", "PON Piscando", "Sinal Alto", "Outros - SAC Suporte"] },
  retencao: { nome: "Suporte Retenção", cor: "retencao", mascaras: [
    "Quedas Constantes", "Sem Conexão", "Oscilação", "Velocidade Não Bate", "Lentidão",
    "Equipamento Descolou", "LOS", "PON Piscando", "Sinal Alto", "Outros - SAC Suporte"] },
  recente: { nome: "O.S Suporte Recente", cor: "recente", mascaras: [
    "Rechamada Externo - SAC Suporte"] },
  fibrabaixa: { nome: "Fibra Baixa", cor: "outros", mascaras: ["Fibra Baixa - SAC Suporte"] },
  preventiva: { nome: "O.S Preventiva", cor: "outros", mascaras: ["LOS", "PON Piscando", "Outros - SAC Suporte"] },
  conector:      { nome: "Conector Danificado",          cor: "outros", grupo: "equip", mascaras: ["Comodato Danificado - SAC Suporte"] },
  trocafonte:    { nome: "Troca de Fonte",               cor: "outros", grupo: "equip", mascaras: ["Comodato Danificado - SAC Suporte"] },
  trocaroteador: { nome: "Troca de Roteador Danificado", cor: "outros", grupo: "equip", mascaras: ["Comodato Danificado - SAC Suporte"] },
  trocaonu:      { nome: "Troca de ONU Danificada",      cor: "outros", grupo: "equip", mascaras: ["Comodato Danificado - SAC Suporte"] },
  trocaequip:    { nome: "Troca de Equipamentos",        cor: "outros", grupo: "equip", mascaras: ["Comodato Danificado - SAC Suporte"] },
  fibradanificada: { nome: "Fibra Danificada", cor: "outros", mascaras: ["Fibra Danificada - SAC Suporte"] },
  fiscal: { nome: "Fiscalização", cor: "fiscal", mascaras: ["Fiscalização - SAC Suporte"] },
  mesh: { nome: "Suporte Rede Mesh", cor: "mesh", mascaras: ["Suporte Rede Mesh - SAC Suporte"] }
};

// Tipos que só aparecem como "última O.S" (não são abertos pelo SAC Suporte)
const TIPOS_SO_ULTIMA = {
  configsac:        { nome: "Configuração no SAC" },
  instalacao:       { nome: "Ativação / Instalação" },
  mudancaendereco:  { nome: "Mudança de Endereço" },
  mudancalocal:     { nome: "Mudança de Local" }
};

// Regra geral exibida no topo da aba "Fluxo"
const REGRA_GERAL = "o fluxo vale até 60 dias da última O.S. Depois disso, recomeça pelo problema atual.";

// Problemas atuais — usados quando o fluxo é reiniciado (última O.S há mais de 60 dias)
const PROBLEMAS = [
  { nome: "Quedas constantes",     tipo: "nivel1",          mascara: "Quedas Constantes" },
  { nome: "Sem conexão",           tipo: "nivel1",          mascara: "Sem Conexão" },
  { nome: "Oscilação",             tipo: "nivel1",          mascara: "Oscilação" },
  { nome: "Velocidade não bate",   tipo: "nivel1",          mascara: "Velocidade Não Bate" },
  { nome: "Lentidão",              tipo: "nivel1",          mascara: "Lentidão" },
  { nome: "Equipamento descolou",  tipo: "nivel1",          mascara: "Equipamento Descolou" },
  { nome: "Sem acesso remoto",     tipo: "nivel1",          mascara: "Sem Acesso Remoto" },
  { nome: "LOS",                   tipo: "nivel2",          mascara: "LOS" },
  { nome: "PON piscando",          tipo: "nivel2",          mascara: "PON Piscando" },
  { nome: "Sinal alto",            tipo: "nivel2",          mascara: "Sinal Alto" },
  { nome: "Fibra baixa",           tipo: "fibrabaixa",      mascara: "Fibra Baixa - SAC Suporte" },
  { nome: "Fibra danificada",      tipo: "fibradanificada", mascara: "Fibra Danificada - SAC Suporte" },
  { nome: "Conector danificado",   tipo: "conector",        mascara: "Comodato Danificado - SAC Suporte" },
  { nome: "Troca de fonte",        tipo: "trocafonte",        mascara: "Comodato Danificado - SAC Suporte" },
  { nome: "Roteador danificado",   tipo: "trocaroteador",        mascara: "Comodato Danificado - SAC Suporte" },
  { nome: "ONU danificada",        tipo: "trocaonu",        mascara: "Comodato Danificado - SAC Suporte" },
  { nome: "Troca de equipamentos", tipo: "trocaequip",        mascara: "Comodato Danificado - SAC Suporte" },
  { nome: "Problema na rede mesh", tipo: "mesh",            mascara: "Suporte Rede Mesh - SAC Suporte" },
  { nome: "Outros",                tipo: "nivel1",          mascara: "Outros - SAC Suporte" }
];

// Fluxo de referência (aba "Fluxo")
const FLUXO = [
  { situacao: "Cliente inativo ou não está no endereço", prazo: "", proxima: "preventiva", mascara: "LOS, PON Piscando ou Outros",
    nota: "LOS: alarme no OLTZ ou vídeo/verbalizou LOS · PON: vídeo/verbalizou PON piscando · Nenhum dos dois: Outros" },
  { situacao: "Configuração no SAC realizada", prazo: "Contato em até 15 dias", proxima: "nivel1", mascara: "Rechamada" },
  { situacao: "Configuração no SAC realizada", prazo: "Contato a partir de 16 dias (até 60)", proxima: "nivel1", mascara: "Rechamada 60" },
  { situacao: "O.S Nível I realizada", prazo: "De 3 a 60 dias", proxima: "nivel1", mascara: "Rechamada Externo",
    excecao: "Até 2 dias: Suporte Recente. Rechamada Externo, Instalou Recente e Sem Acesso Remoto seguem suas próprias regras" },
  { situacao: "O.S de Rechamada Externo realizada", prazo: "Até 60 dias", proxima: "fiscal", mascara: "Fiscalização - SAC Suporte" },
  { situacao: "O.S Nível I – Sem Acesso Remoto realizada", prazo: "Até 60 dias", proxima: "fiscal", mascara: "Fiscalização - SAC Suporte" },
  { situacao: "O.S Preventiva realizada", prazo: "De 3 a 60 dias", proxima: "fiscal", mascara: "Fiscalização - SAC Suporte",
    excecao: "Até 2 dias: abra O.S Suporte Recente" },
  { situacao: "O.S de equipamento danificado", prazo: "De 3 a 60 dias",
    nota: "Conector, fonte, roteador, ONU ou troca de equipamentos (máscara Comodato Danificado)",
    proxima: "fiscal", mascara: "Fiscalização - SAC Suporte", excecao: "Até 2 dias: abra O.S Suporte Recente" },
  { situacao: "O.S Fibra Baixa ou Fibra Danificada realizada", prazo: "De 3 a 60 dias", proxima: "fiscal", mascara: "Fiscalização - SAC Suporte",
    excecao: "Até 2 dias: abra O.S Suporte Recente" },
  { situacao: "O.S de Fiscalização realizada", prazo: "Até 60 dias", proxima: "fiscal", mascara: "Fiscalização - SAC Suporte" },
  { situacao: "O.S de Ativação realizada", prazo: "Há até 2 dias", proxima: "ativacao", mascara: "Conforme o problema" },
  { situacao: "Cliente ativou em até 2 meses", prazo: "", nota: "Sinal OK", proxima: "nivel1", mascara: "Instalou Recente",
    excecao: "Se a ativação foi há até 2 dias, abra Ativação Recente" },
  { situacao: "O.S de Ativação Recente realizada", prazo: "Até 60 dias", proxima: "nivel1", mascara: "Instalou Recente" },
  { situacao: "O.S de Instalou Recente realizada", prazo: "Até 60 dias", proxima: "fiscal", mascara: "Fiscalização - SAC Suporte" },
  { situacao: "Cliente recebeu suporte", prazo: "Há até 2 dias", proxima: "recente", mascara: "Rechamada Externo - SAC Suporte",
    excecao: "Se a última O.S foi Fiscalização, abra Fiscalização" },
  { situacao: "O.S Suporte Recente realizada", prazo: "Até 60 dias", proxima: "fiscal", mascara: "Fiscalização - SAC Suporte" },
  { situacao: "Suporte Nível II realizado", prazo: "Até 60 dias", proxima: "fiscal", mascara: "Fiscalização - SAC Suporte" },
  { situacao: "Mudança de endereço realizada", prazo: "Até 60 dias", proxima: "fiscal", mascara: "Fiscalização - SAC Suporte" },
  { situacao: "Mudança de local realizada", prazo: "Até 60 dias", proxima: "fiscal", mascara: "Fiscalização - SAC Suporte" },
  { situacao: "Suporte Rede Mesh realizado", prazo: "Até 60 dias", proxima: "mesh", mascara: "Suporte Rede Mesh - SAC Suporte",
    excecao: "Se a última O.S foi Suporte Retenção, abra Suporte Retenção" },
  { situacao: "Cliente cita cancelamento indiretamente / humor", prazo: "", proxima: "nivel1", mascara: "Propenso a Cancelamento" },
  { situacao: "O.S Nível I – Propenso a Cancelamento realizada", prazo: "Até 60 dias", nota: "A próxima é sempre Retenção",
    proxima: "retencao", mascara: "Conforme o problema" },
  { situacao: "Cliente cita cancelamento", prazo: "", proxima: "retencao", mascara: "Conforme o problema" },
  { situacao: "Suporte Retenção realizado", prazo: "Até 60 dias", proxima: "retencao", mascara: "Conforme o problema",
    excecao: "Se a última O.S foi Ativação, abra Ativação Recente" }
];

// Explicação de quando cada O.S é usada (aparece no resultado e na aba "Tipos de O.S")
const AJUDA_TIPOS = {
  nivel1: "Primeiro atendimento da maioria dos problemas e das rechamadas.",
  nivel2: "Problemas de sinal: LOS, PON piscando ou sinal alto.",
  ativacao: "Problema até 2 dias após a ativação.",
  retencao: "Cliente que pediu cancelamento ou já está na retenção.",
  recente: "Problema até 2 dias após um suporte.",
  fibrabaixa: "Problema identificado: fibra baixa.",
  preventiva: "Cliente inativo ou fora do endereço. LOS: alarme no OLTZ, vídeo ou relato. PON: vídeo ou relato. Sem vídeo e sem relato: Outros.",
  fibradanificada: "Fibra do cliente danificada.",
  conector: "Equipamento do cliente danificado. Máscara: Comodato Danificado.",
  trocafonte: "Equipamento do cliente danificado. Máscara: Comodato Danificado.",
  trocaroteador: "Equipamento do cliente danificado. Máscara: Comodato Danificado.",
  trocaonu: "Equipamento do cliente danificado. Máscara: Comodato Danificado.",
  trocaequip: "Equipamento do cliente danificado. Máscara: Comodato Danificado.",
  fiscal: "Verificação após visita recente da equipe de campo.",
  mesh: "Problemas na rede mesh. Rede mesh volta para rede mesh."
};

// Palavras que o operador novo pode não conhecer (aba "Ajuda")
const GLOSSARIO = [
  ["O.S", "Ordem de Serviço: o registro do atendimento."],
  ["Máscara", "O título da O.S (ex.: Lentidão, Rechamada 60)."],
  ["Rechamada", "Cliente volta com o mesmo problema após um atendimento."],
  ["Rechamada Externo", "Rechamada depois de uma visita da equipe de campo."],
  ["Configuração no SAC", "Ajuste feito pelo SAC à distância, sem O.S."],
  ["Prazo de 60 dias", "Passou de 60 dias da última O.S, o fluxo recomeça."],
  ["Cancelamento indireto", "Cliente dá sinais, sem pedir. Ex.: “vou trocar de provedor”."],
  ["Cancelamento direto", "Cliente pede para cancelar."]
];

// Modelo da descrição copiado junto com a máscara.
// O título (1ª linha) muda conforme a máscara; o restante é sempre igual.
const MODELO_DESCRICAO = [
  "*Problema do cliente : ",
  "*Modelo dos equipamentos: ",
  "*Disponibilidade:",
  "*Telefone:",
  "*Localização: ",
  "*Protocolo ou Telefone:"
].join("\n");

// Modelos de descrição por máscara. A chave é o título da máscara (sem "- SAC SUPORTE").
// Máscaras sem modelo aqui usam o MODELO_DESCRICAO padrão.
const L_PADRAO = ["*Problema do cliente : ", "*Modelo dos equipamentos: ", "*Disponibilidade:", "*Telefone:", "*Localização: ", "*Protocolo ou Telefone:"];
const L_PROTOCOLO = ["*Problema do cliente : ", "*Modelo dos equipamentos : ", "*Disponibilidade:", "*Telefone:", "*Localização: ", "*Protocolo:"];
const L_SEM_PROBLEMA = ["*Modelo dos equipamentos: ", "*Disponibilidade:", "*Telefone:", "*Localização: ", "*Protocolo:"];

const MODELOS_MASCARA = {
  "QUEDAS CONSTANTES":       L_PADRAO,
  "SEM CONEXÃO":             L_PADRAO,
  "OSCILAÇÃO":               L_PADRAO,
  "VELOCIDADE NÃO BATE":     L_PADRAO,
  "LENTIDÃO": [
    "*Problema do cliente : “Ex: Cliente com dificuldade de acesso nas aplicações WhatsApp, Instagram e Youtube.”",
    "*Modelo dos equipamentos : ", "*Disponibilidade:", "*Telefone:", "*Localização: ", "*Protocolo ou Telefone:"],
  "RECHAMADA":               L_PROTOCOLO,
  "RECHAMADA 60":            L_PROTOCOLO,
  "RECHAMADA EXTERNO":       L_PROTOCOLO,
  "EQUIPAMENTO DESCOLOU":    L_PADRAO,
  "OUTROS":                  L_PADRAO,
  "INSTALOU RECENTE":        L_PADRAO,
  "PROPENSO A CANCELAMENTO": L_PADRAO,
  "LOS":                     L_SEM_PROBLEMA,
  "PON PISCANDO":            L_SEM_PROBLEMA,
  "SINAL ALTO": [
    "*Problema do cliente: “REGISTRAR O SINAL NA DESCRIÇÃO”",
    "*Modelo dos equipamentos : ", "*Disponibilidade:", "*Telefone:", "*Localização: ", "*Protocolo:"],
  "SUPORTE REDE MESH":       L_PADRAO,
  "FISCALIZAÇÃO":            L_PADRAO,
  "COMODATO DANIFICADO": [
    "*Problema do cliente: ",
    "*Observação: Cliente ciente que a equipe realizará as verificações presencialmente no comodato danificado e verificará a possibilidade da cobrança.",
    "*Modelo dos equipamentos: ", "*Disponibilidade: ", "*Telefone:", "*Localização: ", "*Protocolo ou Telefone: "],
  "FIBRA DANIFICADA": [
    "*Problema do cliente: ",
    "*Observação: Cliente ciente que a equipe realizará as verificações presencialmente no comodato danificado e verificará a possibilidade da cobrança.",
    "*Modelo dos equipamentos: ", "*Disponibilidade: ", "*Telefone:", "*Localização: ", "*Protocolo ou Telefone: "],
  "SEM ACESSO REMOTO": [
    "*Problema do cliente: ", "*Modelo dos equipamentos: ", "*Disponibilidade:",
    "*Telefone:", "*Localização: ", "*Protocolo ou Telefone:"]
};

// Modelos que mudam conforme o TIPO de O.S (têm prioridade sobre MODELOS_MASCARA)
const MODELOS_POR_TIPO = {
  preventiva: {
    "LOS": [
      "*CLIENTE INATIVO (  ) OU CLIENTE NÃO ESTAVA NO ENDEREÇO (  )",
      "*ENVIOU VÍDEO OU VERBALIZOU LOS : (  ) SIM (  ) NÃO",
      "*ALARME NO OLTZ: ",
      "*Modelo dos equipamentos : ", "*Disponibilidade:", "*Telefone:", "*Localização: ", "*Protocolo:"],
    "PON PISCANDO": [
      "*CLIENTE INATIVO (  ) OU CLIENTE NÃO ESTAVA NO ENDEREÇO (  )",
      "*ENVIOU VÍDEO OU VERBALIZOU PON : (  ) SIM (  ) NÃO",
      "*ALARME NO OLTZ:",
      "*Modelo dos equipamentos : ", "*Disponibilidade:", "*Telefone:", "*Localização: ", "*Protocolo:"],
    "OUTROS": [
      "*CLIENTE INATIVO (  ) OU CLIENTE NÃO ESTAVA NO ENDEREÇO (  )",
      "*CLIENTE LOCALIZADO NO OLTZ (  ) SIM (  ) NÃO",
      "*CLIENTE VIA RÁDIO : (  ) SIM  (  ) NÃO",
      "*Problema do cliente: ", "*Modelo dos equipamentos: ", "*Disponibilidade: ",
      "*Telefone:", "*Localização: ", "*Protocolo ou Telefone:"]
  }
};

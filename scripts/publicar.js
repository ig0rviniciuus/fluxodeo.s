/*
 * Monta a extensão, assina o .crx e gera o updates.xml e a página de instalação.
 * Uso (no GitHub Actions): BASE_URL=https://usuario.github.io/repositorio node scripts/publicar.js
 * Requer o arquivo chave.pem na raiz (criado pelo workflow a partir do segredo).
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const RAIZ = path.resolve(__dirname, "..");
const ORIGEM = path.join(RAIZ, "extensao");
const BUILD = path.join(RAIZ, "build", "extensao");
const SITE = path.join(RAIZ, "site");
const CHAVE = path.join(RAIZ, "chave.pem");
const BASE = (process.env.BASE_URL || "").replace(/\/+$/, "");
const CRX3 = "crx3@2.0.0";

function falhar(msg) { console.error("::error::" + msg); process.exit(1); }
function compararVersao(a, b) {
  const pa = a.split(".").map(Number), pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d;
  }
  return 0;
}

(async () => {
  if (!BASE.startsWith("https://")) falhar("BASE_URL inválida: " + BASE);
  if (!fs.existsSync(CHAVE)) falhar("chave.pem não encontrada.");

  const manifest = JSON.parse(fs.readFileSync(path.join(ORIGEM, "manifest.json"), "utf8"));
  const versao = manifest.version;
  console.log("Versão a publicar:", versao);

  // Bloqueia publicação sem aumentar a versão (o Chrome só atualiza se a versão subir)
  try {
    const r = await fetch(BASE + "/updates.xml");
    if (r.ok) {
      const atual = ((await r.text()).match(/version="([\d.]+)"/) || [])[1];
      if (atual && compararVersao(versao, atual) <= 0)
        falhar(`A versão no manifest.json (${versao}) precisa ser maior que a publicada (${atual}).`);
      console.log("Versão publicada atualmente:", atual || "nenhuma");
    } else {
      console.log("Primeira publicação (updates.xml ainda não existe).");
    }
  } catch (e) {
    console.log("Não foi possível consultar a versão publicada:", e.message);
  }

  // Copia a extensão e aponta o update_url para o GitHub Pages
  fs.rmSync(path.join(RAIZ, "build"), { recursive: true, force: true });
  fs.rmSync(SITE, { recursive: true, force: true });
  fs.mkdirSync(SITE, { recursive: true });
  fs.cpSync(ORIGEM, BUILD, { recursive: true });
  manifest.update_url = BASE + "/updates.xml";
  fs.writeFileSync(path.join(BUILD, "manifest.json"), JSON.stringify(manifest, null, 2));

  // Assina o .crx e gera o updates.xml
  execFileSync("npx", ["--yes", CRX3,
    "-p", CHAVE,
    "-o", path.join(SITE, "fluxo-os.crx"),
    "-x", path.join(SITE, "updates.xml"),
    "--appVersion", versao,
    "--crxURL", BASE + "/fluxo-os.crx",
    "--", BUILD], { stdio: "inherit" });

  // ID da extensão (derivado da chave pública)
  const der = crypto.createPublicKey(fs.readFileSync(CHAVE)).export({ type: "spki", format: "der" });
  const hex = crypto.createHash("sha256").update(der).digest("hex").slice(0, 32);
  const id = [...hex].map((c) => String.fromCharCode(97 + parseInt(c, 16))).join("");
  const xml = fs.readFileSync(path.join(SITE, "updates.xml"), "utf8");
  if (!xml.includes(id)) falhar("O ID calculado não confere com o updates.xml.");
  const politica = `${id};${BASE}/updates.xml`;

  // Arquivos de política prontos para a TI
  const reg = (chave) => "Windows Registry Editor Version 5.00\r\n\r\n" +
    `[${chave}]\r\n"1"="${politica}"\r\n`;
  fs.writeFileSync(path.join(SITE, "politica-chrome.reg"),
    reg("HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Google\\Chrome\\ExtensionInstallForcelist"));
  fs.writeFileSync(path.join(SITE, "politica-edge.reg"),
    reg("HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Microsoft\\Edge\\ExtensionInstallForcelist"));

  fs.writeFileSync(path.join(SITE, "index.html"), `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Fluxo de O.S – instalação</title>
<style>body{font:15px/1.5 system-ui,sans-serif;max-width:720px;margin:40px auto;padding:0 16px;color:#17242E}
code{background:#EEF2F4;padding:2px 6px;border-radius:4px;word-break:break-all}h1{font-size:22px}</style></head>
<body>
<h1>Extensão Fluxo de O.S – SAC Suporte</h1>
<p>Versão publicada: <strong>${versao}</strong></p>
<p>ID da extensão: <code>${id}</code></p>
<p>Endereço de atualização: <code>${BASE}/updates.xml</code></p>
<p>Valor da política <em>ExtensionInstallForcelist</em>: <code>${politica}</code></p>
<p>Arquivos para a TI: <a href="politica-chrome.reg">politica-chrome.reg</a> · <a href="politica-edge.reg">politica-edge.reg</a></p>
</body></html>
`);
  console.log("\nID da extensão:", id);
  console.log("Política:", politica);
})();

# Fluxo de O.S – SAC Suporte (G3)

Extensão do Chrome/Edge que indica ao operador qual O.S abrir e copia a máscara com o modelo da descrição.

Este repositório publica a extensão no **GitHub Pages**. As máquinas do SAC instalam e **atualizam sozinhas** a partir dele, sem o operador fazer login no GitHub e sem reinstalar nada.

```
extensao/                   ← código da extensão (é aqui que você edita)
scripts/publicar.js         ← monta, assina e gera os arquivos de atualização
.github/workflows/          ← publicação automática a cada alteração
```

---

## Configuração (uma vez só)

### 1. Criar o repositório
Crie um repositório **público** no GitHub (ex.: `fluxo-os`) e envie todo o conteúdo desta pasta.

> As máquinas baixam as atualizações sem login, então o endereço precisa ser público. O pacote contém só o fluxo e as máscaras, sem dados de clientes. Mesmo assim, alinhe com o time de **Sistemas e Integrações** antes de publicar.

### 2. Gerar a chave de assinatura
A chave define o **ID fixo** da extensão. No Git Bash (Windows) ou terminal:

```bash
openssl genrsa -out chave-fluxo-os.pem 2048
```

- No GitHub: **Settings → Secrets and variables → Actions → New repository secret**
  - Nome: `CRX_PRIVATE_KEY`
  - Valor: todo o conteúdo do arquivo `chave-fluxo-os.pem`
- Guarde o arquivo `.pem` em local seguro e **nunca** envie para o repositório.
  Se a chave for perdida, o ID muda e será preciso reaplicar a política em todas as máquinas.

### 3. Ativar o GitHub Pages
**Settings → Pages → Build and deployment → Source: GitHub Actions**

### 4. Publicar a primeira versão
**Actions → Publicar extensão → Run workflow**.
Ao terminar, abra `https://SEU-USUARIO.github.io/SEU-REPOSITORIO/`. A página mostra o **ID da extensão**, o endereço de atualização e os arquivos `.reg` prontos para a TI.

### 5. Instalar nas máquinas do SAC (TI)
Aplique a política **ExtensionInstallForcelist** com o valor mostrado na página (`ID;https://.../updates.xml`), por um destes meios:
- **GPO** do Active Directory (modelos administrativos do Chrome/Edge);
- **Chrome Enterprise Core** (gratuito), em *Apps e extensões → Adicionar do URL personalizado*;
- arquivo `politica-chrome.reg` / `politica-edge.reg` da página.

> No Windows, o Chrome só aceita extensões fora da Chrome Web Store em máquinas **no domínio (AD)** ou **gerenciadas pelo Chrome Enterprise Core**. Em máquinas fora disso, use uma dessas opções.

Depois, remova das máquinas a versão instalada manualmente ("Carregar sem compactação"), para não ficarem duas.

---

## Como publicar uma atualização

1. Edite os arquivos em `extensao/` (fluxo e máscaras ficam em `data.js`, regras em `regras.js`).
2. **Aumente a versão** em `extensao/manifest.json` (ex.: `1.13.0` → `1.13.1`).
   Sem isso, a publicação é bloqueada, porque o Chrome só atualiza quando a versão sobe.
3. Salve na branch `main`. A publicação roda sozinha em poucos minutos (aba **Actions**).

As máquinas recebem a nova versão automaticamente. O Chrome verifica a cada poucas horas e também ao abrir o navegador.

---

## Sugestões dos operadores
A aba **Ajuda** tem um formulário de sugestões. Configure o destino em `extensao/config.js`:
- `SUGESTAO_EMAIL`: abre o e-mail do operador já preenchido; ou
- `SUGESTAO_WEBHOOK`: envia direto para um endereço (ex.: webhook do n8n). Inclua o domínio em `host_permissions` no `manifest.json`.

Sem nenhum dos dois, a sugestão é copiada para o operador enviar ao supervisor.

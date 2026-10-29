# Estudos · Concurso Campina Grande/PB (Inspetor Sanitário – Arquiteto) — instruções para o Claude

Projeto **pessoal** do Arthur Sérgio: plataforma de estudos para o concurso da Prefeitura de Campina Grande/PB
(banca IDECAN, prova em **10/01/2027, domingo à tarde**). Leia o `README.md` antes de mudar algo e o
`PROXIMA-SESSAO.md` se for continuar um trabalho que ficou pela metade.

## Como trabalhar neste projeto

- **Site** (raiz: `index.html`, `app/`, `data/`): HTML + CSS + JS puro, sem build, publicado no GitHub Pages
  (abre no celular e no PC). Visual de plataforma de curso premium: trilha disciplina → assunto, e cada assunto
  junta leitura, vídeos do YouTube e questões. O que o Arthur marca (questões, metas, aulas vistas) fica no
  `localStorage` do aparelho.
- **Dados** (contrato combinado entre as sessões; UTF-8 sem BOM):
  - `data/index.json`: lista das disciplinas.
  - `data/disciplinas/<id>.json`: `{ id, nome, questoesNaProva, peso, assuntos: [ { id, nome, edital, resumo,
    leituras: [ { titulo, tipo, url, gratuito, nota } ], videos: [ { titulo, canal, youtubeId, duracao } ] } ] }`.
  - `data/questoes/<id>.json`: lista de `{ id, disciplina, assunto, origem, banca, ano, orgao, cargo, fonte,
    enunciado, alternativas, correta, comentario }`. `correta` é o índice (0 = A). `assunto` tem de existir na
    disciplina. Questão escrita por nós vai com `"origem": "autoral"`.
  - `data/provas.json`: provas reais para a aba Provas. **Não editar à mão:** é gerado por
    `scripts/vincular_provas_drive.py` a partir de `references/provas-catalogo.json`.
  - `data/plano.json`: cronograma e metas diárias.
  - `data/provas/<id>.json` (+ `index.json` e `img/`): provas reais digitadas (25 em 29/10/2026), **publicadas** na
    aba Provas como prova interativa (`#/prova/<id>`). Só entra no site e no pop-up a prova listada no `index.json`.
- **Drive pessoal (G:, conta Google pessoal do Arthur; o endereço fica só na memória local, nunca no repositório, que é público):** pasta do concurso em
  `G:\Meu Drive\00 - Pessoal\Concurso\Campina Grande 2026 - Inspetor Sanitario Arquiteto\` (id
  `1JjwLLRbxDjuBLbYihbHbFQf1jh7X94ad`), com `Provas da IDECAN\`, `Edital\` e `Progresso do app\`. Provas novas:
  `scripts/baixar_provas.py` (só fontes com link direto, nunca contornar captcha) e depois
  `scripts/vincular_provas_drive.py`, que lê os ids do Drive no banco local do Google Drive para computador.
- **Sincronização:** Apps Script em `scripts/drive-sync/` (contrato no topo de `Codigo.gs`). A chave nunca vai para
  o repositório.
- **Questões:** estilo IDECAN (4 alternativas A–D, enunciado direto, cobra letra de lei e de norma). Decisão do
  Arthur (28/10/2026): questões reais da IDECAN e de outras bancas podem entrar no site com crédito completo (`banca`,
  `ano`, `orgao`, `cargo`, `fonte`) e `"origem": "banca"` ou `"semelhante"`, sempre com gabarito oficial conferido.
  Texto de NBR continua sem copiar: só citar o item. Provas inteiras ficam como link em `data/provas.json`.
- **Explicação em toda questão** (pedido do Arthur, 28/10/2026): o `comentario` ensina a resposta e aparece no acerto
  e no erro. Formato: `**Por que "<texto da certa>":**` (regra, artigo/item e raciocínio), linha em branco,
  `**As outras:**` com uma linha `- *<texto da errada>*: por quê` para cada errada (cite pelo texto, nunca pela
  letra: o site embaralha as alternativas) e, se ajudar, `**Para memorizar:**`. De 450 a 1.400 caracteres. Questão
  anulada começa com `**Questão anulada pela banca.**`. Antes de escrever, confira se a lei ou norma não mudou.
  `scripts/validar_dados.py` avisa o que fugir disso.
- **Vídeos:** só `youtubeId` conferido (oEmbed do YouTube responde 200). Nunca inventar id.
- **Pop-up do Windows** (`popup/`): tarefa agendada que mostra uma questão de tempos em tempos e não abre se o
  microfone/câmera estiver em uso, se houver tela cheia/apresentação ou se o PC estiver ocioso. Arquivo `.ps1` com
  acento precisa de **UTF-8 com BOM** (PowerShell 5.1).
- Testar o site local: `python -m http.server 8080` na raiz e abrir http://localhost:8080.

## Divisão entre sessões (combinada em 28/10/2026)

**Coordenação (pedido do Arthur, 29/10/2026):** com várias sessões abertas nesta pasta, uma coordena (a que o Arthur
indicar; em 29/10 foi a `estudos-0a`). As outras combinam tudo com ela por `SendMessage` e não perguntam nada ao
Arthur no dia a dia: dúvida, divisão de arquivos e liberação de trabalho passam pela coordenadora. Continuam com o
Arthur só as exceções do CLAUDE.md global (mensagem ou arquivo em nome dele, ação difícil de desfazer fora do PC) e
o que o próprio Claude Code bloquear.

Duas sessões trabalharam em paralelo nesta pasta. Se as duas estiverem abertas de novo, respeite os donos:
- **Específicas e documentação:** `references/`, `CLAUDE.md`, `README.md`, `PROXIMA-SESSAO.md`,
  `data/disciplinas/especificos.json`, `data/questoes/especificos.json`, `data/provas.json`, `data/plano.json`.
- **Site, pop-up, publicação e Conhecimentos Gerais:** `index.html`, `app/`, `popup/`, `.github/`, `.nojekyll`,
  `data/index.json`, `data/disciplinas/` e `data/questoes/` de portugues, informatica, historia-cg e legislacao-etica.

## Conexões

- Projeto pessoal: **não** usar contas da Seazone (Slack, Gmail, Calendar do seazone-hub) aqui sem o Arthur pedir.
- GitHub: `gh` na conta `arthursergio-hue` (nunca seazone-tech), repositório público com GitHub Pages (grátis).
  O Arthur pediu que o Claude publicasse sozinho; push de conteúdo novo segue autorizado para este site.
- Identidade git só no repositório: `Arthur Sérgio` / `arthur.sergio@seazone.com.br`.

## Organização

- `README.md`: o que é, o que mudou, testar em 5 minutos, arquivos, o que ainda não está, pendências.
  Atualize a cada mudança.
- `references/`: edital e retificações (PDF), resumo do edital, fontes e notas de pesquisa (cada `.md` com
  `<!-- updated: data · fonte: … -->`).
- Projeto pessoal: não registrar no índice `Projetos IA` da Seazone nem usar o modelo de lá.
- Esta pasta fica fora da medição de uso de IA da Seazone (já coberta por `C:\dev\pessoal`).

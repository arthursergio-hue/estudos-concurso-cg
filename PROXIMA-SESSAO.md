<!-- updated: 2026-10-28 20:10 · estado do trabalho para a próxima sessão do Claude -->

# Continuar daqui

Cole isto numa sessão nova aberta em `C:\dev\pessoal\estudos`:

> Continue o projeto de estudos do concurso de Campina Grande (Inspetor Sanitário – Arquiteto, IDECAN). Leia
> `CLAUDE.md`, `README.md` e este `PROXIMA-SESSAO.md`, veja o que está marcado como feito e siga do primeiro item
> pendente. No fim, atualize este arquivo e o README.

## Pedido original do Arthur (resumo)

1. Pesquisar o concurso e o edital.
2. Plano de estudos com cronograma até a prova e **meta diária com check**.
3. **Questões aleatórias** filtrando por disciplina e assunto, com correção na hora.
4. **Leitura organizada pelo edital**: em cada assunto, resumo, leis, normas, livros gratuitos, **vídeos do YouTube** e
   questões. Visual **premium, tipo Hotmart, só que melhor**.
5. Questões no estilo da IDECAN, com links das provas reais da banca.
6. Repositório no GitHub pessoal e publicação grátis para abrir no celular (feita pelo Claude).
7. **Pop-up no Windows** com uma questão de tempos em tempos, só quando ele estiver livre (sem reunião).
8. Salvar tudo nesta pasta, `CLAUDE.md`, memória, pasta organizada, prompt de continuação.

## Duas sessões dividiram o trabalho (28/10/2026)

- **Sessão A (Específicas e documentação):** edital, `data/disciplinas/especificos.json`, `data/questoes/especificos.json`,
  `data/provas.json`, `data/plano.json`, `references/`, `CLAUDE.md`, `README.md`, este arquivo, memória.
- **Sessão B (estudos-29):** site (`index.html`, `app/`, `sw.js`, `manifest.webmanifest`), pop-up (`popup/`),
  Conhecimentos Gerais (Português, Informática, História de CG, Legislação e Ética), repositório e GitHub Pages.

## Situação

- [x] Edital e retificações baixados (`references/edital/`) e resumidos (`references/edital-resumo.md`).
- [x] 24 aulas das Específicas com resumo, leituras gratuitas conferidas e 89 vídeos verificados (`data/disciplinas/especificos.json`).
- [x] Site e pop-up prontos (sessão B). Tarefa agendada do pop-up ainda não instalada.
- [x] 230 questões autorais das Específicas, todos os 24 assuntos, gabarito equilibrado (lotes em
  `references/lotes-questoes/01` a `24`). Para adicionar: escrever `references/lotes-questoes/NN-assunto.json` e rodar
  `python -I scripts/adicionar_questoes.py references/lotes-questoes/NN-assunto.json`.
- [x] `data/provas.json` (24 provas reais, IDECAN e CG, só link) e `data/plano.json` (11 semanas, meta 30 questões +
  60 min + 1 vídeo por dia).
- [x] `README.md`, `CLAUDE.md`, memória e linha no `C:\dev\pessoal\CLAUDE.md`.
- [x] Conferido no navegador (porta 8091, `.claude/launch.json`): aulas, vídeos, questões, plano e provas carregam.
- [ ] Conhecimentos Gerais (sessão B): em 28/10 às 20h30 os arquivos `data/disciplinas|questoes/{portugues,
  informatica,legislacao-etica,historia-cg}.json` ainda não existiam (404 no site).
- [ ] Publicação no GitHub Pages (sessão B) e instalação da tarefa agendada do pop-up. Pôr a URL no README.
- [x] O Arthur confirmou (28/10/2026): questões reais podem entrar no site com crédito completo. Regra atualizada
  no `CLAUDE.md`.
- [ ] Revisão independente das 230 questões de Específicas feita pela sessão B: aplicar as correções confirmadas
  nos lotes e rodar o script de novo.
- [x] 21 provas da IDECAN (com gabarito) baixadas para o Drive pessoal e ligadas em `data/provas.json` (28 provas no total).
- [x] As 5 provas do PCI com captcha (Fiscal de Obras, Agente Administrativo e Assistente Social de CG 2021, EBSERH
  Arquitetura 2014, UEPB 2014) foram baixadas pelo Arthur no Chrome e estão no Drive: 26 de 28 provas com PDF.
  Os PDFs do PCI levam uma marca escondida ("pcimarkpci" + IP e horário do download em base64): não publicar esse texto.
- [ ] Sincronização pelo Drive: servidor pronto (`scripts/drive-sync/`). Falta o Arthur configurar (passo a passo) e a
  sessão B implementar no site e no pop-up (contrato enviado).
- [ ] Proposta ainda sem resposta do Arthur: folha de respostas digital (resolve no PDF e marca as letras no app, que
  corrige pelo gabarito). Transcrever provas inteiras para o app foi recusado (direito autoral).
- [ ] Ideias para depois: questões sobre o Código Sanitário de CG (LC 51/2010) e o Código de Obras quando o texto
  for obtido; sincronizar progresso PC ↔ celular sem exportar/importar.

## Decisões já tomadas

- Prova: 10/01/2027, tarde. Nível superior: Português 10, Informática 4, História de CG 3, Legislação/Ética 3,
  Específicas 20 (peso 2). 4 alternativas (A–D).
- Não há Raciocínio Lógico/Matemática para nível superior neste edital (o Arthur citou "matemática"; avisar).
- Requisito do cargo inclui pós lato sensu em Vigilância Sanitária/Saúde (Ret. 01): avisar o Arthur.
- Questões das Específicas: autorais no estilo IDECAN; provas reais só por link.
- Pop-up detecta reunião pelo microfone/câmera em uso, tela cheia, "não perturbe" e PC parado; não usa a agenda.

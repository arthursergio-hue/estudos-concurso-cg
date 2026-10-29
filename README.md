<!-- updated: 2026-10-28 · versão 1.0 · dono: Arthur Sérgio · público: pessoal -->

# Estudos · Concurso Prefeitura de Campina Grande/PB — Inspetor Sanitário (Arquiteto)

## O que é

Plataforma de estudos para o concurso da Prefeitura de Campina Grande/PB (Edital 01/2026, banca **IDECAN**), cargo
**Inspetor Sanitário – Hab. Arquiteto**. Prova objetiva em **10/01/2027 (domingo), à tarde**: 40 questões A–D,
Específicas valem 40 dos 60 pontos. Resumo completo do edital em [references/edital-resumo.md](references/edital-resumo.md).

**Abrir no celular ou no PC:** https://arthursergio-hue.github.io/estudos-concurso-cg/ (repositório
[arthursergio-hue/estudos-concurso-cg](https://github.com/arthursergio-hue/estudos-concurso-cg), GitHub Pages da `main`;
cada push publica sozinho em 1 a 2 minutos).

Tem três partes:

1. **Site** (abre no PC e no celular, funciona offline e pode ser instalado como app):
   - **Início:** contagem regressiva, meta do dia com check, semana atual do plano, desempenho.
   - **Trilhas:** cada disciplina vira um curso e cada assunto do edital vira uma aula com **resumo**, **leituras**
     (leis, RDCs, normas, livros gratuitos), **vídeos do YouTube** e **questões** daquele assunto.
   - **Questões:** sorteio por disciplina, assunto e situação (não feitas, erradas), com correção e comentário na hora.
   - **Simulado:** 40 questões na proporção do edital, 3 horas, nota com peso.
   - **Plano:** 11 semanas até a prova, com tarefas para marcar.
   - **Provas:** provas reais da IDECAN para baixar (Campina Grande 2021, arquiteto, vigilância sanitária).
   - **Edital** e **Progresso** (exportar e importar o progresso entre PC e celular).
2. **Pop-up no Windows:** de tempos em tempos (8h–22h, a cada 60–100 min) abre uma questão; não abre se o microfone ou
   a câmera estiverem em uso (reunião), com tela cheia ou apresentação, no "não perturbe" ou com o PC parado.
3. **Conteúdo:** 24 aulas de Específicas, 230 questões autorais de Específicas no estilo IDECAN, 89 vídeos conferidos,
   leituras gratuitas, plano de estudos e lista de provas. As disciplinas gerais (Português, Informática, História de
   CG, Legislação e Ética) têm aulas e questões próprias.

## Provas e progresso no Google Drive pessoal

- Pasta: `G:\Meu Drive\00 - Pessoal\Concurso\Campina Grande 2026 - Inspetor Sanitario Arquiteto\`
  (conta Google pessoal do Arthur), com `Provas da IDECAN\` (26 provas com gabarito, de 2014 a 2026, inclusive as 3
  de Campina Grande 2021 do edital 001 e a de Fiscal de Obras da UEPB 2014), `Edital\` e,
  depois de ligar a sincronização, `Progresso do app\`.
- Na aba **Provas**, as que estão no Drive abrem direto lá (prova e gabarito). Os links são privados: só abrem logado
  na conta pessoal.
- **Sincronizar PC, celular e pop-up pelo Drive:** siga [scripts/drive-sync/COMO-CONFIGURAR.md](scripts/drive-sync/COMO-CONFIGURAR.md)
  (5 minutos, uma vez). O site e o pop-up já estão prontos para usar.

## O que mudou

- **29/10/2026 — Gerais no ar, gabarito conferido e progresso no celular.** As 5 disciplinas de Conhecimentos Gerais
  estão no site (sessão estudos-0a), e o plano liga cada aula a uma semana. A conferência de gabarito das 230 questões
  de Específicas não achou gabarito errado; foram atualizadas a NBR 9077:2025 (saídas de emergência), a NBR 6122:2019
  (radier) e a prescrição na improbidade (STF, ADIs 7156 e 7236). **Provas interativas: 25 provas reais digitadas** em `data/provas/` (1.340 questões,
  gabarito oficial e explicação; validar: `python -I scripts/validar_provas.py`). Novo em Progresso: **Levar
  para o celular**, um link com o progresso do aparelho para mandar no WhatsApp, abrir no outro aparelho e juntar
  depois de confirmar, sem configuração.
- **28/10/2026 — explicações completas.** As 230 questões de Específicas agora têm comentário com "Por que", "As outras" e "Para memorizar" (feito pela estudos-56). Correções: enunciados de esp-0032, 0036 e 0143; RDC 189/2003 trocada por RDC 51/2011 (revogada pelo art. 32 da RDC 51) em esp-0146; aulas de licenciamento (Lei 15.190/2025), hidrossanitárias (NBR 17076:2024), SPDA (NBR 5419:2026), conforto (NBR 15220-3:2024) e EAS (RDC 51/2011) atualizadas.
- **28/10/2026 — versão 1.1.** 21 provas reais da IDECAN baixadas no Drive pessoal e ligadas ao app; servidor de
  sincronização pelo Drive (Apps Script) pronto para configurar.
- **28/10/2026 — versão 1.0.** Pesquisa do edital e das retificações, site, pop-up, aulas, questões, plano e provas.
  Feito por duas sessões do Claude em paralelo (ver `CLAUDE.md`).

## Testar em 5 minutos

1. Na pasta do projeto: `python -m http.server 8080` e abra http://localhost:8080.
2. Em **Trilhas → Conhecimentos Específicos → Acessibilidade**, veja resumo, leituras, vídeos e questões.
3. Em **Questões**, escolha "Conhecimentos Específicos", 10 questões, e responda.
4. Pop-up: `powershell -ExecutionPolicy Bypass -File popup\questao.ps1 -Diagnostico` mostra se ele abriria agora
   e por quê. `popup\agendar.ps1` instala a tarefa agendada; `popup\remover.ps1` tira.

## Arquivos

| Caminho | O que é |
|---|---|
| `index.html`, `app/`, `sw.js`, `manifest.webmanifest` | O site (JS puro, sem build) |
| `data/index.json` | Concurso, disciplinas e documentos do edital |
| `data/disciplinas/<id>.json` | Aulas de cada disciplina (resumo, leituras, vídeos) |
| `data/questoes/<id>.json` | Questões de cada disciplina |
| `data/plano.json` | Plano semana a semana e meta diária |
| `data/provas.json` | Provas reais da IDECAN (links) |
| `popup/` | Pop-up de questões no Windows e tarefa agendada |
| `scripts/adicionar_questoes.py` | Valida um lote de questões e junta em `data/questoes/` |
| `scripts/buscar_videos.py` | Busca vídeos do YouTube por assunto e confere cada id |
| `scripts/baixar_provas.py` | Baixa provas e gabaritos (links diretos do QConcursos) para a pasta do Drive |
| `scripts/vincular_provas_drive.py` | Gera `data/provas.json` a partir de `references/provas-catalogo.json`, com os links do Drive |
| `scripts/drive-sync/` | Servidor de sincronização (Apps Script) e passo a passo |
| `references/provas-catalogo.json` | Lista-mestra das provas (o que baixar, onde está, relevância) |
| `references/edital/` | Edital e retificações oficiais (PDF) |
| `references/edital-resumo.md` | Resumo do edital: cargo, datas, pesos, conteúdo |
| `references/lotes-questoes/` | Fonte editável das questões de Específicas |
| `CLAUDE.md` · `PROXIMA-SESSAO.md` | Instruções e continuação para o Claude |

Como acrescentar questões de Específicas: escreva um lote em `references/lotes-questoes/NN-assunto.json`
(formato no topo de `scripts/adicionar_questoes.py`) e rode `python -I scripts/adicionar_questoes.py <lote>`.

## O que ainda não está

- **Sincronização pelo Drive:** o site e o pop-up já usam; falta só o Arthur fazer os 5 passos do Apps Script
  ([scripts/drive-sync/COMO-CONFIGURAR.md](scripts/drive-sync/COMO-CONFIGURAR.md)). Sem configurar nada, use **Levar
  para o celular** em Progresso (link pelo WhatsApp).
- Duas provas só existem com cadastro no QConcursos e ficam como link: UERN 2016 e Maracanaú Urbanismo 2023.
  Baixando o PDF, salve na pasta `Provas da IDECAN` com o nome que está em
  `references/provas-catalogo.json` (campo `arquivo` + ` - prova.pdf`/` - gabarito.pdf`) e rode
  `python -I scripts/vincular_provas_drive.py`.
- **Código Sanitário de Campina Grande (LC 51/2010)**, Código de Posturas (Lei 4.129/2003) e Plano Diretor novo: o
  texto não estava disponível on-line na pesquisa. Vale pedir na Câmara ou na Prefeitura e criar questões sobre eles.
  O **Código de Obras (Lei 5.410/2013)** foi achado no SAPL da Câmara em 29/10 e já tem aula e 12 questões.
- A Retificação 04 do edital não foi localizada (as 01, 02, 03 e 05 estão em `references/edital/`).

## Pendências

- Confirmar no site do IDECAN a inscrição e, em 30/12/2026, o local de prova.
- Requisito do cargo (Retificação 01): **pós-graduação lato sensu** em Vigilância Sanitária, Vigilância em Saúde, Saúde
  Pública/Coletiva, Epidemiologia, Saúde do Trabalhador ou Saúde Ambiental, exigida na posse.
- Acompanhar novas retificações no site do IDECAN.

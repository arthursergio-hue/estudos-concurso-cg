/**
 * Sincroniza o progresso do site de estudos (PC, celular e pop-up do Windows) por um arquivo no Google Drive.
 *
 * Roda na conta pessoal do Arthur (arthursgsantos@gmail.com) como App da Web:
 *   Executar como: Eu · Quem pode acessar: Qualquer pessoa.
 * Toda chamada precisa da chave gerada por configurar(). O progresso fica em
 * "00 - Pessoal/Concurso/Campina Grande 2026 - Inspetor Sanitario Arquiteto/Progresso do app/progresso.json".
 *
 * Contrato:
 *   GET  ?t=<chave>                         -> { ok, estado, atualizado }
 *   POST {"t": "<chave>", "estado": {...}}  -> junta o estado recebido com o salvo e devolve { ok, estado, novas }
 * O "estado" tem o formato do Exportar do site: { resp, videos, leituras, concluidos, dias, tarefas, simulados, meta }.
 * Em videos, leituras, concluidos e tarefas o valor é um ts: positivo = marcado, negativo = desmarcado.
 */
const PASTA_CONCURSO = '1JjwLLRbxDjuBLbYihbHbFQf1jh7X94ad';
const SITE = 'https://arthursergio-hue.github.io/estudos-concurso-cg/';
const FUSO = 'America/Recife';

function configurar() {
  const p = PropertiesService.getScriptProperties();
  if (!p.getProperty('CHAVE')) p.setProperty('CHAVE', Utilities.getUuid().replace(/-/g, ''));
  arquivo_();
  const chave = p.getProperty('CHAVE');
  Logger.log('Chave: ' + chave);
  let url = '';
  try { url = ScriptApp.getService().getUrl() || ''; } catch (e) {}
  if (url) {
    Logger.log('Link para ligar a sincronização (abra no PC e no celular):');
    Logger.log(SITE + '#/sync?u=' + encodeURIComponent(url) + '&t=' + chave);
  } else {
    Logger.log('Agora implante como App da Web e rode configurar() de novo para ver o link.');
  }
}

function doGet(e) {
  if (!autorizado_(e.parameter.t)) return responder_({ ok: false, erro: 'chave inválida' });
  const f = arquivo_();
  return responder_({ ok: true, estado: ler_(f), atualizado: f.getLastUpdated().getTime() });
}

function doPost(e) {
  let corpo;
  try { corpo = JSON.parse(e.postData.contents); } catch (err) { return responder_({ ok: false, erro: 'JSON inválido' }); }
  if (!autorizado_(corpo.t)) return responder_({ ok: false, erro: 'chave inválida' });
  const trava = LockService.getScriptLock();
  trava.waitLock(20000);
  try {
    const f = arquivo_();
    const salvo = ler_(f);
    copiaDoDia_(salvo);
    const novas = mesclar_(salvo, corpo.estado || {});
    f.setContent(JSON.stringify(salvo));
    return responder_({ ok: true, estado: salvo, novas: novas });
  } finally {
    trava.releaseLock();
  }
}

// Mesma regra do mesclar() do site: respostas somam pelo horário (ts); marcações e meta ficam com a mudança mais
// recente; aceita estado parcial (só o que mudou), como o que o site manda ao fechar a aba.
function mesclar_(S, o) {
  ['resp', 'videos', 'leituras', 'concluidos', 'dias', 'tarefas'].forEach(function (k) {
    if (!S[k] || typeof S[k] !== 'object') S[k] = {};
  });
  if (!Array.isArray(S.simulados)) S.simulados = [];
  const dia = function (k) { return (S.dias[k] = S.dias[k] || { questoes: 0, acertos: 0, seg: 0, videos: 0 }); };
  let novas = 0;
  Object.keys(o.resp || {}).forEach(function (id) {
    const h = o.resp[id];
    if (!Array.isArray(h)) return;
    const cur = S.resp[id] || [];
    const vistos = {};
    cur.forEach(function (x) { vistos[x.ts] = true; });
    const add = h.filter(function (x) { return x && typeof x.ts === 'number' && !vistos[x.ts]; });
    add.forEach(function (x) { const d = dia(ymd_(x.ts)); d.questoes++; if (x.ok) d.acertos++; });
    novas += add.length;
    S.resp[id] = cur.concat(add).sort(function (a, b) { return a.ts - b.ts; }).slice(-20);
  });
  // ts positivo = marcado, negativo = desmarcado; vence a mudança mais recente (|ts| maior).
  ['videos', 'leituras', 'concluidos', 'tarefas'].forEach(function (k) {
    const m = o[k] || {};
    Object.keys(m).forEach(function (id) {
      const v = Number(m[id]) || 0;
      if (Math.abs(v) > Math.abs(Number(S[k][id]) || 0)) S[k][id] = v;
    });
  });
  Object.keys(o.dias || {}).forEach(function (k) {
    const v = o.dias[k] || {}, c = dia(k);
    c.seg = Math.max(c.seg || 0, v.seg || 0);
    c.videos = Math.max(c.videos || 0, v.videos || 0);
  });
  const sims = {};
  S.simulados.concat(o.simulados || []).forEach(function (s) { if (s && s.ts) sims[s.ts] = s; });
  S.simulados = Object.keys(sims).map(function (k) { return sims[k]; }).sort(function (a, b) { return a.ts - b.ts; });
  // meta = { questoes, minutosLeitura, videos, ts } ou { padrao: true, ts }; vence a mais recente.
  if (o.meta && (!S.meta || (o.meta.ts || 0) > (S.meta.ts || 0))) S.meta = o.meta;
  return novas;
}

function arquivo_() {
  const p = PropertiesService.getScriptProperties();
  const id = p.getProperty('ARQUIVO');
  if (id) { try { return DriveApp.getFileById(id); } catch (e) {} }
  const f = pasta_().createFile('progresso.json', '{}', 'application/json');
  p.setProperty('ARQUIVO', f.getId());
  return f;
}

function pasta_() {
  const mae = DriveApp.getFolderById(PASTA_CONCURSO);
  const it = mae.getFoldersByName('Progresso do app');
  return it.hasNext() ? it.next() : mae.createFolder('Progresso do app');
}

// Guarda uma cópia por dia (a do dia anterior), para desfazer se algo der errado.
function copiaDoDia_(estado) {
  const p = PropertiesService.getScriptProperties();
  const hoje = Utilities.formatDate(new Date(), FUSO, 'yyyy-MM-dd');
  if (p.getProperty('COPIA_DIA') === hoje) return;
  const nome = 'progresso - copia do dia anterior.json';
  const pasta = pasta_();
  const it = pasta.getFilesByName(nome);
  if (it.hasNext()) it.next().setContent(JSON.stringify(estado));
  else pasta.createFile(nome, JSON.stringify(estado), 'application/json');
  p.setProperty('COPIA_DIA', hoje);
}

function ler_(f) {
  try { return JSON.parse(f.getBlob().getDataAsString() || '{}'); } catch (e) { return {}; }
}

function autorizado_(chave) {
  const c = PropertiesService.getScriptProperties().getProperty('CHAVE');
  return !!c && chave === c;
}

function ymd_(ts) {
  return Utilities.formatDate(new Date(ts), FUSO, 'yyyy-MM-dd');
}

function responder_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

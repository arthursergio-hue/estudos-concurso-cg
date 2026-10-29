/**
 * Sincroniza o progresso do site de estudos (PC, celular e pop-up do Windows) por um arquivo no Google Drive.
 *
 * Roda na conta Google pessoal do Arthur como App da Web:
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
// Defesa em profundidade: o site já valida tudo; aqui cada campo é conferido de novo antes de entrar no arquivo.
function mesclar_(S, o) {
  ['resp', 'videos', 'leituras', 'concluidos', 'dias', 'tarefas'].forEach(function (k) {
    if (!S[k] || typeof S[k] !== 'object') S[k] = {};
  });
  if (!Array.isArray(S.simulados)) S.simulados = [];
  const agora = Date.now();
  const tsOk = function (t) { return typeof t === 'number' && isFinite(t) && Math.abs(t) <= agora + 864e5; };
  const num = function (v, min, max) { const n = Number(v); return isFinite(n) && n >= min && n <= max ? n : null; };
  const dia = function (k) { return (S.dias[k] = S.dias[k] || { questoes: 0, acertos: 0, seg: 0, videos: 0 }); };
  let novas = 0;
  Object.keys(o.resp || {}).forEach(function (id) {
    if (typeof id !== 'string' || id.length > 64) return;
    const h = o.resp[id];
    if (!Array.isArray(h)) return;
    const cur = Array.isArray(S.resp[id]) ? S.resp[id] : [];
    // com 20 respostas guardadas, só conta o que é mais novo que a mais antiga guardada (senão volta a contar)
    const corte = cur.length >= 20 ? cur[0].ts : 0;
    const vistos = {};
    cur.forEach(function (x) { vistos[x.ts] = true; });
    const add = h.filter(function (x) {
      return x && tsOk(x.ts) && typeof x.ok === 'boolean' && x.ts > corte && !vistos[x.ts];
    }).map(function (x) {
      return { ts: x.ts, e: (typeof x.e === 'number' && x.e % 1 === 0 && x.e >= -1 && x.e <= 4) ? x.e : -1, ok: x.ok };
    });
    add.forEach(function (x) { const d = dia(ymd_(x.ts)); d.questoes++; if (x.ok) d.acertos++; });
    novas += add.length;
    S.resp[id] = cur.concat(add).sort(function (a, b) { return a.ts - b.ts; }).slice(-20);
  });
  // marcações: ts positivo = marcado, negativo = desmarcado; vence |ts| maior
  ['videos', 'leituras', 'concluidos', 'tarefas'].forEach(function (k) {
    const m = o[k] || {};
    Object.keys(m).forEach(function (id) {
      if (typeof id !== 'string' || id.length > 200) return;
      const v = Number(m[id]);
      if (!tsOk(v) || v === 0) return;
      if (Math.abs(v) > Math.abs(Number(S[k][id]) || 0)) S[k][id] = v;
    });
  });
  Object.keys(o.dias || {}).forEach(function (k) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(k)) return;
    const v = o.dias[k] || {}, c = dia(k);
    c.seg = Math.max(c.seg || 0, num(v.seg, 0, 86400) || 0);
    // tempo de leitura por aparelho: { "<id do aparelho>": segundos }; vence o maior de cada aparelho e o dia soma todos
    if (v.segPor && typeof v.segPor === 'object') {
      if (!c.segPor || typeof c.segPor !== 'object') c.segPor = {};
      Object.keys(v.segPor).forEach(function (ap) {
        if (!/^[\w-]{1,20}$/.test(ap) || ap === '__proto__' || ap === 'constructor') return;
        const n = num(v.segPor[ap], 0, 86400);
        if (n !== null && n > (Number(c.segPor[ap]) || 0)) c.segPor[ap] = Math.round(n);
      });
    }
    if (c.segPor && typeof c.segPor === 'object') {
      const soma = Object.keys(c.segPor).reduce(function (t, ap) { return t + (Number(c.segPor[ap]) || 0); }, 0);
      c.seg = Math.max(c.seg || 0, Math.min(soma, 86400));
    }
    c.videos = Math.max(c.videos || 0, num(v.videos, 0, 1000) || 0);  // só compatibilidade: o site conta vídeos por S.videos
  });
  const sims = {};
  S.simulados.concat(Array.isArray(o.simulados) ? o.simulados : []).forEach(function (s) {
    if (!s || !tsOk(s.ts)) return;
    const lim = { ts: s.ts, pts: num(s.pts, 0, 1000), max: num(s.max, 0, 1000), n: num(s.n, 0, 1000), ok: num(s.ok, 0, 1000) };
    if ([lim.pts, lim.max, lim.n, lim.ok].some(function (x) { return x === null; })) return;
    sims[lim.ts] = lim;
  });
  S.simulados = Object.keys(sims).map(function (k) { return sims[k]; }).sort(function (a, b) { return a.ts - b.ts; });
  // meta: valores dentro de faixas; o ts mais novo vence
  const m = o.meta;
  if (m && typeof m === 'object' && tsOk(m.ts)) {
    let cand = null;
    if (m.padrao === true) cand = { padrao: true, ts: m.ts };
    else {
      const q = num(m.questoes, 1, 300), ml = num(m.minutosLeitura, 0, 600), v = num(m.videos, 0, 20);
      if (q !== null && ml !== null && v !== null) cand = { questoes: q, minutosLeitura: ml, videos: v, ts: m.ts };
    }
    if (cand && (!S.meta || cand.ts > (S.meta.ts || 0))) S.meta = cand;
  }
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

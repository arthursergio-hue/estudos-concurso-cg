/* Plataforma de estudos · Concurso Campina Grande/PB (Inspetor Sanitário – Arquiteto).
   Site estático: lê data/*.json e guarda o progresso no localStorage do aparelho. */
(() => {
  'use strict';

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const md = s => window.md(s);
  const mdi = s => window.mdInline(s);
  const LETRAS = 'ABCDE';
  const urlSegura = u => (/^https?:\/\//i.test(u || '') || /^[\w][\w./%-]*$/.test(u || '')) ? u : '#';
  const ytOk = id => /^[\w-]{11}$/.test(id || '');

  // ---------- ícones (traço, estilo lucide) ----------
  const I = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>',
    trilhas: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
    questoes: '<path d="m3 7 2 2 4-4"/><path d="m3 17 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
    simulado: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M9 2h6"/>',
    plano: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="m9 16 2 2 4-4"/>',
    provas: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h6"/>',
    edital: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M8 11h8M8 15h5"/>',
    ajustes: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    mais: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    play: '<path d="M7 4v16l13-8z"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    flame: '<path d="M12 22c4 0 7-3 7-7 0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-3 2-5 5-5 8 0 4 3 7 7 7z"/>',
    ext: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    video: '<rect x="2" y="5" width="15" height="14" rx="2"/><path d="m17 10 5-3v10l-5-3z"/>',
    ler: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
    trofeu: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
    seta: '<path d="M5 12h14M13 5l7 7-7 7"/>',
    volta: '<path d="m15 18-6-6 6-6"/>',
    relogio: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    alvo: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    refazer: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>',
    baixar: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    subir: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    luz: '<path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>',
  };
  const ic = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${I[n] || ''}</svg>`;

  // ---------- datas ----------
  const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const hoje = () => ymd(new Date());
  const fmtCurta = s => { const [, m, d] = String(s).split('-'); return `${d}/${m}`; };
  const fmtLonga = iso => new Date(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  function diasAte(iso) {
    const a = new Date(iso); a.setHours(0, 0, 0, 0);
    const h = new Date(); h.setHours(0, 0, 0, 0);
    return Math.max(0, Math.round((a - h) / 864e5));
  }
  function hash01(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return ((h >>> 0) % 10000) / 10000; }

  // ---------- estado (localStorage) ----------
  const CHAVE = 'cg-estudos-v1';
  const padrao = () => ({ resp: {}, videos: {}, leituras: {}, concluidos: {}, dias: {}, tarefas: {}, simulados: [], meta: null, ultimo: null, timer: null });
  const S = (() => { try { return Object.assign(padrao(), JSON.parse(localStorage.getItem(CHAVE) || '{}')); } catch { return padrao(); } })();
  const salvar = () => { try { localStorage.setItem(CHAVE, JSON.stringify(S)); } catch (e) { console.warn(e); } };
  const dia = (k = hoje()) => (S.dias[k] ||= { questoes: 0, acertos: 0, seg: 0, videos: 0 });
  let confirmarZerar = false;

  // ---------- dados ----------
  const D = { idx: null, discs: [], disc: {}, qs: [], q: {}, vid: {}, provas: [], plano: null };

  async function json(p) {
    const r = await fetch(p, { cache: 'no-cache' });
    if (!r.ok) throw new Error(`${p}: ${r.status}`);
    return r.json();
  }

  async function carregar() {
    D.idx = await json('data/index.json');
    const ids = D.idx.disciplinas.map(d => d.id);
    const [ds, qs, pv, pl] = await Promise.all([
      Promise.allSettled(ids.map(id => json(`data/disciplinas/${id}.json`))),
      Promise.allSettled(ids.map(id => json(`data/questoes/${id}.json`))),
      json('data/provas.json').catch(() => []),
      json('data/plano.json').catch(() => null),
    ]);
    D.idx.disciplinas.forEach((base, k) => {
      const arq = ds[k].status === 'fulfilled' ? ds[k].value : null;
      const d = Object.assign({}, arq || {}, base);
      d.assuntos = Array.isArray(arq?.assuntos) ? arq.assuntos.filter(a => a && a.id) : [];
      d.pendente = !arq;
      d.as = Object.fromEntries(d.assuntos.map(a => [a.id, a]));
      D.disc[d.id] = d; D.discs.push(d);
      const v = qs[k].status === 'fulfilled' ? qs[k].value : [];
      const lista = Array.isArray(v) ? v : (v?.questoes || []);
      for (const q of lista) {
        if (!q?.id || !Array.isArray(q.alternativas) || D.q[q.id]) continue;
        q.disciplina ||= d.id;
        D.qs.push(q); D.q[q.id] = q;
      }
    });
    for (const d of D.discs) for (const a of d.assuntos) for (const v of a.videos || []) {
      if (ytOk(v.youtubeId) && !D.vid[v.youtubeId]) D.vid[v.youtubeId] = { d, a, v };
    }
    D.provas = Array.isArray(pv) ? pv : [];
    D.plano = pl && typeof pl === 'object' ? pl : null;
  }

  // ---------- estatística ----------
  const ultima = id => { const r = S.resp[id]; return r?.length ? r[r.length - 1] : null; };
  const qsDe = (did, aid) => D.qs.filter(q => q.disciplina === did && (!aid || q.assunto === aid));
  function est(lista) {
    let resp = 0, ok = 0;
    for (const q of lista) { const u = ultima(q.id); if (u) { resp++; if (u.ok) ok++; } }
    return { total: lista.length, resp, ok, pct: resp ? Math.round(100 * ok / resp) : null };
  }
  const meta = () => Object.assign({ questoes: 30, minutosLeitura: 60, videos: 1 }, D.plano?.metaDiaria || {}, S.meta || {});
  const timerSeg = () => S.timer ? Math.min(4 * 3600, Math.max(0, (Date.now() - S.timer.inicio) / 1000)) : 0;
  const segDo = k => (S.dias[k]?.seg || 0) + (k === hoje() ? timerSeg() : 0);
  function progressoDia(k) {
    const d = S.dias[k] || {}; const m = meta();
    const p = [Math.min(1, (d.questoes || 0) / m.questoes), Math.min(1, segDo(k) / 60 / m.minutosLeitura)];
    if (m.videos) p.push(Math.min(1, (d.videos || 0) / m.videos));
    return p.reduce((a, b) => a + b, 0) / p.length;
  }
  function sequencia() {
    let n = 0; const d = new Date();
    if (progressoDia(ymd(d)) < 1) d.setDate(d.getDate() - 1);
    while (progressoDia(ymd(d)) >= 1) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  // Mais chance para quem você errou ou ainda não fez; acertadas voltam aos poucos.
  function peso(q) {
    const u = ultima(q.id);
    if (!u) return 3;
    if (!u.ok) return 6;
    return Math.min(3, 0.3 + (Date.now() - u.ts) / 864e5 / 7);
  }
  const sortear = (lista, n) => lista.map(q => [Math.random() ** (1 / peso(q)), q]).sort((a, b) => b[0] - a[0])
    .slice(0, n || lista.length).map(x => x[1]);

  function registrar(q, escolha) {
    const ok = escolha === q.correta;
    const h = (S.resp[q.id] ||= []);
    h.push({ ts: Date.now(), e: escolha, ok });
    if (h.length > 20) h.splice(0, h.length - 20);
    const d = dia(); d.questoes++; if (ok) d.acertos++;
    salvar();
    if (d.questoes === meta().questoes) toast('Meta de questões de hoje batida! 🎯');
    return ok;
  }

  // ---------- componentes ----------
  function anel(pct, legenda) {
    const r = 52, c = 2 * Math.PI * r, v = Math.max(0, Math.min(100, pct));
    return `<div class="anel"><svg viewBox="0 0 120 120"><defs><linearGradient id="ga" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#7c5cff"/><stop offset="1" stop-color="#ff5c8a"/></linearGradient></defs>
      <circle cx="60" cy="60" r="${r}" class="anel-f"/><circle cx="60" cy="60" r="${r}" class="anel-v" stroke="url(#ga)"
      stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - v / 100)}"/></svg>
      <div class="anel-t"><b>${Math.round(v)}%</b><small>${esc(legenda)}</small></div></div>`;
  }
  const barra = (pct, cls = '') => `<div class="bar ${cls}"><i style="width:${Math.max(0, Math.min(100, pct))}%"></i></div>`;
  const vazio = (icone, txt) => `<div class="empty">${ic(icone)}<p>${txt}</p></div>`;

  function origemTag(q) {
    if (q.origem === 'banca') return `<span class="tag banca">${esc(q.banca || 'IDECAN')} ${esc(q.ano || '')}</span>`;
    if (q.origem === 'semelhante') return `<span class="tag sem">Semelhante · ${esc(q.banca || '')} ${esc(q.ano || '')}</span>`;
    return '<span class="tag aut">Autoral · estilo IDECAN</span>';
  }
  function fonteHtml(q) {
    const partes = (q.origem === 'autoral' ? [] : [q.banca, q.ano, q.orgao, q.cargo]).filter(Boolean).map(esc).join(' · ');
    const u = q.fonte ? urlSegura(q.fonte) : '#';
    if (!partes && u === '#') return '';
    return `<p class="fonte">${partes}${u !== '#' ? `${partes ? ' · ' : ''}<a href="${esc(u)}" target="_blank" rel="noopener">fonte ${ic('ext', 'sm')}</a>` : ''}</p>`;
  }

  function heatmap(semanas = 16) {
    const h = new Date(); h.setHours(0, 0, 0, 0);
    const fim = new Date(h); fim.setDate(fim.getDate() + (6 - fim.getDay()));
    const ini = new Date(fim); ini.setDate(ini.getDate() - semanas * 7 + 1);
    let cols = '';
    for (let w = 0; w < semanas; w++) {
      let cel = '';
      for (let k = 0; k < 7; k++) {
        const dt = new Date(ini); dt.setDate(ini.getDate() + w * 7 + k);
        const key = ymd(dt);
        if (dt > h) { cel += '<i class="lf"></i>'; continue; }
        const p = progressoDia(key);
        const n = p === 0 ? 0 : p < 0.34 ? 1 : p < 0.67 ? 2 : p < 1 ? 3 : 4;
        cel += `<i class="l${n}" title="${fmtCurta(key)}: ${Math.round(p * 100)}% da meta"></i>`;
      }
      cols += `<span>${cel}</span>`;
    }
    return `<div class="heat">${cols}</div><div class="heat-leg"><span>Menos</span><i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i><span>Mais</span></div>`;
  }

  // Semana em curso; antes do início do plano (ou num buraco entre semanas), a próxima, com proxima = true.
  function semanaAtual() {
    const k = hoje(), ss = D.plano?.semanas || [];
    const w = ss.find(x => x.inicio <= k && k <= x.fim);
    if (w) return w;
    const prox = ss.filter(x => x.inicio > k).sort((a, b) => (a.inicio < b.inicio ? -1 : 1))[0];
    return prox ? Object.assign({ proxima: true }, prox) : null;
  }
  function chipAssunto(ref) {
    const [did, aid] = String(ref).split(':');
    const d = D.disc[did]; if (!d) return '';
    const a = aid && d.as[aid];
    return `<a class="chip on" style="--c:${d.cor}" href="${a ? `#/a/${did}/${aid}` : `#/d/${did}`}">${esc(a ? a.nome : d.nome)}</a>`;
  }
  function sugestoes(n = 3) {
    const k = hoje(), itens = [];
    for (const d of D.discs) for (const a of d.assuntos) {
      const q = qsDe(d.id, a.id), e = est(q);
      const cobertura = q.length ? e.resp / q.length : 0;
      const acerto = e.resp ? e.ok / e.resp : 0;
      const feito = S.concluidos[`${d.id}:${a.id}`] ? 0.5 : 0;
      itens.push({ d, a, s: d.peso * (1.2 - cobertura * 0.6 - acerto * 0.4 - feito) + hash01(k + a.id) * 0.4 });
    }
    return itens.sort((x, y) => y.s - x.s).slice(0, n);
  }

  // ---------- cronômetro de estudo ----------
  function pintarTimer() {
    const s = timerSeg(), on = !!S.timer;
    const t = `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(Math.floor(s) % 60).padStart(2, '0')}`;
    for (const b of $$('.js-timer')) {
      b.classList.toggle('rodando', on);
      b.innerHTML = on ? `${ic('pause')} ${t}` : `${ic('play')} Cronômetro`;
    }
    const min = Math.floor(segDo(hoje()) / 60);
    for (const el of $$('.js-min-hoje')) el.textContent = min;
    for (const el of $$('.js-bar-leitura')) el.style.width = `${Math.min(100, 100 * min / meta().minutosLeitura)}%`;
  }
  function alternarTimer() {
    if (S.timer) { dia().seg += timerSeg(); S.timer = null; toast('Tempo de estudo somado à meta de hoje'); }
    else S.timer = { inicio: Date.now() };
    salvar(); pintarTimer();
  }
  setInterval(() => { if (S.timer) pintarTimer(); if (QZ?.limite && QZ.fase === 'fazendo') relogioSimulado(); }, 1000);

  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('on');
    clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 3200);
  }

  // ---------- telas ----------
  function vInicio() {
    const c = D.idx.concurso, m = meta(), d = S.dias[hoje()] || {};
    const min = Math.floor(segDo(hoje()) / 60);
    const pq = Math.min(1, (d.questoes || 0) / m.questoes), pl = Math.min(1, min / m.minutosLeitura);
    const pv = m.videos ? Math.min(1, (d.videos || 0) / m.videos) : 1;
    const geral = 100 * progressoDia(hoje());
    const erradas = D.qs.filter(q => { const u = ultima(q.id); return u && !u.ok; }).length;
    const w = semanaAtual();
    const linha = (rot, val, alvo, p, acoes, cls = '') => `<div class="mrow"><div class="mrow-t"><b>${rot}</b><span>${val} / ${alvo}</span></div>
      <div class="bar"><i class="${cls}" style="width:${p * 100}%"></i></div><div class="mrow-a">${acoes}</div></div>`;
    return `
    <section class="hero">
      <div class="hero-txt">
        <span class="eyebrow">${esc(c.banca)} · ${esc(c.cargo)}</span>
        <h1>Faltam <span class="grad">${diasAte(c.dataProva)}</span> dias</h1>
        <p class="muted">${esc(fmtLonga(c.dataProva))} · ${esc(c.provaInfo)}</p>
        <div class="row gap wrap">
          ${S.ultimo ? `<a class="btn pri" href="${esc(S.ultimo.href)}">${ic('play')} Continuar: ${esc(S.ultimo.nome)}</a>`
                     : `<a class="btn pri" href="#/d/especificos">${ic('play')} Começar pelas específicas</a>`}
          <button class="btn" data-act="treino-rapido">${ic('questoes')} 10 questões agora</button>
        </div>
      </div>
      <div class="hero-ring">${anel(geral, 'da meta de hoje')}</div>
    </section>
    <div class="grid2">
      <section class="card">
        <div class="card-h"><h2>${ic('alvo')} Meta de hoje</h2><span class="streak">${ic('flame')} ${sequencia()} dia(s) seguidos</span></div>
        ${linha('Questões', d.questoes || 0, m.questoes, pq, '<button class="btn sm" data-act="treino-rapido">Fazer questões</button>')}
        ${linha('Leitura (min)', `<span class="js-min-hoje">${min}</span>`, m.minutosLeitura, pl,
          '<button class="btn sm js-timer" data-act="timer"></button><button class="btn sm ghost" data-act="mais15">+15 min</button>', 'js-bar-leitura')}
        ${m.videos ? linha('Vídeos', d.videos || 0, m.videos, pv, '<a class="btn sm" href="#/videos">Escolher vídeo</a>') : ''}
      </section>
      <section class="card">
        ${w ? `<div class="card-h"><h2>${ic('plano')} Semana ${esc(w.n)}</h2><span class="muted">${w.proxima ? `começa em ${fmtCurta(w.inicio)}` : `${fmtCurta(w.inicio)} – ${fmtCurta(w.fim)}`}</span></div>
          ${w.foco ? `<p class="foco">${esc(w.foco)}</p>` : ''}
          ${(w.assuntos || []).length ? `<div class="chips">${w.assuntos.map(chipAssunto).join('')}</div>` : ''}
          ${tarefasHtml(w)}`
            : `<div class="card-h"><h2>${ic('luz')} Sugestões para hoje</h2></div>`}
        <div class="sugs">${sugestoes(w ? 2 : 4).map(({ d: dd, a }) => `<a class="sug" href="#/a/${dd.id}/${a.id}" style="--c:${dd.cor}">
          <span class="dot"></span><span><b>${esc(a.nome)}</b><small>${esc(dd.nome)}</small></span>${ic('seta')}</a>`).join('') ||
          '<p class="muted">As sugestões aparecem quando as trilhas tiverem conteúdo.</p>'}</div>
      </section>
    </div>
    <section class="card">
      <div class="card-h"><h2>${ic('trofeu')} Seu desempenho</h2>
        ${erradas ? `<button class="btn sm" data-act="treino-erradas">${ic('refazer')} Revisar ${erradas} que errei</button>` : ''}</div>
      <div class="desemp">${D.discs.map(dd => {
        const e = est(qsDe(dd.id));
        return `<a class="drow" href="#/d/${dd.id}" style="--c:${dd.cor}"><span class="dot"></span>
          <span class="dn"><b>${esc(dd.nome)}</b><small>${dd.questoesNaProva} na prova · peso ${dd.peso}</small></span>
          ${barra(e.total ? 100 * e.resp / e.total : 0)}
          <span class="dp"><b>${e.pct ?? '–'}${e.pct != null ? '%' : ''}</b><small>${e.resp}/${e.total} feitas</small></span></a>`;
      }).join('')}</div>
    </section>
    <section class="card">
      <div class="card-h"><h2>${ic('plano')} Constância</h2><span class="muted">${sequencia()} dia(s) seguidos com a meta batida</span></div>
      ${heatmap()}
    </section>`;
  }

  function tarefasHtml(w) {
    const t = w.tarefas || [];
    if (!t.length) return '';
    return `<ul class="tasks">${t.map((x, i) => {
      const k = `${w.n}:${i}`;
      return `<li><label><input type="checkbox" data-act="tarefa" data-k="${esc(k)}" ${S.tarefas[k] ? 'checked' : ''}><span>${esc(x)}</span></label></li>`;
    }).join('')}</ul>`;
  }

  function vTrilhas() {
    return `<h1 class="pg">Trilhas</h1>
    <p class="sub">Uma trilha por disciplina do edital. Em cada assunto você encontra resumo, leituras, vídeos e questões.</p>
    <div class="cursos">${D.discs.map(d => {
      const q = qsDe(d.id), e = est(q);
      const nv = d.assuntos.reduce((s, a) => s + (a.videos?.length || 0), 0);
      const conc = d.assuntos.filter(a => S.concluidos[`${d.id}:${a.id}`]).length;
      return `<a class="curso" href="#/d/${d.id}" style="--c:${d.cor}">
        <div class="curso-capa">
          ${d.peso > 1 ? '<span class="fita">Vale 2/3 da nota</span>' : ''}
          <span class="badge">${d.questoesNaProva} questões · peso ${d.peso}</span>
          <h3>${esc(d.nome)}</h3>${d.area && d.area !== d.nome ? `<span class="area">${esc(d.area)}</span>` : ''}
        </div>
        <div class="curso-corpo">
          <div class="meta">${ic('trilhas')} ${d.assuntos.length} assuntos <span>${ic('video')} ${nv}</span> <span>${ic('questoes')} ${q.length}</span></div>
          ${barra(d.assuntos.length ? 100 * conc / d.assuntos.length : 0)}
          <div class="meta2">${d.pendente ? '<span class="pend">Conteúdo em preparação</span>' :
            `${conc}/${d.assuntos.length} concluídos${e.pct != null ? ` · ${e.pct}% de acerto` : ''}`}</div>
        </div></a>`;
    }).join('')}</div>`;
  }

  function vDisc(did) {
    const d = D.disc[did]; if (!d) return naoAchou();
    const q = qsDe(did), e = est(q);
    return `<nav class="crumbs"><a href="#/trilhas">Trilhas</a> <span>›</span> <span>${esc(d.nome)}</span></nav>
    <header class="dhead" style="--c:${d.cor}">
      <div><span class="eyebrow">${esc(d.area || '')}</span><h1>${esc(d.nome)}</h1>
        <p>${d.questoesNaProva} questões na prova · peso ${d.peso} · vale ${d.questoesNaProva * d.peso} dos 60 pontos</p>
        <p class="muted">${q.length} questões no banco${e.resp ? ` · ${e.resp} feitas · ${e.pct}% de acerto` : ''}</p></div>
      <div class="row gap wrap">${q.length ? `<button class="btn pri" data-act="treino-disc" data-d="${did}">${ic('questoes')} Praticar 10 questões</button>` : ''}</div>
    </header>
    ${d.pendente || !d.assuntos.length ? vazio('trilhas', 'O conteúdo desta trilha está sendo preparado e aparece aqui assim que ficar pronto.') :
      `<ol class="mods">${d.assuntos.map((a, k) => {
        const qa = qsDe(did, a.id), ea = est(qa), feito = S.concluidos[`${did}:${a.id}`];
        return `<li><a class="mod ${feito ? 'feito' : ''}" href="#/a/${did}/${a.id}">
          <span class="num">${feito ? ic('check') : String(k + 1).padStart(2, '0')}</span>
          <span class="mt"><b>${esc(a.nome)}</b><small>${ic('ler', 'sm')} ${a.leituras?.length || 0} leituras · ${ic('video', 'sm')} ${a.videos?.length || 0} vídeos · ${ic('questoes', 'sm')} ${qa.length} questões${ea.resp ? ` · ${ea.pct}% de acerto` : ''}</small></span>
          <span class="go">${ic('seta')}</span></a></li>`;
      }).join('')}</ol>`}`;
  }

  // ----- aula (assunto) -----
  let CTX = null; // { did, aid, tab }
  const ABAS = [
    ['resumo', 'Resumo', () => null],
    ['leitura', 'Leitura', a => a.leituras?.length || 0],
    ['videos', 'Vídeos', a => (a.videos || []).filter(v => ytOk(v.youtubeId)).length],
    ['questoes', 'Questões', (a, q) => q.length],
  ];
  const TIPO = { lei: 'Lei', norma: 'Norma', rdc: 'RDC', livro: 'Livro', apostila: 'Apostila', artigo: 'Artigo', site: 'Site' };

  function vAula(did, aid, aba) {
    const d = D.disc[did], a = d?.as[aid]; if (!a) return naoAchou();
    CTX = { did, aid, aba: ABAS.some(x => x[0] === aba) ? aba : 'resumo' };
    S.ultimo = { href: `#/a/${did}/${aid}`, nome: a.nome }; salvar();
    const vids = (a.videos || []).filter(v => ytOk(v.youtubeId));
    const q = qsDe(did, aid);
    const k = d.assuntos.indexOf(a), ant = d.assuntos[k - 1], prox = d.assuntos[k + 1];
    const feito = S.concluidos[`${did}:${aid}`];
    const conc = d.assuntos.filter(x => S.concluidos[`${did}:${x.id}`]).length;
    return `<nav class="crumbs"><a href="#/trilhas">Trilhas</a> <span>›</span> <a href="#/d/${did}">${esc(d.nome)}</a> <span>›</span> <span>${esc(a.nome)}</span></nav>
    <div class="aula" style="--c:${d.cor}">
      <div class="aula-main">
        ${vids.length ? `<div class="player" id="player">${poster(vids[0])}</div><div class="vinfo" id="vinfo">${vinfo(vids[0])}</div>`
          : `<div class="aula-capa"><span class="eyebrow">${esc(d.nome)} · assunto ${k + 1} de ${d.assuntos.length}</span></div>`}
        <h1 class="aula-t">${esc(a.nome)}</h1>
        <div class="tabs" role="tablist">${ABAS.map(([t, rot, n]) => {
          const c = n(a, q);
          return `<button class="tab ${t === CTX.aba ? 'on' : ''}" role="tab" data-act="aba" data-t="${t}">${rot}${c != null ? ` <span class="cnt">${c}</span>` : ''}</button>`;
        }).join('')}</div>
        <div id="abac">${abaHtml(d, a, CTX.aba)}</div>
        <div class="aula-nav">${ant ? `<a class="btn ghost" href="#/a/${did}/${ant.id}">${ic('volta')} Anterior</a>` : '<span></span>'}
          <div class="meio"><button class="btn js-concluir ${feito ? 'ok' : ''}" data-act="concluir" data-k="${did}:${aid}">${feito ? `${ic('check')} Concluído` : `${ic('check')} Concluir assunto`}</button>
          ${prox ? `<a class="btn pri" href="#/a/${did}/${prox.id}">Próximo: ${esc(prox.nome)} ${ic('seta')}</a>` : `<a class="btn" href="#/d/${did}">Voltar à trilha</a>`}</div></div>
      </div>
      <aside class="aula-side">
        <div class="side-h"><b>${esc(d.nome)}</b><small>${conc}/${d.assuntos.length} concluídos</small>${barra(d.assuntos.length ? 100 * conc / d.assuntos.length : 0, 'thin')}</div>
        <ol class="mini">${d.assuntos.map((x, i) => {
          const f = S.concluidos[`${did}:${x.id}`];
          return `<li><a class="${x.id === aid ? 'on' : ''} ${f ? 'feito' : ''}" href="#/a/${did}/${x.id}"><span class="num">${f ? ic('check') : i + 1}</span><span>${esc(x.nome)}</span></a></li>`;
        }).join('')}</ol>
        <button class="btn block js-concluir ${feito ? 'ok' : ''}" data-act="concluir" data-k="${did}:${aid}">${feito ? `${ic('check')} Assunto concluído` : 'Marcar assunto como concluído'}</button>
      </aside>
    </div>`;
  }

  const poster = v => `<button class="poster" data-act="play" data-y="${esc(v.youtubeId)}" style="background-image:url('https://i.ytimg.com/vi/${esc(v.youtubeId)}/hqdefault.jpg')" aria-label="Assistir ${esc(v.titulo)}"><span class="pbtn">${ic('play')}</span></button>`;
  const iframe = id => `<iframe src="https://www.youtube-nocookie.com/embed/${esc(id)}?autoplay=1&rel=0&modestbranding=1" title="Vídeo" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
  const vinfo = (v, extra = '') => {
    const visto = S.videos[v.youtubeId];
    return `<div><b>${esc(v.titulo)}</b><small>${esc(v.canal || '')}${v.duracao ? ` · ${esc(v.duracao)}` : ''}</small></div>
      <div class="row gap wrap"><button class="btn sm ${visto ? 'ok' : ''}" data-act="visto" data-y="${esc(v.youtubeId)}">${visto ? `${ic('check')} Assistido` : 'Marcar como assistido'}</button>${extra}</div>`;
  };
  const vinfoFeed = x => vinfo(x.v, `<a class="btn sm" href="#/a/${x.d.id}/${x.a.id}">${ic('trilhas')} Ir para a aula</a><button class="btn sm ghost" data-act="lb-fechar">${ic('x')} Fechar</button>`);
  const leituraHtml = l => {
    const lido = S.leituras[l.url];
    return `<li class="leitura ${lido ? 'feito' : ''}"><span class="rtipo">${esc(TIPO[l.tipo] || l.tipo || 'Link')}</span>
      <div class="rt"><a href="${esc(urlSegura(l.url))}" target="_blank" rel="noopener">${esc(l.titulo)} ${ic('ext', 'sm')}</a>
      ${l.nota ? `<small>${esc(l.nota)}</small>` : ''}${l.gratuito === false ? '<small class="warn">Pago</small>' : ''}</div>
      <button class="chk ${lido ? 'on' : ''}" data-act="lido" data-u="${esc(l.url)}" title="Marcar como lido" aria-label="Marcar como lido">${ic('check')}</button></li>`;
  };

  function abaHtml(d, a, aba) {
    const q = qsDe(d.id, a.id);
    if (aba === 'leitura') {
      const ls = a.leituras || [];
      return `<div class="dica">${ic('relogio')}<span>Ligue o cronômetro enquanto lê: os minutos entram na meta de hoje.</span><button class="btn sm js-timer" data-act="timer"></button></div>
      ${ls.length ? `<ul class="leituras">${ls.map(leituraHtml).join('')}</ul>` : vazio('ler', 'As leituras deste assunto ainda estão sendo separadas.')}`;
    }
    if (aba === 'videos') {
      const vs = (a.videos || []).filter(v => ytOk(v.youtubeId));
      return vs.length ? `<div class="vgrid">${vs.map((v, i) => `<button class="vcard ${S.videos[v.youtubeId] ? 'feito' : ''}" data-act="ver" data-i="${i}">
        <span class="thumb"><img loading="lazy" src="https://i.ytimg.com/vi/${esc(v.youtubeId)}/mqdefault.jpg" alt="">
        ${v.duracao ? `<span class="dur">${esc(v.duracao)}</span>` : ''}${S.videos[v.youtubeId] ? `<span class="visto">${ic('check')} visto</span>` : ''}</span>
        <span class="vt">${esc(v.titulo)}</span><small>${esc(v.canal || '')}</small></button>`).join('')}</div>`
        : vazio('video', 'Os vídeos deste assunto ainda estão sendo selecionados.');
    }
    if (aba === 'questoes') return q.length ? '<div id="quiz" class="quiz inline"></div>' : vazio('questoes', 'As questões deste assunto ainda estão sendo preparadas.');
    return `${a.edital ? `<div class="edital-box"><span>${ic('edital')} No edital</span><p>${esc(a.edital)}</p></div>` : ''}
      ${a.resumo ? `<div class="md resumo">${md(a.resumo)}</div>` : '<p class="muted">O resumo deste assunto ainda está sendo escrito. Comece pelas leituras e vídeos.</p>'}
      <div class="row gap wrap mt">${q.length ? `<button class="btn pri" data-act="aba" data-t="questoes">${ic('questoes')} Praticar ${q.length} questões</button>` : ''}
      ${a.leituras?.length ? `<button class="btn" data-act="aba" data-t="leitura">${ic('ler')} Ver leituras</button>` : ''}</div>`;
  }

  function trocarAba(t) {
    if (!CTX) return;
    CTX.aba = t;
    const d = D.disc[CTX.did], a = d.as[CTX.aid];
    $$('.tab').forEach(b => b.classList.toggle('on', b.dataset.t === t));
    $('#abac').innerHTML = abaHtml(d, a, t);
    history.replaceState(null, '', `#/a/${CTX.did}/${CTX.aid}${t === 'resumo' ? '' : '/' + t}`);
    if (t === 'questoes' && $('#quiz')) {
      const chave = `aula:${CTX.did}:${CTX.aid}`;
      if (!QZ || QZ.chave !== chave) novoQuiz(sortear(qsDe(CTX.did, CTX.aid)).map(q => q.id), a.nome, { chave, inline: true });
      desenharQuiz();
    }
    pintarTimer();
  }

  // ----- questões -----
  const F = { discs: new Set(), assunto: '', origem: '', status: 'todas', n: 10 };
  function filtrar() {
    return D.qs.filter(q => {
      if (F.discs.size && !F.discs.has(q.disciplina)) return false;
      if (F.assunto && `${q.disciplina}:${q.assunto}` !== F.assunto) return false;
      if (F.origem && (q.origem || 'autoral') !== F.origem) return false;
      const u = ultima(q.id);
      if (F.status === 'nao') return !u;
      if (F.status === 'erradas') return u && !u.ok;
      if (F.status === 'certas') return u && u.ok;
      return true;
    });
  }
  const opt = (v, rot, atual) => `<option value="${esc(v)}" ${String(atual) === String(v) ? 'selected' : ''}>${esc(rot)}</option>`;

  function vBanco() {
    const lista = filtrar();
    const visiveis = D.discs.filter(d => !F.discs.size || F.discs.has(d.id));
    return `<h1 class="pg">Banco de questões</h1>
    <p class="sub">${D.qs.length} questões. Filtre o que quer treinar. O sorteio puxa mais as que você errou ou ainda não fez, e a correção sai na hora.</p>
    <section class="card filtros">
      <div class="f"><label>Disciplinas</label><div class="chips">${D.discs.map(d => `<button class="chip ${F.discs.has(d.id) ? 'on' : ''}" style="--c:${d.cor}" data-act="fdisc" data-d="${d.id}">${esc(d.nome)} <small>${qsDe(d.id).length}</small></button>`).join('')}</div></div>
      <div class="f4">
        <div class="f"><label for="fa">Assunto</label><select id="fa" data-f="assunto">${opt('', 'Todos os assuntos', F.assunto)}
          ${visiveis.map(d => `<optgroup label="${esc(d.nome)}">${d.assuntos.map(a => opt(`${d.id}:${a.id}`, `${a.nome} (${qsDe(d.id, a.id).length})`, F.assunto)).join('')}</optgroup>`).join('')}</select></div>
        <div class="f"><label for="fo">Origem</label><select id="fo" data-f="origem">${opt('', 'Todas', F.origem)}${opt('banca', 'Provas da IDECAN', F.origem)}${opt('semelhante', 'Outras bancas', F.origem)}${opt('autoral', 'Autorais (estilo IDECAN)', F.origem)}</select></div>
        <div class="f"><label for="fs">Situação</label><select id="fs" data-f="status">${opt('todas', 'Todas', F.status)}${opt('nao', 'Ainda não fiz', F.status)}${opt('erradas', 'Errei da última vez', F.status)}${opt('certas', 'Acertei', F.status)}</select></div>
        <div class="f"><label for="fn">Quantas</label><select id="fn" data-f="n">${[5, 10, 20, 40].map(n => opt(n, `${n} questões`, F.n)).join('')}${opt(0, 'Todas', F.n)}</select></div>
      </div>
      <div class="row gap between wrap"><span class="muted"><b>${lista.length}</b> questões com esses filtros</span>
        <button class="btn pri" data-act="comecar" ${lista.length ? '' : 'disabled'}>${ic('play')} Começar treino</button></div>
    </section>
    <section class="card"><div class="card-h"><h2>${ic('trofeu')} Por disciplina</h2></div>
      <div class="tbl"><table><thead><tr><th>Disciplina</th><th>No banco</th><th>Feitas</th><th>Acerto</th><th></th></tr></thead><tbody>
      ${D.discs.map(d => { const e = est(qsDe(d.id)); return `<tr><td><span class="dot" style="--c:${d.cor}"></span> ${esc(d.nome)}</td><td>${e.total}</td><td>${e.resp}</td><td>${e.pct != null ? e.pct + '%' : '–'}</td>
        <td>${e.total ? `<button class="btn sm ghost" data-act="treino-disc" data-d="${d.id}">Treinar</button>` : ''}</td></tr>`; }).join('')}
      </tbody></table></div></section>`;
  }

  let QZ = null;
  function novoQuiz(ids, titulo, o = {}) {
    QZ = { ids, i: 0, titulo, modo: o.modo || 'treino', chave: o.chave || null, inline: !!o.inline, resp: {}, fase: 'fazendo',
      inicio: Date.now(), limite: o.minutos ? Date.now() + o.minutos * 60000 : null, confirmar: false };
  }
  function irQuiz(ids, titulo, o) {
    if (!ids.length) { toast('Nenhuma questão com esses filtros ainda.'); return; }
    novoQuiz(ids, titulo, o);
    if (location.hash === '#/quiz') rota(); else location.hash = '#/quiz';
  }
  const acertosQuiz = () => Object.entries(QZ.resp).filter(([id, k]) => D.q[id]?.correta === k).length;

  function desenharQuiz() {
    const el = $('#quiz'); if (!el || !QZ) return;
    el.innerHTML = QZ.fase === 'resultado' ? quizResultado() : quizCartao();
    if (QZ.limite) relogioSimulado();
  }

  function quizCartao() {
    const n = QZ.ids.length;
    const q = D.q[QZ.ids[QZ.i]];
    if (!q) return vazio('questoes', 'Nenhuma questão aqui.');
    const d = D.disc[q.disciplina], a = d?.as[q.assunto];
    const r = QZ.resp[q.id];
    const mostra = (QZ.modo === 'treino' && r !== undefined) || QZ.fase === 'revisao';
    const sim = QZ.modo === 'simulado' && QZ.fase === 'fazendo';
    const feitas = Object.keys(QZ.resp).length;
    return `<div class="qhead">
      <div class="qprog"><span>${esc(QZ.titulo || 'Treino')} · <b>${QZ.i + 1}</b> de ${n}</span>
        ${sim ? `<span class="simtimer js-sim-timer">${ic('relogio')} --:--</span>` : `<span>${acertosQuiz()} de ${feitas} certas</span>`}</div>
      ${barra(100 * (sim ? feitas : QZ.i + (mostra ? 1 : 0)) / n, 'thin')}</div>
    <article class="qcard" style="--c:${d?.cor || '#7c5cff'}">
      <div class="qtags"><span class="tag" style="--c:${d?.cor}">${esc(d?.nome || q.disciplina)}</span>${a ? `<span class="tag ghost">${esc(a.nome)}</span>` : ''}${origemTag(q)}</div>
      <div class="qenun md">${md(q.enunciado)}</div>
      <ol class="alts">${q.alternativas.map((t, k) => {
        let cls = '';
        if (mostra) cls = k === q.correta ? 'certa' : k === r ? 'errada' : 'apagada';
        else if (sim && r === k) cls = 'marcada';
        return `<li><button class="alt ${cls}" data-act="resp" data-k="${k}" ${mostra ? 'disabled' : ''}><span class="let">${LETRAS[k]}</span><span class="at">${mdi(t)}</span></button></li>`;
      }).join('')}</ol>
      ${mostra ? `<div class="feedback ${r === q.correta ? 'ok' : 'no'}">
        <b>${r === undefined ? `Em branco. Resposta: ${LETRAS[q.correta]}` : r === q.correta ? `${ic('check')} Você acertou!` : `${ic('x')} Não foi dessa vez. Resposta: ${LETRAS[q.correta]}`}</b>
        ${q.comentario ? `<div class="md">${md(q.comentario)}</div>` : ''}${fonteHtml(q)}</div>` : ''}
    </article>
    <div class="qnav">
      ${QZ.i > 0 ? `<button class="btn ghost" data-act="qant">${ic('volta')} Anterior</button>` : '<span></span>'}
      <div class="row gap">
      ${sim ? `${QZ.i < n - 1 ? `<button class="btn" data-act="qprox">Próxima ${ic('seta')}</button>` : ''}
              <button class="btn ${QZ.confirmar ? 'perigo' : 'pri'}" data-act="qentregar">${QZ.confirmar ? `Confirmar entrega (${n - feitas} em branco)` : 'Entregar simulado'}</button>`
        : QZ.fase === 'revisao' ? `${QZ.i < n - 1 ? `<button class="btn" data-act="qprox">Próxima ${ic('seta')}</button>` : ''}<button class="btn pri" data-act="qresultado">Ver resultado</button>`
        : mostra ? `<button class="btn pri" data-act="qprox">${QZ.i < n - 1 ? 'Próxima' : 'Ver resultado'} ${ic('seta')}</button>`
        : `<button class="btn ghost" data-act="qprox">Pular</button>`}
      </div>
    </div>
    ${QZ.modo === 'simulado' ? `<div class="qgrid">${QZ.ids.map((id, k) => {
      const rr = QZ.resp[id];
      const c = QZ.fase === 'fazendo' ? (rr !== undefined ? 'feita' : '') : (rr === undefined ? 'branco' : rr === D.q[id].correta ? 'certa' : 'errada');
      return `<button class="${c} ${k === QZ.i ? 'atual' : ''}" data-act="qir" data-k="${k}">${k + 1}</button>`;
    }).join('')}</div>` : ''}
    <p class="kbd">Atalhos no teclado: <kbd>A</kbd>–<kbd>D</kbd> responde · <kbd>Enter</kbd> avança</p>`;
  }

  function resultadoPorDisc() {
    const por = {};
    for (const id of QZ.ids) {
      const q = D.q[id]; const p = (por[q.disciplina] ||= { n: 0, ok: 0 });
      p.n++; if (QZ.resp[id] === q.correta) p.ok++;
    }
    return por;
  }

  function quizResultado() {
    const por = resultadoPorDisc();
    const n = QZ.ids.length, ok = acertosQuiz(), feitas = Object.keys(QZ.resp).length;
    const linhas = Object.entries(por).map(([did, p]) => {
      const d = D.disc[did];
      return `<tr><td><span class="dot" style="--c:${d.cor}"></span> ${esc(d.nome)}</td><td>${p.ok}/${p.n}</td>${QZ.modo === 'simulado' ? `<td>${p.ok * d.peso} / ${p.n * d.peso}</td>` : ''}</tr>`;
    }).join('');
    let topo;
    if (QZ.modo === 'simulado') {
      let pts = 0, max = 0, minimoOk = true;
      for (const [did, p] of Object.entries(por)) {
        const d = D.disc[did]; pts += p.ok * d.peso; max += p.n * d.peso;
        if (d.peso > 1 ? p.ok * d.peso < 2 : p.ok * d.peso < 1) minimoOk = false;
      }
      const passou = pts >= max / 2 && minimoOk;
      const min = Math.round((Math.min(QZ.fimTs || Date.now(), QZ.limite || Infinity) - QZ.inicio) / 60000);
      topo = `<div class="res ${passou ? 'ok' : 'no'}">${anel(max ? 100 * pts / max : 0, 'da nota')}
        <div><h2>${pts} de ${max} pontos</h2><p>${ok} acertos em ${n} questões · ${min} min</p>
        <p><b>${passou ? 'Dentro do mínimo do edital' : 'Abaixo do mínimo do edital'}</b>: ${passou ? 'mais de 50% e pontuação mínima em todas as disciplinas.' : 'precisa de 50% do total, 1 ponto em cada disciplina de Gerais e 2 em Específicas.'}</p></div></div>`;
    } else {
      topo = `<div class="res ${ok >= feitas * 0.7 ? 'ok' : 'no'}">${anel(feitas ? 100 * ok / feitas : 0, 'de acerto')}
        <div><h2>${ok} de ${feitas} certas</h2><p>${n - feitas ? `${n - feitas} pulada(s) · ` : ''}${D.qs.length ? 'O resultado já conta na sua meta de hoje.' : ''}</p></div></div>`;
    }
    const erradas = QZ.ids.filter(id => QZ.resp[id] !== undefined && QZ.resp[id] !== D.q[id].correta);
    return `${topo}
      <div class="tbl"><table><thead><tr><th>Disciplina</th><th>Acertos</th>${QZ.modo === 'simulado' ? '<th>Pontos</th>' : ''}</tr></thead><tbody>${linhas}</tbody></table></div>
      <div class="row gap wrap mt">
        <button class="btn" data-act="qrevisar">${ic('questoes')} Revisar questão por questão</button>
        ${erradas.length ? `<button class="btn pri" data-act="qerradas">${ic('refazer')} Refazer as ${erradas.length} que errei</button>` : ''}
        ${QZ.inline ? '' : '<a class="btn ghost" href="#/questoes">Novo treino</a>'}
      </div>`;
  }

  function finalizarSimulado() {
    QZ.fase = 'resultado'; QZ.fimTs = Date.now();
    for (const [id, k] of Object.entries(QZ.resp)) registrar(D.q[id], k);
    const por = resultadoPorDisc(); let pts = 0, max = 0;
    for (const [did, p] of Object.entries(por)) { pts += p.ok * D.disc[did].peso; max += p.n * D.disc[did].peso; }
    S.simulados.push({ ts: Date.now(), pts, max, n: QZ.ids.length, ok: acertosQuiz() });
    salvar(); desenharQuiz(); window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function relogioSimulado() {
    const resta = Math.max(0, QZ.limite - Date.now());
    const el = $('.js-sim-timer');
    if (el) el.innerHTML = `${ic('relogio')} ${Math.floor(resta / 3600000)}:${String(Math.floor(resta / 60000) % 60).padStart(2, '0')}:${String(Math.floor(resta / 1000) % 60).padStart(2, '0')}`;
    if (!resta && QZ.fase === 'fazendo') { toast('Tempo esgotado: simulado entregue.'); finalizarSimulado(); }
  }

  function vQuiz() {
    if (!QZ) return `<h1 class="pg">Treino</h1>${vazio('questoes', 'Escolha o que treinar no <a href="#/questoes">banco de questões</a>.')}`;
    return `<div class="quiz-pg"><div id="quiz" class="quiz"></div></div>`;
  }

  function vSimulado() {
    const comp = D.discs.map(d => ({ d, tem: qsDe(d.id).length }));
    const hist = (S.simulados || []).slice().reverse();
    return `<h1 class="pg">Simulado IDECAN</h1>
    <p class="sub">Como no dia da prova: 40 questões na proporção do edital, 3 horas, nota de 0 a 60 (peso 2 em Específicas). O gabarito só aparece quando você entrega.</p>
    <section class="card">
      <div class="tbl"><table><thead><tr><th>Disciplina</th><th>Na prova</th><th>No banco</th></tr></thead><tbody>
      ${comp.map(c => `<tr><td><span class="dot" style="--c:${c.d.cor}"></span> ${esc(c.d.nome)}</td><td>${c.d.questoesNaProva} × peso ${c.d.peso}</td>
        <td>${c.tem}${c.tem < c.d.questoesNaProva ? ' <small class="warn">ainda faltam questões</small>' : ''}</td></tr>`).join('')}
      </tbody></table></div>
      <div class="row gap wrap mt"><button class="btn pri" data-act="simulado" data-f="1">${ic('simulado')} Simulado completo (40 · 3h)</button>
        <button class="btn" data-act="simulado" data-f="0.5">Meio simulado (20 · 1h30)</button></div>
    </section>
    ${hist.length ? `<section class="card"><div class="card-h"><h2>${ic('trofeu')} Seus simulados</h2></div><ul class="hist">${hist.map(s =>
      `<li><span>${new Date(s.ts).toLocaleDateString('pt-BR')}</span><b>${s.pts}/${s.max} pontos</b><span>${s.ok}/${s.n} acertos</span>${barra(s.max ? 100 * s.pts / s.max : 0)}</li>`).join('')}</ul></section>` : ''}`;
  }

  function vPlano() {
    const p = D.plano, m = meta(), k = hoje(), wa = semanaAtual();
    return `<h1 class="pg">Plano de estudos</h1>
    <p class="sub">Meta diária: <b>${m.questoes} questões</b>, <b>${m.minutosLeitura} min de leitura</b>${m.videos ? ` e <b>${m.videos} vídeo(s)</b>` : ''}. Dá para mudar em <a href="#/ajustes">Progresso</a>.</p>
    <section class="card"><div class="card-h"><h2>${ic('flame')} Constância</h2><span class="muted">${sequencia()} dia(s) seguidos</span></div>${heatmap(20)}</section>
    ${p?.semanas?.length ? `<div class="semanas">${p.semanas.map(w => {
      const atual = wa && wa.n === w.n, passou = w.fim < k;
      const t = w.tarefas || [], feitas = t.filter((_, i) => S.tarefas[`${w.n}:${i}`]).length;
      return `<details class="semana ${atual ? 'atual' : ''} ${atual && wa.proxima ? 'proxima' : ''} ${passou ? 'passou' : ''}" ${atual ? 'open' : ''}>
        <summary><span class="wn">Semana ${esc(w.n)}</span><span class="wd">${fmtCurta(w.inicio)} – ${fmtCurta(w.fim)}</span>
        <span class="wf">${esc(w.foco || '')}</span><span class="wp">${feitas}/${t.length}</span></summary>
        <div class="semana-b">${(w.assuntos || []).length ? `<div class="chips">${w.assuntos.map(chipAssunto).join('')}</div>` : ''}${tarefasHtml(w)}</div></details>`;
    }).join('')}</div>` : vazio('plano', 'O cronograma semana a semana até a prova está sendo montado e aparece aqui assim que ficar pronto.')}`;
  }

  function vProvas() {
    const ps = D.provas.slice().sort((a, b) => (a.relevancia === 'alta' ? 0 : 1) - (b.relevancia === 'alta' ? 0 : 1) || (b.ano || 0) - (a.ano || 0));
    return `<h1 class="pg">Provas anteriores</h1>
    <p class="sub">Provas reais para resolver como treino de prova. Comece pelas da IDECAN em Campina Grande.</p>
    ${ps.length ? `<div class="provas">${ps.map(p => `<a class="prova ${p.relevancia === 'alta' ? 'alta' : ''}" href="${esc(urlSegura(p.url))}" target="_blank" rel="noopener">
      <div><b>${esc(p.titulo)}</b><small>${[p.banca, p.ano, p.orgao, p.cargo].filter(Boolean).map(esc).join(' · ')}</small>
      ${p.nota ? `<p>${esc(p.nota)}</p>` : ''}
      <div class="chips">${(p.disciplinas || []).map(id => D.disc[id] ? `<span class="chip on sm" style="--c:${D.disc[id].cor}">${esc(D.disc[id].nome)}</span>` : '').join('')}</div></div>
      <span class="go">${p.relevancia === 'alta' ? '<span class="tag banca">Alta relevância</span>' : ''}${ic('ext')}</span></a>`).join('')}</div>`
      : vazio('provas', 'A lista de provas anteriores está sendo montada.')}`;
  }

  function vEdital() {
    const docs = D.idx.documentos || [];
    return `<h1 class="pg">Edital</h1>
    ${docs.length ? `<div class="chips mb">${docs.map(x => `<a class="chip" href="${esc(urlSegura(x.url))}" target="_blank" rel="noopener">${ic('provas', 'sm')} ${esc(x.titulo)}</a>`).join('')}</div>` : ''}
    <section class="card"><div id="edital-md" class="md">Carregando o resumo do edital…</div></section>`;
  }
  async function carregarEdital() {
    const el = $('#edital-md'); if (!el) return;
    try {
      const r = await fetch('references/edital-resumo.md', { cache: 'no-cache' });
      if (!r.ok) throw new Error(r.status);
      el.innerHTML = md(await r.text());
    } catch { el.innerHTML = '<p class="muted">Não deu para carregar o resumo do edital agora.</p>'; }
  }

  function vAjustes() {
    const m = meta();
    const total = Object.keys(S.resp).length;
    return `<h1 class="pg">Progresso</h1>
    <p class="sub">Seu progresso fica salvo neste aparelho. Para levar do PC para o celular, exporte num e importe no outro: os históricos se somam.
      As respostas do pop-up do Windows ficam em <code>C:\\dev\\pessoal\\estudos\\popup\\progresso-popup.json</code>; importe esse arquivo aqui para juntar.</p>
    <div class="grid2">
      <section class="card"><div class="card-h"><h2>${ic('alvo')} Meta diária</h2></div>
        <div class="f3">
          <div class="f"><label for="mq">Questões</label><input id="mq" type="number" min="1" max="300" value="${m.questoes}"></div>
          <div class="f"><label for="ml">Leitura (min)</label><input id="ml" type="number" min="0" max="600" value="${m.minutosLeitura}"></div>
          <div class="f"><label for="mv">Vídeos</label><input id="mv" type="number" min="0" max="20" value="${m.videos}"></div>
        </div>
        <div class="row gap mt"><button class="btn pri" data-act="salvar-meta">Salvar meta</button>${S.meta ? '<button class="btn ghost" data-act="meta-padrao">Usar a do plano</button>' : ''}</div>
      </section>
      <section class="card"><div class="card-h"><h2>${ic('baixar')} Levar para outro aparelho</h2></div>
        <p class="muted">${total} questões respondidas · ${Object.keys(S.videos).length} vídeos · ${Object.keys(S.concluidos).length} assuntos concluídos.</p>
        <div class="row gap wrap"><button class="btn" data-act="exportar">${ic('baixar')} Exportar progresso</button>
          <label class="btn">${ic('subir')} Importar arquivo<input id="importar" type="file" accept=".json,application/json" hidden></label></div>
        <div class="row gap mt"><button class="btn ghost perigo-txt" data-act="zerar">${confirmarZerar ? 'Clique de novo para apagar tudo' : 'Apagar meu progresso'}</button></div>
      </section>
    </div>`;
  }

  // ----- biblioteca (todas as leituras) e vídeos (feed) -----
  const TIPO_PL = { lei: 'Leis', norma: 'Normas', rdc: 'RDCs', livro: 'Livros', apostila: 'Apostilas', artigo: 'Artigos', site: 'Sites' };
  const BIB = { tipo: '', disc: '' };
  const FEED = { disc: '', pendentes: false };
  const chipF = (act, val, rot, atual, cor) =>
    `<button class="chip ${atual === val ? 'on' : ''}" ${cor ? `style="--c:${cor}"` : ''} data-act="${act}" data-v="${esc(val)}">${rot}</button>`;
  const tipoDe = l => (TIPO[l.tipo] ? l.tipo : 'site');

  function vBiblioteca() {
    const todos = [];
    for (const d of D.discs) for (const a of d.assuntos) for (const l of a.leituras || []) todos.push({ d, a, l });
    const tipos = Object.keys(TIPO).filter(t => todos.some(x => tipoDe(x.l) === t));
    const vis = todos.filter(x => (!BIB.tipo || tipoDe(x.l) === BIB.tipo) && (!BIB.disc || x.d.id === BIB.disc));
    const lidas = todos.filter(x => S.leituras[x.l.url]).length;
    const grupos = [];
    for (const x of vis) {
      let g = grupos[grupos.length - 1];
      if (!g || g.a !== x.a) grupos.push(g = { d: x.d, a: x.a, ls: [] });
      g.ls.push(x.l);
    }
    return `<h1 class="pg">Biblioteca</h1>
    <p class="sub">Tudo o que há para ler, na ordem do edital: leis, normas, resoluções, livros e apostilas gratuitos. Você marcou <b>${lidas}</b> de ${todos.length} como lidas.</p>
    <section class="card filtros">
      <div class="f"><label>Tipo</label><div class="chips">${chipF('bib-tipo', '', 'Todos', BIB.tipo)}${tipos.map(t => chipF('bib-tipo', t, `${TIPO_PL[t]} <small>${todos.filter(x => tipoDe(x.l) === t).length}</small>`, BIB.tipo)).join('')}</div></div>
      <div class="f"><label>Disciplina</label><div class="chips">${chipF('bib-disc', '', 'Todas', BIB.disc)}${D.discs.filter(d => todos.some(x => x.d === d)).map(d => chipF('bib-disc', d.id, esc(d.nome), BIB.disc, d.cor)).join('')}</div></div>
    </section>
    ${grupos.length ? grupos.map((g, i) => `${i === 0 || grupos[i - 1].d !== g.d ? `<h2 class="bib-d" style="--c:${g.d.cor}"><span class="dot"></span>${esc(g.d.nome)}</h2>` : ''}
      <div class="bib-a"><a href="#/a/${g.d.id}/${g.a.id}">${esc(g.a.nome)} ${ic('seta', 'sm')}</a></div>
      <ul class="leituras" style="--c:${g.d.cor}">${g.ls.map(leituraHtml).join('')}</ul>`).join('') : vazio('ler', 'Nenhuma leitura com esses filtros.')}`;
  }

  function feedLista() {
    const out = [];
    for (const d of D.discs) for (const a of d.assuntos) for (const v of a.videos || []) if (ytOk(v.youtubeId)) out.push({ d, a, v });
    return out;
  }
  function gridFeed() {
    const vis = feedLista().filter(x => (!FEED.disc || x.d.id === FEED.disc) && (!FEED.pendentes || !S.videos[x.v.youtubeId]));
    return vis.length ? `<div class="vgrid">${vis.map(({ d, a, v }) => `<button class="vcard ${S.videos[v.youtubeId] ? 'feito' : ''}" data-act="feed-play" data-y="${esc(v.youtubeId)}" style="--c:${d.cor}">
      <span class="thumb"><img loading="lazy" src="https://i.ytimg.com/vi/${esc(v.youtubeId)}/mqdefault.jpg" alt="">
      ${v.duracao ? `<span class="dur">${esc(v.duracao)}</span>` : ''}${S.videos[v.youtubeId] ? `<span class="visto">${ic('check')} visto</span>` : ''}</span>
      <span class="vt">${esc(v.titulo)}</span><small><span class="dot"></span>${esc(a.nome)}${v.canal ? ` · ${esc(v.canal)}` : ''}</small></button>`).join('')}</div>`
      : vazio('video', FEED.pendentes ? 'Você já assistiu a todos os vídeos com esse filtro. 🎉' : 'Nenhum vídeo com esses filtros.');
  }
  function vVideos() {
    const todos = feedLista(), vistos = todos.filter(x => S.videos[x.v.youtubeId]).length;
    return `<h1 class="pg">Vídeos</h1>
    <p class="sub">As aulas do YouTube de cada assunto do edital, num lugar só. Você assistiu <b>${vistos}</b> de ${todos.length}.</p>
    <section class="card filtros">
      <div class="f"><label>Disciplina</label><div class="chips">${chipF('feed-disc', '', 'Todas', FEED.disc)}${D.discs.filter(d => todos.some(x => x.d === d)).map(d => chipF('feed-disc', d.id, `${esc(d.nome)} <small>${todos.filter(x => x.d === d).length}</small>`, FEED.disc, d.cor)).join('')}</div></div>
      <div class="f"><label>Mostrar</label><div class="chips">${chipF('feed-pend', '', 'Todos', FEED.pendentes ? '1' : '')}${chipF('feed-pend', '1', 'Só os que ainda não vi', FEED.pendentes ? '1' : '')}</div></div>
    </section>
    <div id="feed-grid">${gridFeed()}</div>
    <div class="lb" id="lb" hidden><div class="lb-box"><div class="player" id="lb-player"></div><div class="vinfo" id="lb-info"></div></div></div>`;
  }
  function fecharLb() {
    const lb = $('#lb'); if (!lb) return;
    $('#lb-player').innerHTML = ''; lb.hidden = true; document.body.classList.remove('travado');
  }

  function vMais() {
    const it = [['#/biblioteca', 'ler', 'Biblioteca', 'Leis, normas e livros na ordem do edital'], ['#/videos', 'video', 'Vídeos', 'Todas as aulas do YouTube por assunto'],
      ['#/simulado', 'simulado', 'Simulado', 'Prova completa cronometrada'], ['#/provas', 'provas', 'Provas anteriores', 'Provas reais da banca'],
      ['#/edital', 'edital', 'Edital', 'Resumo, datas e conteúdo'], ['#/ajustes', 'ajustes', 'Progresso', 'Meta diária, exportar e importar']];
    return `<h1 class="pg">Mais</h1><div class="maisl">${it.map(([h, i, t, s]) => `<a href="${h}">${ic(i)}<span><b>${t}</b><small>${s}</small></span>${ic('seta')}</a>`).join('')}</div>`;
  }

  const naoAchou = () => `<h1 class="pg">Página não encontrada</h1>${vazio('trilhas', '<a href="#/">Voltar ao início</a>')}`;

  // ---------- rotas ----------
  const ROTAS = [
    [/^#?\/?$/, () => vInicio(), 'inicio'],
    [/^#\/trilhas$/, () => vTrilhas(), 'trilhas'],
    [/^#\/d\/([\w-]+)$/, m => vDisc(m[1]), 'trilhas'],
    [/^#\/a\/([\w-]+)\/([\w-]+)(?:\/(\w+))?$/, m => vAula(m[1], m[2], m[3]), 'trilhas'],
    [/^#\/questoes$/, () => vBanco(), 'questoes'],
    [/^#\/quiz$/, () => vQuiz(), 'questoes'],
    [/^#\/simulado$/, () => vSimulado(), 'simulado'],
    [/^#\/biblioteca$/, () => vBiblioteca(), 'biblioteca'],
    [/^#\/videos$/, () => vVideos(), 'videos'],
    [/^#\/plano$/, () => vPlano(), 'plano'],
    [/^#\/provas$/, () => vProvas(), 'provas'],
    [/^#\/edital$/, () => vEdital(), 'edital'],
    [/^#\/ajustes$/, () => vAjustes(), 'ajustes'],
    [/^#\/mais$/, () => vMais(), 'mais'],
  ];
  const NAV = [['#/', 'home', 'Início', 'inicio'], ['#/trilhas', 'trilhas', 'Trilhas', 'trilhas'], ['#/questoes', 'questoes', 'Questões', 'questoes'],
    ['#/simulado', 'simulado', 'Simulado', 'simulado'], ['#/biblioteca', 'ler', 'Biblioteca', 'biblioteca'], ['#/videos', 'video', 'Vídeos', 'videos'],
    ['#/plano', 'plano', 'Plano', 'plano'], ['#/provas', 'provas', 'Provas', 'provas'],
    ['#/edital', 'edital', 'Edital', 'edital'], ['#/ajustes', 'ajustes', 'Progresso', 'ajustes']];
  const NAV_CEL = ['inicio', 'trilhas', 'questoes', 'plano'];

  function rota() {
    const h = location.hash || '#/';
    let html = naoAchou(), sec = '';
    for (const [re, fn, s] of ROTAS) { const m = h.match(re); if (m) { CTX = null; html = fn(m); sec = s; break; } }
    document.body.classList.remove('travado');
    $('#view').innerHTML = html;
    const noMais = ['simulado', 'biblioteca', 'videos', 'provas', 'edital', 'ajustes', 'mais'].includes(sec);
    $$('[data-sec]').forEach(a => a.classList.toggle('on', a.dataset.sec === sec || (a.dataset.sec === 'mais' && noMais)));
    if (sec === 'questoes' && h === '#/quiz') desenharQuiz();
    if (CTX?.aba === 'questoes') trocarAba('questoes');
    if (sec === 'edital') carregarEdital();
    pintarTimer();
    window.scrollTo(0, 0);
  }

  // ---------- ações ----------
  const A = {
    timer: () => alternarTimer(),
    mais15: () => { dia().seg += 900; salvar(); pintarTimer(); toast('+15 min de leitura na meta de hoje'); },
    'treino-rapido': () => irQuiz(sortear(D.qs, 10).map(q => q.id), 'Treino rápido'),
    'treino-disc': b => irQuiz(sortear(qsDe(b.dataset.d), 10).map(q => q.id), D.disc[b.dataset.d].nome),
    'treino-erradas': () => irQuiz(sortear(D.qs.filter(q => { const u = ultima(q.id); return u && !u.ok; })).map(q => q.id), 'Revisão de erros'),
    tarefa: () => {},
    aba: b => trocarAba(b.dataset.t),
    concluir: b => {
      const k = b.dataset.k;
      if (S.concluidos[k]) delete S.concluidos[k]; else { S.concluidos[k] = Date.now(); toast('Assunto concluído ✔'); }
      salvar(); const y = window.scrollY; rota(); window.scrollTo(0, y);
    },
    play: b => { $('#player').innerHTML = iframe(b.dataset.y); },
    ver: b => {
      const a = D.disc[CTX.did].as[CTX.aid];
      const v = (a.videos || []).filter(x => ytOk(x.youtubeId))[Number(b.dataset.i)];
      $('#player').innerHTML = iframe(v.youtubeId); $('#vinfo').innerHTML = vinfo(v);
      $('#player').scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    visto: b => {
      const id = b.dataset.y;
      if (S.videos[id]) {
        if (ymd(new Date(S.videos[id])) === hoje()) dia().videos = Math.max(0, (dia().videos || 0) - 1);
        delete S.videos[id];
      } else { S.videos[id] = Date.now(); dia().videos = (dia().videos || 0) + 1; if (dia().videos === meta().videos) toast('Meta de vídeos de hoje batida! 🎬'); }
      salvar();
      const x = D.vid[id];
      if (CTX) {
        const a = D.disc[CTX.did].as[CTX.aid];
        $('#vinfo').innerHTML = vinfo((a.videos || []).find(v => v.youtubeId === id) || x.v);
        if (CTX.aba === 'videos') $('#abac').innerHTML = abaHtml(D.disc[CTX.did], a, 'videos');
      } else if ($('#lb-info') && x) {
        $('#lb-info').innerHTML = vinfoFeed(x);
        $('#feed-grid').innerHTML = gridFeed();
      }
    },
    'feed-play': b => {
      const x = D.vid[b.dataset.y]; if (!x) return;
      $('#lb-player').innerHTML = iframe(x.v.youtubeId);
      $('#lb-info').innerHTML = vinfoFeed(x);
      $('#lb').hidden = false; document.body.classList.add('travado');
    },
    'lb-fechar': () => fecharLb(),
    'bib-tipo': b => { BIB.tipo = b.dataset.v; rota(); },
    'bib-disc': b => { BIB.disc = b.dataset.v; rota(); },
    'feed-disc': b => { FEED.disc = b.dataset.v; rota(); },
    'feed-pend': b => { FEED.pendentes = b.dataset.v === '1'; rota(); },
    lido: b => {
      const u = b.dataset.u;
      if (S.leituras[u]) delete S.leituras[u]; else S.leituras[u] = Date.now();
      salvar(); b.classList.toggle('on', !!S.leituras[u]); b.closest('.leitura').classList.toggle('feito', !!S.leituras[u]);
    },
    fdisc: b => { const d = b.dataset.d; F.discs.has(d) ? F.discs.delete(d) : F.discs.add(d); if (F.assunto && !F.assunto.startsWith(d + ':') && F.discs.size) F.assunto = ''; rota(); },
    comecar: () => irQuiz(sortear(filtrar(), F.n).map(q => q.id), 'Treino'),
    resp: b => {
      const q = D.q[QZ.ids[QZ.i]], k = Number(b.dataset.k);
      if (QZ.modo === 'simulado') { if (QZ.fase !== 'fazendo') return; QZ.resp[q.id] = k; QZ.confirmar = false; desenharQuiz(); return; }
      if (QZ.resp[q.id] !== undefined) return;
      QZ.resp[q.id] = k; registrar(q, k); desenharQuiz();
    },
    qprox: () => {
      if (QZ.i < QZ.ids.length - 1) QZ.i++;
      else if (QZ.modo === 'treino') QZ.fase = 'resultado';
      desenharQuiz(); rolarQuiz();
    },
    qant: () => { if (QZ.i > 0) QZ.i--; desenharQuiz(); rolarQuiz(); },
    qir: b => { QZ.i = Number(b.dataset.k); desenharQuiz(); },
    qentregar: () => { if (!QZ.confirmar) { QZ.confirmar = true; desenharQuiz(); return; } finalizarSimulado(); },
    qrevisar: () => { QZ.fase = 'revisao'; QZ.i = 0; desenharQuiz(); rolarQuiz(); },
    qresultado: () => { QZ.fase = 'resultado'; desenharQuiz(); rolarQuiz(); },
    qerradas: () => {
      const ids = QZ.ids.filter(id => QZ.resp[id] !== undefined && QZ.resp[id] !== D.q[id].correta);
      const inline = QZ.inline, chave = QZ.chave;
      novoQuiz(ids, 'Refazendo as que errei', { inline, chave }); desenharQuiz(); rolarQuiz();
    },
    simulado: b => {
      const f = Number(b.dataset.f) || 1;
      const ids = D.discs.flatMap(d => sortear(qsDe(d.id), Math.max(1, Math.round(d.questoesNaProva * f))).map(q => q.id));
      irQuiz(ids, f < 1 ? 'Meio simulado' : 'Simulado', { modo: 'simulado', minutos: Math.round(180 * f) });
    },
    'salvar-meta': () => {
      const n = (id, min) => Math.max(min, Number($(id).value) || 0);
      S.meta = { questoes: n('#mq', 1), minutosLeitura: n('#ml', 0), videos: n('#mv', 0) };
      salvar(); toast('Meta salva'); rota();
    },
    'meta-padrao': () => { S.meta = null; salvar(); rota(); },
    exportar: () => {
      const dados = Object.assign({}, S, { timer: null });
      const blob = new Blob([JSON.stringify(dados)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `progresso-estudos-${hoje()}.json`;
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    },
    zerar: () => {
      if (!confirmarZerar) { confirmarZerar = true; rota(); setTimeout(() => { confirmarZerar = false; }, 5000); return; }
      localStorage.removeItem(CHAVE); location.reload();
    },
  };

  function rolarQuiz() {
    const el = $('#quiz'); if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    if (window.scrollY > top || QZ.inline) window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }

  function mesclar(o) {
    if (!o || typeof o !== 'object' || !o.resp) throw new Error('arquivo sem progresso');
    // Respostas novas (de outro aparelho ou do pop-up do Windows) entram no histórico e na meta do dia em que foram feitas.
    let novas = 0;
    for (const [id, h] of Object.entries(o.resp)) {
      if (!Array.isArray(h)) continue;
      const cur = S.resp[id] || [], ts = new Set(cur.map(x => x.ts));
      const add = h.filter(x => x && typeof x.ts === 'number' && !ts.has(x.ts));
      for (const x of add) { const d = dia(ymd(new Date(x.ts))); d.questoes++; if (x.ok) d.acertos++; }
      novas += add.length;
      S.resp[id] = cur.concat(add).sort((a, b) => a.ts - b.ts).slice(-20);
    }
    for (const k of ['videos', 'leituras', 'concluidos', 'tarefas']) Object.assign(S[k], o[k] || {});
    for (const [k, v] of Object.entries(o.dias || {})) {
      const c = dia(k);
      c.seg = Math.max(c.seg || 0, v.seg || 0); c.videos = Math.max(c.videos || 0, v.videos || 0);
    }
    const sims = new Map([...(S.simulados || []), ...(o.simulados || [])].map(s => [s.ts, s]));
    S.simulados = [...sims.values()].sort((a, b) => a.ts - b.ts);
    salvar();
    return novas;
  }

  document.addEventListener('click', e => {
    if (e.target.id === 'lb') { fecharLb(); return; }
    const b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    const fn = A[b.dataset.act];
    if (!fn) return;
    if (b.tagName !== 'INPUT') e.preventDefault();
    fn(b, e);
  });
  document.addEventListener('change', async e => {
    const t = e.target;
    if (t.dataset.f && t.tagName === 'SELECT') { F[t.dataset.f] = t.dataset.f === 'n' ? Number(t.value) : t.value; rota(); return; }
    if (t.dataset.act === 'tarefa') { if (t.checked) S.tarefas[t.dataset.k] = Date.now(); else delete S.tarefas[t.dataset.k]; salvar(); return; }
    if (t.id === 'importar' && t.files[0]) {
      try { const n = mesclar(JSON.parse(await t.files[0].text())); toast(`Importado: ${n} resposta(s) nova(s) somada(s)`); rota(); }
      catch (err) { toast(`Não deu para importar: ${err.message}`); }
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && $('#lb') && !$('#lb').hidden) { fecharLb(); return; }
    if (!QZ || !$('#quiz') || e.ctrlKey || e.metaKey || e.altKey || /INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName)) return;
    const k = e.key.toUpperCase();
    const idx = 'ABCDE'.indexOf(k) >= 0 ? 'ABCDE'.indexOf(k) : '12345'.indexOf(k);
    if (idx >= 0) { const b = $(`#quiz .alt[data-k="${idx}"]`); if (b && !b.disabled) { b.click(); e.preventDefault(); } }
    else if (e.key === 'Enter') { const b = $('#quiz [data-act="qprox"]') || $('#quiz [data-act="qresultado"]'); if (b) { b.click(); e.preventDefault(); } }
  });
  window.addEventListener('hashchange', rota);

  // ---------- moldura ----------
  function moldura() {
    const c = D.idx.concurso;
    $('#nav').innerHTML = NAV.map(([h, i, t, s]) => `<a href="${h}" data-sec="${s}">${ic(i)}<span>${t}</span></a>`).join('');
    $('#bottom').innerHTML = NAV.filter(n => NAV_CEL.includes(n[3])).map(([h, i, t, s]) => `<a href="${h}" data-sec="${s}">${ic(i)}<span>${t}</span></a>`).join('') +
      `<a href="#/mais" data-sec="mais">${ic('mais')}<span>Mais</span></a>`;
    $('#side-count').innerHTML = `<b>${diasAte(c.dataProva)}</b><span>dias para a prova<br><small>${new Date(c.dataProva).toLocaleDateString('pt-BR')} · ${esc(c.banca)}</small></span>`;
  }

  (async () => {
    try { await carregar(); }
    catch (e) {
      $('#view').innerHTML = `<h1 class="pg">Não deu para carregar</h1>${vazio('x', `Os dados não abriram (${esc(e.message)}). Se abriu o arquivo direto do disco, rode <code>python -m http.server 8080</code> na pasta e use http://localhost:8080.`)}`;
      return;
    }
    moldura(); rota();
    if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
  })();
})();

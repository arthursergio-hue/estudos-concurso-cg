/* Markdown mínimo e seguro: escapa todo HTML e só gera títulos, listas, tabelas, citações, links, figuras, negrito,
   itálico e código. Usado no resumo dos assuntos, no enunciado/comentário das questões e no edital. */
(function () {
  'use strict';
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const MARCADOR = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;

  function urlOk(u) {
    return /^https?:\/\//i.test(u) || /^(#|\.{0,2}\/|[\w-]+\/)/.test(u);
  }

  // Figura: só caminho do próprio site (data/...) ou https.
  const imgOk = u => (/^https:\/\//i.test(u) || /^data\/[\w./%-]+$/.test(u)) && !/\.\./.test(u);

  function inline(s) {
    s = esc(String(s ?? ''));
    const guardados = [];
    const guarda = h => { guardados.push(h); return `\u0000${guardados.length - 1}\u0000`; };
    s = s.replace(/`([^`]+)`/g, (m, c) => guarda(`<code>${c}</code>`));
    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, alt, u) =>
      imgOk(u) ? guarda(`<img class="mdimg" src="${u}" alt="${alt}" loading="lazy">`) : alt);
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) =>
      urlOk(u) ? `<a href="${u}" target="_blank" rel="noopener">${t}</a>` : t);
    s = s.replace(/\+\+([^+\n][^+]*?)\+\+/g, '<u>$1</u>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\w)/g, '$1<em>$2</em>');
    s = s.replace(/\u0000(\d+)\u0000/g, (m, i) => guardados[i]);
    return s;
  }

  // Linha terminada em "\" quebra a linha dentro do parágrafo ou do item (poema, letra de música, endereço).
  const juntar = ls => inline(ls.map(l => (/\\$/.test(l) ? `${l.slice(0, -1).trimEnd()}\u0001` : l)).join(' ')).replace(/\u0001 ?/g, '<br>');

  const recuo = l => l.match(/^(\s*)/)[1].replace(/\t/g, '    ').length;

  function lista(linhas, i) {
    const m0 = linhas[i].match(MARCADOR);
    const base = recuo(linhas[i]);
    const ordenada = /\d/.test(m0[2]);
    const itens = [];
    while (i < linhas.length) {
      const l = linhas[i];
      const m = l.match(MARCADOR);
      if (m && recuo(l) === base) { itens.push({ txt: [m[3]], sub: '' }); i++; continue; }
      if (m && recuo(l) > base && itens.length) {
        const r = lista(linhas, i); itens[itens.length - 1].sub += r.html; i = r.i; continue;
      }
      if (!l.trim()) {
        const prox = linhas[i + 1];
        if (prox && MARCADOR.test(prox) && recuo(prox) >= base) { i++; continue; }
        break;
      }
      if (itens.length && recuo(l) > base) { itens[itens.length - 1].txt.push(l.trim()); i++; continue; }
      break;
    }
    const tag = ordenada ? 'ol' : 'ul';
    const html = `<${tag}>${itens.map(it => `<li>${juntar(it.txt)}${it.sub}</li>`).join('')}</${tag}>`;
    return { html, i };
  }

  const celulas = l => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
  const inicioDeBloco = (l, prox) =>
    /^#{1,6}\s/.test(l) || MARCADOR.test(l) || /^\s*>/.test(l) || /^(-{3,}|\*{3,})\s*$/.test(l) ||
    (/^\s*\|.*\|\s*$/.test(l) && prox && /^\s*\|?\s*:?-{2,}/.test(prox));

  function render(src) {
    const linhas = String(src ?? '').replace(/<!--[\s\S]*?-->/g, '').replace(/\r\n?/g, '\n').split('\n');
    const out = [];
    let i = 0;
    while (i < linhas.length) {
      const l = linhas[i];
      if (!l.trim()) { i++; continue; }
      let m;
      if ((m = l.match(/^(#{1,6})\s+(.*)$/))) {
        const n = Math.min(6, m[1].length + 1);
        out.push(`<h${n}>${inline(m[2])}</h${n}>`); i++; continue;
      }
      if (/^(-{3,}|\*{3,})\s*$/.test(l)) { out.push('<hr>'); i++; continue; }
      if (/^\s*\|.*\|\s*$/.test(l) && linhas[i + 1] && /^\s*\|?\s*:?-{2,}/.test(linhas[i + 1])) {
        const cab = celulas(l); i += 2;
        const corpo = [];
        while (i < linhas.length && /^\s*\|/.test(linhas[i])) { corpo.push(celulas(linhas[i])); i++; }
        out.push(`<div class="tbl"><table><thead><tr>${cab.map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead>` +
          `<tbody>${corpo.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
        continue;
      }
      if (/^\s*>/.test(l)) {
        const bloco = [];
        while (i < linhas.length && /^\s*>/.test(linhas[i])) { bloco.push(linhas[i].replace(/^\s*>\s?/, '')); i++; }
        out.push(`<blockquote>${render(bloco.join('\n'))}</blockquote>`); continue;
      }
      if (MARCADOR.test(l)) { const r = lista(linhas, i); out.push(r.html); i = r.i; continue; }
      const par = [];
      while (i < linhas.length && linhas[i].trim() && !(par.length && inicioDeBloco(linhas[i], linhas[i + 1]))) {
        par.push(linhas[i].trim()); i++;
      }
      out.push(`<p>${juntar(par)}</p>`);
    }
    return out.join('\n');
  }

  window.md = render;
  window.mdInline = inline;
})();

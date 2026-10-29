"""Confere todos os dados do site antes de publicar (rode na raiz: python scripts/validar_dados.py).

Erros (o site mostra errado ou quebra): JSON inválido, id repetido, "correta" fora das alternativas, assunto ou
texto de apoio que não existe, figura que não existe. Avisos (vale olhar): comentário com menos de 400 caracteres ou
sem as partes **Por que** e **As outras**, figura pesada, questão sem assunto, link sem https.
Sai com código 1 se houver erro.
"""
import json
import re
import sys
from collections import Counter
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
erros, avisos = [], []
ORIGENS = {"banca", "semelhante", "autoral"}
IMG_MD = re.compile(r"!\[[^\]]*\]\(([^)\s]+)\)")


def ler(rel):
    p = RAIZ / rel
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return None
    except (json.JSONDecodeError, UnicodeDecodeError) as e:
        erros.append(f"{rel}: JSON inválido ({e})")
        return None


def figura(onde, caminho):
    if not caminho or caminho.startswith("https://"):
        return
    if ".." in caminho or not caminho.startswith("data/"):
        erros.append(f"{onde}: caminho de figura fora de data/: {caminho}")
        return
    f = RAIZ / caminho
    if not f.exists():
        erros.append(f"{onde}: figura não existe: {caminho}")
    elif f.stat().st_size > 200_000:
        avisos.append(f"{onde}: figura com {f.stat().st_size // 1000} KB (ideal até 150 KB): {caminho}")


def figuras_md(onde, *textos):
    for t in textos:
        for c in IMG_MD.findall(str(t or "")):
            figura(onde, c)


def questao(onde, q, discs, assuntos, ids, textos=None):
    qid = q.get("id")
    if not qid:
        erros.append(f"{onde}: questão sem id")
        return
    ids[qid] += 1
    alts = q.get("alternativas")
    if not isinstance(alts, list) or not 4 <= len(alts) <= 5 or not all(isinstance(a, str) and a.strip() for a in alts):
        erros.append(f"{onde} {qid}: precisa de 4 ou 5 alternativas com texto")
        alts = alts if isinstance(alts, list) else []
    anulada = bool(q.get("anulada"))
    c = q.get("correta")
    if not anulada and not (isinstance(c, int) and not isinstance(c, bool) and 0 <= c < len(alts)):
        erros.append(f"{onde} {qid}: 'correta' ({c!r}) não aponta para uma alternativa (0 = A)")
    d = q.get("disciplina")
    if d not in discs and d != "outras":
        erros.append(f"{onde} {qid}: disciplina desconhecida: {d!r}")
    a = q.get("assunto") or ""
    if a and d in assuntos and a not in assuntos[d]:
        erros.append(f"{onde} {qid}: assunto {a!r} não existe em data/disciplinas/{d}.json")
    if not a and d != "outras":
        avisos.append(f"{onde} {qid}: sem assunto (fica fora das trilhas)")
    if "origem" in q and q["origem"] not in ORIGENS:
        erros.append(f"{onde} {qid}: origem inválida: {q['origem']!r}")
    com = str(q.get("comentario") or "")
    if not anulada and len(com) < 400:
        avisos.append(f"{onde} {qid}: comentário curto ({len(com)} caracteres; o Arthur pediu explicação completa)")
    elif not anulada and ("**Por que" not in com or "**As outras" not in com):
        avisos.append(f"{onde} {qid}: comentário fora do padrão (falta **Por que** ou **As outras**)")
    if not str(q.get("enunciado") or "").strip():
        erros.append(f"{onde} {qid}: sem enunciado")
    if textos is not None:
        refs = q.get("texto")
        refs = refs if isinstance(refs, list) else [refs] if refs else []
        for r in refs:
            if r not in textos:
                erros.append(f"{onde} {qid}: texto de apoio {r!r} não existe em 'textos'")
    figura(f"{onde} {qid}", q.get("imagem"))
    figuras_md(f"{onde} {qid}", q.get("enunciado"), q.get("comentario"), *alts)


idx = ler("data/index.json") or {}
discs = [d["id"] for d in idx.get("disciplinas", [])]
assuntos, ids = {}, Counter()
for d in discs:
    dd = ler(f"data/disciplinas/{d}.json")
    if dd is None:
        avisos.append(f"data/disciplinas/{d}.json: ainda não existe")
        continue
    lista = [a.get("id") for a in dd.get("assuntos", [])]
    for k, n in Counter(lista).items():
        if n > 1:
            erros.append(f"data/disciplinas/{d}.json: assunto repetido {k!r}")
    assuntos[d] = set(lista)
    for a in dd.get("assuntos", []):
        for l in a.get("leituras") or []:
            if not str(l.get("url", "")).startswith("https://"):
                avisos.append(f"data/disciplinas/{d}.json {a.get('id')}: leitura sem https: {l.get('url')}")
        for v in a.get("videos") or []:
            if not re.fullmatch(r"[\w-]{11}", str(v.get("youtubeId", ""))):
                erros.append(f"data/disciplinas/{d}.json {a.get('id')}: youtubeId inválido: {v.get('youtubeId')!r}")
for d in discs:
    qs = ler(f"data/questoes/{d}.json")
    if qs is None:
        continue
    if not isinstance(qs, list):
        erros.append(f"data/questoes/{d}.json: precisa ser uma lista")
        continue
    for q in qs:
        if q.get("disciplina") not in (None, d):
            erros.append(f"data/questoes/{d}.json {q.get('id')}: disciplina {q.get('disciplina')!r} no arquivo de {d}")
        questao(f"data/questoes/{d}.json", dict(q, disciplina=q.get("disciplina") or d), discs, assuntos, ids)

provas = ler("data/provas.json") or []
pids = {p.get("id") for p in provas}
pi = ler("data/provas/index.json")
nprovas = 0
if pi is not None:
    if not isinstance(pi, list):
        erros.append("data/provas/index.json: precisa ser uma lista")
        pi = []
    for info in pi:
        pid = info.get("id", "")
        if not re.fullmatch(r"[\w-]+", pid):
            erros.append(f"data/provas/index.json: id inválido {pid!r}")
            continue
        if pid not in pids:
            avisos.append(f"data/provas/index.json: {pid} não está em data/provas.json (fica sem os botões Prova/Gabarito)")
        arq = info.get("arquivo") or f"data/provas/{pid}.json"
        p = ler(arq)
        if p is None:
            erros.append(f"{arq}: listado no index.json mas não existe")
            continue
        nprovas += 1
        textos = {t.get("id") for t in p.get("textos") or []}
        for t in p.get("textos") or []:
            figuras_md(f"{arq} texto {t.get('id')}", t.get("conteudo"))
        qs = p.get("questoes") or []
        if info.get("nQuestoes") not in (None, len(qs)):
            avisos.append(f"data/provas/index.json {pid}: nQuestoes={info.get('nQuestoes')} mas o arquivo tem {len(qs)}")
        nums = Counter(q.get("numero") for q in qs)
        for n, k in nums.items():
            if k > 1:
                erros.append(f"{arq}: número de questão repetido: {n}")
        for q in qs:
            if not str(q.get("id", "")).startswith(pid):
                avisos.append(f"{arq} {q.get('id')}: id deveria começar com {pid}")
            questao(arq, q, discs, assuntos, ids, textos)

for k, n in ids.items():
    if n > 1:
        erros.append(f"id de questão repetido em {n} lugares: {k}")
pl = ler("data/plano.json")
if pl:
    for w in pl.get("semanas", []):
        for r in w.get("assuntos", []):
            d, _, a = str(r).partition(":")
            if d not in discs or (a and d in assuntos and a not in assuntos[d]):
                erros.append(f"data/plano.json semana {w.get('n')}: referência inválida {r!r}")

print(f"{sum(ids.values())} questões conferidas ({nprovas} provas digitadas) · {len(erros)} erro(s) · {len(avisos)} aviso(s)")
for e in erros:
    print("ERRO  ", e)
for a in avisos[:60]:
    print("aviso ", a)
if len(avisos) > 60:
    print(f"aviso  … e mais {len(avisos) - 60} avisos")
sys.exit(1 if erros else 0)

"""Confere as provas interativas (data/provas/<id>.json) e gera data/provas/index.json.

Uso: python -I scripts/validar_provas.py [<id> ...] [--indice]
Sem ids, confere todas. Com --indice, regrava data/provas/index.json com as provas sem erro.
Erro (ERRO) quebra o site ou a correção; aviso (aviso) é para olhar, mas não impede.
Contrato combinado com a sessão do site em 28/10/2026 (ver README, seção "Provas interativas").
"""
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
PROVAS = RAIZ / "data" / "provas"

ASSUNTOS_GERAIS = {
    "portugues": ["interpretacao", "coesao", "reescrita", "sintaxe", "verbos", "pontuacao", "concordancia",
                  "regencia-crase", "pronomes", "morfologia", "ortografia-acentuacao"],
    "informatica": ["hardware", "sistemas-operacionais", "editor-texto", "planilhas", "email-reunioes",
                    "internet-nuvem", "seguranca"],
    "legislacao-etica": ["lei-organica-cg", "lgpd", "lai", "etica-servico-publico", "principios-limpe"],
    "historia-cg": ["origens-fundacao", "emancipacao-cidade", "ferrovia-algodao", "crescimento-politica",
                    "cultura-educacao-tecnologia"],
    "outras": [],
}
IMG = re.compile(r"!\[[^\]]*\]\(([^)\s]+)\)")
LETRA = re.compile(r"\b(letra|alternativa|op[çc][ãa]o)\s+[\"“]?[A-E]\b|\([A-E]\)", re.I)


def assuntos():
    esp = json.loads((RAIZ / "data" / "disciplinas" / "especificos.json").read_text(encoding="utf-8"))
    return {**ASSUNTOS_GERAIS, "especificos": [a["id"] for a in esp["assuntos"]]}


def conferir(arq, ids_catalogo, validos):
    erros, avisos = [], []
    try:
        p = json.loads(arq.read_text(encoding="utf-8"))
    except Exception as e:
        return [f"JSON inválido: {e}"], [], None
    if arq.read_bytes()[:3] == b"\xef\xbb\xbf":
        erros.append("arquivo com BOM (salve UTF-8 sem BOM)")
    pid = arq.stem
    if p.get("id") != pid:
        erros.append(f"id '{p.get('id')}' diferente do nome do arquivo")
    if pid not in ids_catalogo:
        erros.append("id não existe em data/provas.json")
    for k in ("titulo", "banca", "ano", "orgao", "cargo", "fonte", "duracaoMin", "textos", "questoes"):
        if k not in p:
            erros.append(f"falta '{k}'")
    if not isinstance(p.get("duracaoMin"), int):
        erros.append("duracaoMin precisa ser inteiro (minutos)")

    imagens = []
    textos = {}
    for t in p.get("textos", []):
        if not t.get("id") or t["id"] in textos:
            erros.append(f"texto sem id ou id repetido: {t.get('id')}")
        textos[t.get("id")] = t
        if not str(t.get("conteudo", "")).strip():
            erros.append(f"texto {t.get('id')} sem conteudo")
        imagens += IMG.findall(t.get("conteudo", ""))
        if t.get("imagem"):
            imagens.append(t["imagem"])

    qs = p.get("questoes", [])
    if not qs:
        erros.append("nenhuma questão")
    ant = 0
    nalt = {}
    for q in qs:
        n = q.get("numero")
        tag = f"q{n}"
        if not isinstance(n, int) or n <= ant:
            erros.append(f"{tag}: numero fora de ordem ou repetido")
        else:
            if n != ant + 1:
                avisos.append(f"{tag}: pulou do {ant} para o {n} (discursiva ou questão faltando?)")
            ant = n
        if isinstance(n, int) and q.get("id") != f"{pid}-q{n:02d}":
            erros.append(f"{tag}: id deveria ser '{pid}-q{n:02d}'")
        d = q.get("disciplina")
        if d not in validos:
            erros.append(f"{tag}: disciplina '{d}' inválida")
        elif q.get("assunto") and q["assunto"] not in validos[d]:
            erros.append(f"{tag}: assunto '{q['assunto']}' não existe em {d}")
        elif d not in ("outras",) and not q.get("assunto"):
            avisos.append(f"{tag}: sem assunto")
        refs = q.get("texto")
        for r in ([refs] if isinstance(refs, str) else refs or []):
            if r not in textos:
                erros.append(f"{tag}: texto '{r}' não existe")
        if not str(q.get("enunciado", "")).strip():
            erros.append(f"{tag}: enunciado vazio")
        alts = q.get("alternativas")
        if not isinstance(alts, list) or len(alts) not in (4, 5) or not all(str(a).strip() for a in alts):
            erros.append(f"{tag}: alternativas precisam ser 4 ou 5 textos não vazios")
            alts = alts if isinstance(alts, list) else []
        nalt[len(alts)] = nalt.get(len(alts), 0) + 1
        anulada = q.get("anulada")
        if not isinstance(anulada, bool):
            erros.append(f"{tag}: anulada precisa ser true/false")
        c = q.get("correta")
        if anulada:
            if c is not None:
                erros.append(f"{tag}: anulada deve ter correta = null")
        elif not isinstance(c, int) or not 0 <= c < len(alts):
            erros.append(f"{tag}: correta fora do intervalo")
        com = q.get("comentario")
        if not com or not str(com).strip():
            erros.append(f"{tag}: sem comentário")
        else:
            if anulada and "anulad" not in com.lower():
                erros.append(f"{tag}: anulada, mas o comentário não diz isso")
            if not anulada and not com.startswith("**Por que"):
                avisos.append(f"{tag}: comentário fora do padrão (deve começar com **Por que)")
            if not anulada and "**As outras" not in com:
                avisos.append(f"{tag}: comentário sem o bloco **As outras")
            if not 350 <= len(com) <= 2000:
                avisos.append(f"{tag}: comentário com {len(com)} caracteres (padrão: 450 a 1.400)")
            if LETRA.search(com):
                avisos.append(f"{tag}: comentário cita letra de alternativa; cite pelo texto")
        for campo in [q.get("enunciado", ""), q.get("comentario") or "", *map(str, alts)]:
            imagens += IMG.findall(campo)
        if q.get("imagem"):
            imagens.append(q["imagem"])
    if len(nalt) > 1:
        avisos.append(f"número de alternativas varia: {nalt}")

    pasta = PROVAS / "img" / pid
    usados = set()
    for im in imagens:
        f = RAIZ / im
        usados.add(f.resolve())
        if not im.startswith(f"data/provas/img/{pid}/"):
            erros.append(f"imagem fora da pasta da prova: {im}")
        elif not f.exists():
            erros.append(f"imagem não encontrada: {im}")
        elif f.stat().st_size > 400_000:
            erros.append(f"imagem grande demais ({f.stat().st_size // 1024} KB): {im}")
        elif f.stat().st_size > 150_000:
            avisos.append(f"imagem acima de 150 KB ({f.stat().st_size // 1024} KB): {im}")
    if pasta.exists():
        for f in pasta.iterdir():
            if f.resolve() not in usados:
                avisos.append(f"imagem sem uso: {f.name}")
    return erros, avisos, p


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    catalogo = json.loads((RAIZ / "data" / "provas.json").read_text(encoding="utf-8"))
    ids_catalogo = {c["id"] for c in catalogo}
    validos = assuntos()
    arquivos = [PROVAS / f"{a}.json" for a in args] if args else sorted(
        f for f in PROVAS.glob("*.json") if f.name != "index.json")
    indice, falhou = [], False
    for arq in arquivos:
        if not arq.exists():
            print(f"ERRO {arq.name}: não existe")
            falhou = True
            continue
        erros, avisos, p = conferir(arq, ids_catalogo, validos)
        qs = (p or {}).get("questoes", [])
        por_disc = {}
        for q in qs:
            por_disc[q.get("disciplina")] = por_disc.get(q.get("disciplina"), 0) + 1
        anuladas = sum(1 for q in qs if q.get("anulada"))
        letras = {}
        for q in qs:
            if isinstance(q.get("correta"), int):
                letras["ABCDE"[q["correta"]]] = letras.get("ABCDE"[q["correta"]], 0) + 1
        print(f"\n{arq.stem}: {len(qs)} questões {por_disc} · anuladas {anuladas} · gabarito {dict(sorted(letras.items()))}")
        for e in erros:
            print(f"  ERRO  {e}")
        for a in avisos:
            print(f"  aviso {a}")
        if erros:
            falhou = True
        elif p:
            indice.append({k: p[k] for k in ("id", "titulo", "banca", "ano", "orgao", "cargo")} | {
                "arquivo": f"data/provas/{arq.name}", "nQuestoes": len(qs), "duracaoMin": p["duracaoMin"]})
    if "--indice" in sys.argv:
        if args:
            print("\n--indice só funciona conferindo todas as provas (sem ids)")
            sys.exit(1)
        ordem = {c["id"]: i for i, c in enumerate(catalogo)}
        indice.sort(key=lambda x: ordem.get(x["id"], 999))
        (PROVAS / "index.json").write_text(json.dumps(indice, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        print(f"\ndata/provas/index.json: {len(indice)} provas")
    sys.exit(1 if falhou else 0)


if __name__ == "__main__":
    main()

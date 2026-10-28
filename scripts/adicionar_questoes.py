"""Valida um lote de questões autorais e junta em data/questoes/<disciplina>.json.

Uso: python -I scripts/adicionar_questoes.py lote.json
Formato do lote (compacto, para escrever rápido):
{
  "disciplina": "especificos",
  "assunto": "acessibilidade",
  "fonte": "ABNT NBR 9050:2020",            # fonte padrão das questões do lote
  "q": [
    ["enunciado", ["alt A", "alt B", "alt C", "alt D"], 0, "comentário", "fonte opcional", false]
  ]                                          # 6º item opcional: false = não embaralhar
}
As alternativas são embaralhadas de forma fixa (semente = id) e a posição da certa é equilibrada entre A, B, C e D.
Questões com o mesmo enunciado substituem as antigas (dá para corrigir e rodar de novo).
"""
import json
import random
import sys
from collections import Counter
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
PADRAO = {
    "origem": "autoral",
    "banca": "Estilo IDECAN",
    "ano": 2026,
    "orgao": "Prefeitura de Campina Grande/PB (simulado)",
    "cargo": "Inspetor Sanitário – Arquiteto",
}


def main():
    lote = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    disc = lote["disciplina"]
    assuntos = {a["id"] for a in json.loads((RAIZ / "data" / "disciplinas" / f"{disc}.json").read_text(encoding="utf-8"))["assuntos"]}
    if lote["assunto"] not in assuntos:
        sys.exit(f"assunto inexistente: {lote['assunto']}")

    destino = RAIZ / "data" / "questoes" / f"{disc}.json"
    atuais = json.loads(destino.read_text(encoding="utf-8")) if destino.exists() else []
    por_enunciado = {q["enunciado"]: q for q in atuais}
    prefixo = {"especificos": "esp"}.get(disc, disc[:3])
    proximo = max([int(q["id"].split("-")[1]) for q in atuais] + [0]) + 1

    for item in lote["q"]:
        enunciado, alternativas, correta, comentario = item[:4]
        fonte = item[4] if len(item) > 4 and item[4] else lote["fonte"]
        embaralhar = item[5] if len(item) > 5 else True
        if len(alternativas) != 4 or not 0 <= correta < 4 or len(set(alternativas)) != 4:
            sys.exit(f"questão inválida: {enunciado[:60]}")
        antiga = por_enunciado.get(enunciado)
        qid = antiga["id"] if antiga else f"{prefixo}-{proximo:04d}"
        if not antiga:
            proximo += 1
        certa = alternativas[correta]
        if embaralhar:
            # a posição da certa é sorteada em blocos de 4 ids, para o gabarito ficar equilibrado entre A, B, C e D
            n = int(qid.split("-")[1])
            posicao = random.Random(f"bloco{n // 4}").sample(range(4), 4)[n % 4]
            erradas = [a for a in alternativas if a != certa]
            random.Random(qid).shuffle(erradas)
            alternativas = erradas[:posicao] + [certa] + erradas[posicao:]
        q = {"id": qid, "disciplina": disc, "assunto": lote["assunto"], **PADRAO, "fonte": fonte,
             "enunciado": enunciado, "alternativas": alternativas, "correta": alternativas.index(certa),
             "comentario": comentario}
        por_enunciado[enunciado] = q

    todas = sorted(por_enunciado.values(), key=lambda q: q["id"])
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(json.dumps(todas, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    letras = Counter("ABCD"[q["correta"]] for q in todas)
    por_assunto = Counter(q["assunto"] for q in todas)
    print(f"{len(todas)} questões em {destino.name} | gabarito {dict(sorted(letras.items()))} | {lote['assunto']}: {por_assunto[lote['assunto']]}")


if __name__ == "__main__":
    main()

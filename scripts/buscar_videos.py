"""Busca vídeos do YouTube por assunto e confere cada id no oEmbed.

Uso: python -I scripts/buscar_videos.py consultas.json saida.json
consultas.json = {"<assunto>": ["consulta 1", "consulta 2"], ...}
Saída: {"<assunto>": [{titulo, canal, youtubeId, duracao, views, consulta}]} só com ids que o oEmbed confirmou.
"""
import json
import re
import sys
import time
import urllib.parse
import urllib.request

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"


def baixar(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "pt-BR,pt;q=0.9"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", "replace")


def segundos(duracao):
    partes = [int(p) for p in duracao.split(":") if p.isdigit()]
    total = 0
    for p in partes:
        total = total * 60 + p
    return total


def buscar(consulta):
    url = "https://www.youtube.com/results?hl=pt-BR&gl=BR&search_query=" + urllib.parse.quote(consulta)
    html = baixar(url)
    m = re.search(r"var ytInitialData = (\{.*?\});</script>", html, re.S)
    if not m:
        return []
    dados = json.loads(m.group(1))
    achados = []

    def andar(no):
        if isinstance(no, dict):
            if "videoRenderer" in no:
                v = no["videoRenderer"]
                try:
                    achados.append({
                        "youtubeId": v["videoId"],
                        "titulo": "".join(r["text"] for r in v["title"]["runs"]),
                        "canal": v["ownerText"]["runs"][0]["text"],
                        "duracao": v.get("lengthText", {}).get("simpleText", ""),
                        "views": v.get("viewCountText", {}).get("simpleText", ""),
                    })
                except (KeyError, IndexError):
                    pass
            for valor in no.values():
                andar(valor)
        elif isinstance(no, list):
            for item in no:
                andar(item)

    andar(dados)
    return achados


def confere(video_id):
    url = "https://www.youtube.com/oembed?format=json&url=" + urllib.parse.quote(
        "https://www.youtube.com/watch?v=" + video_id)
    try:
        return json.loads(baixar(url))
    except Exception:
        return None


def main():
    consultas = json.load(open(sys.argv[1], encoding="utf-8"))
    saida = {}
    for assunto, lista in consultas.items():
        escolhidos, vistos = [], set()
        for consulta in lista:
            for v in buscar(consulta):
                seg = segundos(v["duracao"]) if v["duracao"] else 0
                if v["youtubeId"] in vistos or seg < 240 or seg > 4 * 3600:
                    continue
                vistos.add(v["youtubeId"])
                info = confere(v["youtubeId"])
                if not info:
                    continue
                v["consulta"] = consulta
                escolhidos.append(v)
                if len([e for e in escolhidos if e["consulta"] == consulta]) >= 4:
                    break
            time.sleep(0.5)
        saida[assunto] = escolhidos
        print(assunto, len(escolhidos), flush=True)
    json.dump(saida, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()

"""Gera data/provas.json a partir de references/provas-catalogo.json, com links do Google Drive pessoal.

Uso: python -I scripts/vincular_provas_drive.py
Para cada prova com "arquivo", procura "<arquivo> - prova.pdf" e "<arquivo> - gabarito.pdf" no banco local do
Google Drive para computador (só leitura, numa cópia temporária) e usa o id do Drive para montar o link.
Prova sem arquivo no Drive fica com o link da fonte (PCI ou QConcursos).
"""
import json
import os
import shutil
import sqlite3
import tempfile
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CONTA_PESSOAL = "116679934396416192356"  # arthursgsantos@gmail.com (G:)


def ids_do_drive():
    origem = Path(os.environ["LOCALAPPDATA"]) / "Google" / "DriveFS" / CONTA_PESSOAL
    with tempfile.TemporaryDirectory() as tmp:
        for sufixo in ("", "-wal", "-shm"):
            arq = origem / f"metadata_sqlite_db{sufixo}"
            if arq.exists():
                shutil.copyfile(arq, Path(tmp) / f"db{sufixo}")
        con = sqlite3.connect(Path(tmp) / "db")
        rows = con.execute("select local_title, id from items where trashed = 0 and is_folder = 0").fetchall()
        con.close()
    # id local (ainda não enviado) não serve para link
    return {titulo: i for titulo, i in rows if i and not i.startswith("local")}


def main():
    catalogo = json.loads((RAIZ / "references" / "provas-catalogo.json").read_text(encoding="utf-8"))
    ids = ids_do_drive()
    saida, no_drive = [], 0
    for c in catalogo:
        p = {k: c[k] for k in ("id", "titulo", "banca", "ano", "orgao", "cargo", "disciplinas", "relevancia", "nota")}
        prova = ids.get(f"{c['arquivo']} - prova.pdf") if c.get("arquivo") else None
        gabarito = ids.get(f"{c['arquivo']} - gabarito.pdf") if c.get("arquivo") else None
        if prova:
            no_drive += 1
            p["url"] = f"https://drive.google.com/file/d/{prova}/view"
            p["local"] = "drive"
        else:
            p["url"] = c["fonte"]
            p["local"] = "link"
        if gabarito:
            p["gabarito"] = f"https://drive.google.com/file/d/{gabarito}/view"
        p["fonte"] = c["fonte"]
        saida.append(p)
    (RAIZ / "data" / "provas.json").write_text(json.dumps(saida, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"{len(saida)} provas; {no_drive} com PDF no Drive")


if __name__ == "__main__":
    main()

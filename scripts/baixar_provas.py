"""Baixa provas e gabaritos (links diretos do QConcursos) para a pasta do concurso no Google Drive pessoal.

Uso: python -I scripts/baixar_provas.py <pasta-temporaria> <pasta-destino-no-drive>
Lê a lista PROVAS abaixo, baixa cada PDF para a pasta temporária, confere se é PDF de verdade e copia para o Drive
com nome legível. Pula o que já existe no destino.
"""
import shutil
import sys
import urllib.request
from pathlib import Path

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124"
QC = "https://arquivos.qconcursos.com/prova"

# (id no provas.json, nome do arquivo, id do QConcursos, slug do QConcursos)
PROVAS = [
    ("idecan-2026-alce-arquitetura", "2026 - AL-CE - Analista Legislativo Arquitetura e Urbanismo", 157364, "idecan-2026-al-ce-analista-legislativo-arquitetura-e-urbanismo"),
    ("idecan-2022-tjpi-arquiteto", "2022 - TJ-PI - Arquiteto", 89666, "idecan-2022-tj-pi-arquiteto"),
    ("idecan-2018-crfsp-arquiteto", "2018 - CRF-SP - Arquiteto", 66908, "idecan-2018-crf-sp-arquiteto"),
    ("idecan-2017-crfsp-arquiteto", "2017 - CRF-SP - Arquiteto", 58891, "idecan-2017-crf-sp-arquiteto"),
    ("idecan-2016-uern-arquiteto", "2016 - UERN - Arquiteto Urbanista", 52056, "idecan-2016-uern-arquiteto-urbanista"),
    ("idecan-2016-ufpb-arquiteto", "2016 - UFPB - Arquiteto", 47481, "idecan-2016-ufpb-arquiteto"),
    ("idecan-2014-detranro-arquiteto", "2014 - DETRAN-RO - Arquiteto", 38303, "idecan-2014-detran-ro-arquiteto"),
    ("idecan-2023-deres-edificacoes", "2023 - DER-ES - Tecnico Superior Obras de Edificacoes", 114714, "idecan-2023-der-es-tecnico-superior-operacional-obras-e-servicos-de-edificacoes"),
    ("idecan-2023-maracanau-fiscal-sanitario", "2023 - Maracanau-CE - Fiscal Sanitario", 114720, "idecan-2023-prefeitura-de-maracanau-ce-fiscal-sanitario"),
    ("idecan-2023-maracanau-fiscal-urbanismo", "2023 - Maracanau-CE - Fiscal de Urbanismo", 97226, "idecan-2023-prefeitura-de-maracanau-ce-fiscal-de-urbanismo"),
    ("idecan-2017-sgra-fiscal-vigilancia", "2017 - Sao Goncalo do Rio Abaixo-MG - Fiscal de Vigilancia Sanitaria", 66969, "idecan-2017-prefeitura-de-sao-goncalo-do-rio-abaixo-mg-fiscal-de-vigilancia-sanitaria"),
    ("idecan-2017-manhumirim-fiscal-sanitario", "2017 - Manhumirim-MG - Fiscal Sanitario", 76571, "idecan-2017-prefeitura-de-manhumirim-mg-fiscal-sanitario"),
    ("idecan-2017-manhumirim-fiscal-obras", "2017 - Manhumirim-MG - Fiscal de Obras e Posturas", 76582, "idecan-2017-prefeitura-de-manhumirim-mg-fiscal-de-obras-e-posturas"),
    ("idecan-2017-tenenteananias-vigilancia", "2017 - Tenente Ananias-RN - Agente de Vigilancia Sanitaria", 67009, "idecan-2017-prefeitura-de-tenente-ananias-rn-agente-de-vigilancia-sanitaria"),
    ("idecan-2016-conquista-coord-visa", "2016 - Conquista-MG - Coordenador de Vigilancia Sanitaria", 67030, "idecan-2016-prefeitura-de-conquista-mg-coordenador-de-vigilancia-sanitaria"),
    ("idecan-2016-conquista-fiscal-sanitario", "2016 - Conquista-MG - Fiscal Sanitario", 67033, "idecan-2016-prefeitura-de-conquista-mg-fiscal-sanitario"),
    ("idecan-2016-leopoldina-fiscal-sanitario", "2016 - Leopoldina-MG - Fiscal Sanitario", 67078, "idecan-2016-prefeitura-de-leopoldina-mg-fiscal-sanitario"),
    ("idecan-2015-rionovodosul-fiscal-sanitario", "2015 - Rio Novo do Sul-ES - Fiscal Sanitario", 42004, "idecan-2015-prefeitura-de-rio-novo-do-sul-es-fiscal-sanitario"),
    ("idecan-2025-sesaprn-eng-civil", "2025 - SESAP-RN - Engenheiro Civil", 160445, "idecan-2025-sesap-rn-engenheiro-civil"),
    ("idecan-2025-sopce-eng-civil", "2025 - SOP-CE - Engenheiro Civil", 156214, "idecan-2025-sop-ce-engenheiro-civil"),
    ("idecan-2024-caern-eng-civil", "2024 - CAERN - Engenheiro Civil", 106154, "idecan-2024-caern-engenheiro-civil"),
    ("idecan-2022-tjpi-eng-civil", "2022 - TJ-PI - Engenheiro Civil", 114733, "idecan-2022-tj-pi-engenheiro-civil"),
    ("idecan-2021-cg-fiscal-tributos", "2021 - Campina Grande-PB - Fiscal de Tributos Municipais", 86588, "idecan-2021-prefeitura-de-campina-grande-pb-fiscal-de-tributos-municipais"),
    ("idecan-2021-cg-guarda-municipal", "2021 - Campina Grande-PB - Guarda Municipal", 131719, "idecan-2021-prefeitura-de-campina-grande-pb-guarda-municipal"),
]


def baixar(url, destino):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r, open(destino, "wb") as f:
        shutil.copyfileobj(r, f)
    with open(destino, "rb") as f:
        if f.read(5) != b"%PDF-":
            raise ValueError("não é PDF")


def main():
    tmp, drive = Path(sys.argv[1]), Path(sys.argv[2])
    tmp.mkdir(parents=True, exist_ok=True)
    drive.mkdir(parents=True, exist_ok=True)
    for pid, nome, qid, slug in PROVAS:
        for tipo, pasta in (("prova", "arquivo_prova"), ("gabarito", "arquivo_gabarito")):
            final = drive / f"{nome} - {tipo}.pdf"
            if final.exists():
                continue
            temp = tmp / f"{slug}-{tipo}.pdf"
            try:
                baixar(f"{QC}/{pasta}/{qid}/{slug}-{tipo}.pdf", temp)
                shutil.copyfile(temp, final)
                print(f"ok   {final.name} ({final.stat().st_size // 1024} KB)", flush=True)
            except Exception as e:
                print(f"ERRO {nome} {tipo}: {e}", flush=True)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Genera il sito statico in dist/.

    python3 strumenti/build.py            # staging (noindex)
    python3 strumenti/build.py --produzione

Pagine in src/pages/*.html (template Jinja che estendono src/templates/base.html),
dati in src/data/catalogo.json, file statici in src/assets/.
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

RADICE = Path(__file__).resolve().parent.parent
SRC = RADICE / "src"
DIST = RADICE / "dist"


def euro(valore: float) -> str:
    """29 -> '29 €', 4.5 -> '4,50 €'."""
    if float(valore).is_integer():
        return f"{int(valore)} €"
    return f"{valore:.2f}".replace(".", ",") + " €"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--produzione", action="store_true")
    a = ap.parse_args()

    dati = json.loads((SRC / "data" / "catalogo.json").read_text(encoding="utf-8"))
    # Indirizzo della funzione server dell'abbinamento: variabile API_COLORE del repository.
    if os.environ.get("RT_API_COLORE"):
        dati["abbinamento"]["api_link"] = os.environ["RT_API_COLORE"].rstrip("/") + "/"
    prezzi_finiture = {f["nome"]: f["prezzo"] for f in dati["finiture"]}
    for c in dati["copertine"]:
        c["prezzo"] = prezzi_finiture[c["finitura"]]
    attive = [c for c in dati["copertine"] if c["disponibile"]]
    dati["prezzo_min"] = min(c["prezzo"] for c in attive)
    dati["prezzo_max"] = max(c["prezzo"] for c in attive)

    if DIST.exists():
        shutil.rmtree(DIST)
    shutil.copytree(SRC / "assets", DIST / "assets")
    (DIST / "assets" / "catalogo.json").write_text(json.dumps(dati, ensure_ascii=False), encoding="utf-8")

    env = Environment(
        loader=FileSystemLoader([SRC / "templates", SRC / "pages"]),
        autoescape=select_autoescape(["html"]),
        trim_blocks=True,
        lstrip_blocks=True,
    )
    env.filters["euro"] = euro
    contesto = {"dati": dati, "staging": not a.produzione}

    for pagina in sorted((SRC / "pages").glob("*.html")):
        html = env.get_template(pagina.name).render(pagina=pagina.stem, **contesto)
        (DIST / pagina.name).write_text(html, encoding="utf-8")

    robots = "User-agent: *\nDisallow: /\n" if contesto["staging"] else "User-agent: *\nAllow: /\n"
    (DIST / "robots.txt").write_text(robots, encoding="utf-8")
    (DIST / ".nojekyll").write_text("", encoding="utf-8")
    print(f"Sito generato in {DIST} ({len(list(DIST.glob('*.html')))} pagine)")


if __name__ == "__main__":
    main()

---
titolo: "rilegaretesi.it (nuovo sito)"
stato: attivo
creato: 2026-10-24
aggiornato: 2026-10-24
tag: [progetto]
sintesi: "Nuovo sito di vendita online delle tesi rilegate di Volta la carta."
---

# rilegaretesi.it (nuovo sito)

Nuovo sito di vendita online delle tesi rilegate di Volta la carta.

## Dove trovare cosa

| Cosa | Dove |
| --- | --- |
| Documentazione del progetto | [`docs/`](docs/README.md) |
| Decisioni del progetto | [`docs/decisioni/`](docs/decisioni/README.md) |
| Mappa compatta di tutti i file (anche per Claude) | `INDICE.md`, generato da solo |
| Regole generali di Volta la carta | [documentazione](https://github.com/voltalacarta/documentazione) |

## Come si lavora

- Apri la repo in un Codespace: *Code* → *Codespaces* → *Create codespace on main*.
- Una decisione nuova: `python3 strumenti/nuova-decisione.py "Titolo"`, poi compila il file.
- Indici e mappa si aggiornano da soli dopo il push; il progetto compare nel grafo del second brain entro qualche ora.

## Fonti dati

- **[Registro VLC](https://docs.google.com/spreadsheets/d/1oP_wjw2Vgfo60ZbXU06rWZ1XMu9-ltrZVTFVsf9RKjg/edit)** (Google Sheets, in `ProduzioneVLC` su Drive): catalogo copertine, finiture, listino stampa, extra.
- **MaterialeVLC** (Drive): materiale grezzo (foto, loghi, recensioni).

## Staging

Il sito in lavorazione è pubblicato su GitHub Pages: <https://pietrofabbri.github.io/rt-nr2/>. Il sito attuale rilegaretesi.it non viene toccato.

## Il sito

| Cosa | Dove |
| --- | --- |
| Pagine | `src/pages/*.html` (modelli Jinja) |
| Parti comuni (testata, piede, copertina) | `src/templates/` |
| Catalogo e prezzi | `src/data/catalogo.json`, copia del Registro VLC |
| Stile e script | `src/assets/` |
| Lettura dei PDF nel browser | `src/assets/vendor/pdfjs/`: pdf.js 4.10.38 di Mozilla, licenza Apache 2.0 |

Per provarlo in locale: `pip install jinja2`, poi `python3 strumenti/build.py` e apri `dist/index.html`. La pubblicazione su GitHub Pages parte da sola a ogni push su `main`.

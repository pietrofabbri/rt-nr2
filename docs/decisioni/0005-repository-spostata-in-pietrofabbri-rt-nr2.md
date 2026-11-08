---
titolo: Repository spostata in pietrofabbri/rt-nr2
stato: accettato
creato: 2026-11-08
aggiornato: 2026-11-08
tag: [decisioni, repository, staging, github-pages]
sintesi: "Il codice del sito passa da voltalacarta/rt2 a pietrofabbri/rt-nr2; lo staging va su pietrofabbri.github.io/rt-nr2."
collegati: [0001]
---

# 0005 · Repository spostata in pietrofabbri/rt-nr2

## Contesto

L'8/11/2026 le repository dell'account `voltalacarta` non erano più raggiungibili. Il titolare ha indicato una nuova repository: `pietrofabbri/rt-nr2`.

## Decisione

- Il codice del sito, con tutta la storia, vive in [`pietrofabbri/rt-nr2`](https://github.com/pietrofabbri/rt-nr2).
- Lo staging si pubblica su <https://pietrofabbri.github.io/rt-nr2/>. Per il resto vale la decisione [0001](0001-nuovo-sito-separato-staging-su-github-pages.md).
- I link verso `voltalacarta/rt2`, `voltalacarta/documentazione` e `voltalacarta/second-brain` nei documenti restano come riferimento storico finché non si sa dove sono finite quelle repository.

## Alternative considerate

| Alternativa | Perché scartata |
| --- | --- |
| Ricreare la repo con lo stesso nome `rt2` | Non collegabile nella stessa sessione di lavoro di Claude |

## Conseguenze

- ✅ Il lavoro riprende senza perdite: tutta la storia è stata trasferita.
- ⚠️ GitHub Pages va attivato di nuovo nella nuova repository (Settings → Pages → Source: GitHub Actions).
- ⚠️ Da chiarire dove sono la documentazione e il second brain.

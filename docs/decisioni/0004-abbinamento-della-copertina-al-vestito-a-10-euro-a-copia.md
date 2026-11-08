---
titolo: Abbinamento della copertina al vestito a 10 euro a copia
stato: superato
sostituito-da: "0006"
creato: 2026-11-08
aggiornato: 2026-11-08
tag: [decisioni, configuratore, prezzi, abbinamento]
sintesi: "Servizio a pagamento: foto o link del vestito, colore rilevato, copertine più vicine; 10 euro in più per ogni copia."
collegati: [0003]
---

# 0004 · Abbinamento della copertina al vestito a 10 euro a copia

## Contesto

Dal questionario del titolare: gli studenti abbinano il colore della copertina e della scritta al vestito della laurea. L'8/11/2026 il titolare ha chiesto un configuratore che parta dal colore del vestito (foto, pagina di un negozio online, codice esadecimale), con un prezzo aggiuntivo.

## Decisione

- Nel configuratore c'è il pannello **Abbina la copertina al tuo vestito**: foto o screenshot, tocco sul vestito, colori principali della foto, codice esadecimale modificabile, le 4 copertine più vicine (differenza di colore CIEDE2000) e il colore della scritta consigliato.
- Il servizio costa **10 € in più per ogni copia** (`abbinamento.prezzo` in `src/data/catalogo.json`). Si attiva con «Usa questa» o con la casella, e si può togliere.
- Con l'ordine, la foto arriva in bottega e il colore si confronta sul campionario prima di stampare (da confermare con il titolare).
- **Dal link del negozio** serve una funzione sul server (vedi [scheda tecnica](../abbinamento-vestito.md)). Finché non c'è, il sito chiede uno screenshot della pagina.

## Alternative considerate

| Alternativa | Perché scartata |
| --- | --- |
| Servizio gratuito | Scelta del titolare: è un valore aggiunto e richiede lavoro in bottega |
| 10 € a ordine invece che a copia | Il titolare ha indicato «ogni tesi» |

## Conseguenze

- ✅ Argomento di vendita nuovo e visibile, in linea con come scelgono gli studenti.
- ✅ La foto resta sul dispositivo del cliente finché non ordina.
- ⚠️ I colori delle copertine nel catalogo sono **stimati**: per abbinamenti affidabili vanno misurati sui campioni veri.
- ⚠️ Molti negozi online bloccano la lettura automatica delle pagine: lo screenshot resta la strada sicura.

---
titolo: Colori del vestito gratis, colore esatto a 10 euro a copia
stato: accettato
creato: 2026-11-09
aggiornato: 2026-11-09
tag: [decisioni, configuratore, prezzi, abbinamento, colore-esatto]
sintesi: "Lo strumento dei colori del vestito è gratis; si paga 10 euro in più a copia solo per la copertina stampata nel colore esatto."
collegati: [0003]
sostituisce: 0004
---

# 0006 · Colori del vestito gratis, colore esatto a 10 euro a copia

## Contesto

Il 9/11/2026 il titolare ha precisato il servizio deciso con la [0004](0004-abbinamento-della-copertina-al-vestito-a-10-euro-a-copia.md): i negozi online sono tanti, quindi si ragiona per screenshot; dal capo devono uscire tutti i suoi colori, utili per copertina e scritta; il configuratore è gratis e si paga solo se si vuole la tesi nel colore esatto («in hex»).

## Decisione

- Lo strumento **Trova i colori del tuo vestito** è gratuito. Si usa con uno screenshot o una foto, oppure con copia e incolla dell'immagine dal negozio. Il link del negozio non è più nell'interfaccia.
- Dal capo escono i suoi colori (sfondo, pulsanti del negozio e sfumature esclusi). Il cliente ne sceglie uno per la **copertina** e uno per la **scritta**.
- Proposta gratuita: le 3 copertine del catalogo più vicine, con la scritta a caldo più vicina (oro, oro rosa, argento, bronzo), al prezzo normale.
- Proposta a pagamento: **copertina stampata e plastificata nel colore esatto**, con la scritta nel colore scelto. Prezzo: copertina di base (finitura Opaco, oggi 29 €) più **10 € a copia** (`abbinamento.prezzo_hex` in `src/data/catalogo.json`).
- Il pagamento passa dal conto del configuratore: la riga «Colore esatto» entra nel prezzo di ogni copia. Quando ci sarà il pagamento online, il server dovrà ricalcolare il prezzo, così nessuno può toglierla dal browser.

## Alternative considerate

| Alternativa | Perché scartata |
| --- | --- |
| Pagare l'abbinamento anche con i materiali del catalogo (0004) | Scelta del titolare: il configuratore è gratis, si paga il colore esatto |
| Leggere il link del negozio | I negozi sono troppi e diversi; lo screenshot funziona con tutti. La funzione server resta in `worker/`, in pausa |

## Conseguenze

- ✅ Funziona con qualsiasi negozio, senza server e senza costi.
- ✅ Il servizio a pagamento è chiaro: si paga solo il colore che non esiste nel catalogo.
- ⚠️ Da confermare con il titolare: stampa e plastificazione della copertina (idea della stampante Epson ET-15000), scritta stampata nel colore scelto, prezzo di base Opaco, se i 10 € valgono anche quando solo la scritta è nel colore esatto.
- ⚠️ Per abbinamenti affidabili servono i colori veri delle copertine, misurati sui campioni.

---
titolo: Abbinamento della copertina al vestito
stato: attivo
creato: 2026-11-08
aggiornato: 2026-11-08
tag: [configuratore, abbinamento, colore]
sintesi: "Come funziona l'abbinamento al vestito, cosa serve per renderlo affidabile e come si collegherà il link del negozio."
---

# Abbinamento della copertina al vestito

Decisione: [0004](decisioni/0004-abbinamento-della-copertina-al-vestito-a-10-euro-a-copia.md). Codice: `src/assets/js/abbina.js`.

## Come funziona oggi

1. Il cliente carica una foto o uno screenshot. L'immagine resta nel browser.
2. Il sito trova i colori principali nella parte centrale della foto (k-means nello spazio Lab), unisce le sfumature dello stesso tessuto e propone il colore più presente che non sia lo sfondo.
3. Il cliente può toccare il vestito nella foto (si prende la mediana di un quadrato di 7×7 pixel), scegliere a mano o scrivere il codice esadecimale.
4. Si calcola la differenza di colore CIEDE2000 con ogni copertina disponibile e si mostrano le 4 più vicine: sotto 3 «quasi identico», sotto 6 «molto vicino», sotto 12 «vicino».
5. La scritta consigliata segue regole semplici: bronzo o oro rosa sulle copertine chiare, argento su blu, viola e grigi, oro su colori caldi, verdi e nero.
6. «Usa questa» sceglie copertina e scritta e aggiunge 10 € a copia.

## Da fare per renderlo affidabile

- **Misurare i colori veri delle copertine.** Oggi i codici in `catalogo.json` sono stimati a occhio dai nomi. Si misurano fotografando ogni campione accanto a un cartoncino grigio di riferimento con luce diurna, oppure con un colorimetro. Vanno poi nel Registro VLC, in una colonna «Colore (hex)».
- Allegare la foto all'ordine, quando ci sarà il server degli ordini, e cancellarla insieme al PDF.

## Il link del negozio

Il browser non può leggere le pagine di altri siti (regola CORS), quindi serve una piccola funzione sul server del sito, per esempio un Worker:

- riceve `?url=` e accetta solo indirizzi `https` pubblici, senza IP privati, così il server non diventa un ponte verso la rete interna;
- scarica la pagina con un limite di dimensione e di tempo e legge l'immagine principale (`og:image`);
- scarica l'immagine, controlla che sia davvero un'immagine e la restituisce al browser, senza salvarla.

Molti negozi bloccano le richieste automatiche, quindi lo screenshot resta sempre disponibile come alternativa. Le foto dei prodotti sono dei negozi: si usano solo per leggere il colore e non si conservano né si pubblicano.

Quando la funzione esiste, basta impostare il suo indirizzo in `abbinamento.api_link` in `catalogo.json`.

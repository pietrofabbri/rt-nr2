---
titolo: Colori del vestito e colore esatto
stato: attivo
creato: 2026-11-08
aggiornato: 2026-11-09
tag: [configuratore, abbinamento, colore]
sintesi: "Come lo strumento trova i colori del vestito, come si usano per copertina e scritta, e come funziona il colore esatto a pagamento."
---

# Colori del vestito e colore esatto

Decisioni: [0006](decisioni/0006-colori-del-vestito-gratis-colore-esatto-a-10-euro-a-copia.md), che sostituisce la [0004](decisioni/0004-abbinamento-della-copertina-al-vestito-a-10-euro-a-copia.md). Codice: `src/assets/js/abbina.js` (strumento) e `src/assets/js/configura.js` (prezzo e anteprima).

## Come funziona

1. Il cliente carica uno **screenshot o una foto** del vestito, oppure copia l'immagine dal negozio e la incolla. L'immagine resta nel browser.
2. Il sito trova i colori dell'immagine (k-means nello spazio Lab) e tiene solo quelli **del capo**:
   - toglie lo sfondo, cioè il colore più comune lungo i bordi;
   - tiene solo i colori dentro il riquadro occupato dal colore principale, così pulsanti, scritte e banner del negozio restano fuori;
   - scarta le sfumature, cioè i colori che stanno a metà tra due colori più presenti o tra un colore e lo sfondo;
   - unisce le tonalità quasi uguali (ombre dello stesso tessuto).
3. Propone il colore principale per la **copertina** e, se c'è, un secondo colore ben distinto per la **scritta**. Il cliente può cambiare: sceglie la casella (copertina o scritta) e tocca un colore della tavolozza o un punto della foto, oppure scrive il codice.
4. Due proposte:
   - **Con i nostri materiali, al prezzo normale**: le 3 copertine più vicine (differenza CIEDE2000) con la scritta a caldo più vicina. «Usa questa» le sceglie nel configuratore.
   - **Nel colore esatto, 10 € in più a copia**: copertina stampata nel colore del vestito, scritta nel colore scelto. «Scegli il colore esatto» mette nel conto la riga «Colore esatto».

Prove del 9/11/2026: da uno screenshot di un negozio con abito verde, ricamo dorato e pulsante arancione escono solo il verde (92%) e l'oro (8%).

## Da fare

- **Misurare i colori veri delle copertine** sui campioni (foto con luce di giorno accanto a un cartoncino grigio, o colorimetro) e metterli nel Registro VLC. Oggi sono stimati.
- Confermare in bottega la **copertina stampata e plastificata** e la scritta stampata nel colore scelto.
- Allegare all'ordine lo screenshot e i codici dei colori, quando ci sarà il server degli ordini.

## La funzione server (in pausa)

In `worker/` c'è una funzione per Cloudflare Workers che, dal link di un negozio, legge la foto principale (`og:image`) e la restituisce al sito. È provata (`node --test worker/test.mjs`) ma non è usata: si è scelto lo screenshot, che funziona con tutti i negozi. Si pubblica solo se si aggiungono i segreti Cloudflare al repository.

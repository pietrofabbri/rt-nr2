---
titolo: Abbinamento della copertina al vestito
stato: attivo
creato: 2026-11-08
aggiornato: 2026-11-09
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

## Tre modi per dare il vestito

| Modo | Funziona | Come |
| --- | --- | --- |
| **Link del negozio** | Con la funzione server attiva | Il server legge la pagina, prende la foto principale (`og:image`) e la passa al browser |
| **Copia e incolla** | Subito, senza server | Sul negozio «Copia immagine», poi incolla nel riquadro (o ovunque, a pannello aperto). Il colore arriva come file, quindi nessun blocco |
| **Foto o screenshot** | Subito | Scelta del file o trascinamento |

Se il link non funziona (server spento o negozio che blocca), il sito spiega come copiare l'immagine e mette il cursore nel riquadro dove incollarla. Un link diretto a un'immagine (`.jpg`, `.png`, `img01.ztat.net`…) si prova anche senza server.

Verifica del 9/11/2026: la pagina prodotto di Zalando, letta da un server, contiene `og:image` con la foto *packshot* su fondo bianco (`img01.ztat.net`), adatta a leggere il colore.

## La funzione server

Codice in `worker/index.js`, senza dipendenze, per Cloudflare Workers (piano gratuito). Test: `node --test worker/test.mjs`.

- `GET /?url=<pagina>`: legge la pagina (massimo 3 MB, 8 secondi), cerca `og:image`, poi `twitter:image`, `image_src` e JSON-LD, e restituisce l'immagine.
- `GET /?img=<immagine>`: restituisce l'immagine con le intestazioni CORS.
- Protezioni: solo `https`, niente indirizzi IP, `localhost` o porte non standard, anche dopo i reindirizzamenti; solo immagini JPEG, PNG, WebP, AVIF o GIF fino a 8 MB; risponde solo alle origini del sito (`ORIGINI` nel codice). Non salva nulla.
- Si presenta ai negozi con il nome `rilegaretesi-abbinamento/1.0`, senza fingersi un browser: se un negozio blocca i programmi automatici, si rispetta la scelta e il cliente usa copia e incolla.

### Come si attiva (una volta)

1. Crea un account gratuito su <https://dash.cloudflare.com>.
2. In *My Profile → API Tokens* crea un token con il modello **Edit Cloudflare Workers**. Copia anche l'**Account ID** (pagina *Workers & Pages*).
3. Nel repository GitHub, *Settings → Secrets and variables → Actions*: aggiungi i segreti `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID`.
4. Avvia il workflow **Pubblica la funzione colore** (scheda *Actions*). L'indirizzo sarà simile a `https://rilegaretesi-colore.<nome>.workers.dev`.
5. Sempre in *Secrets and variables → Actions*, scheda *Variables*: crea `API_COLORE` con quell'indirizzo e avvia **Pubblica lo staging**.

Quando il sito passerà su rilegaretesi.it, l'indirizzo va aggiunto a `ORIGINI` (c'è già) e la funzione si può spostare su un percorso del dominio.

Le foto dei prodotti sono dei negozi: si usano solo per leggere il colore, non si conservano né si pubblicano.

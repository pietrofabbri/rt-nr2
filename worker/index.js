// Funzione server per l'abbinamento al vestito: dal link di un negozio restituisce la foto del prodotto.
//
//   GET /?url=https://www.negozio.it/pagina-del-vestito   legge la pagina e restituisce l'immagine og:image
//   GET /?img=https://cdn.negozio.it/foto.jpg              restituisce l'immagine con le intestazioni CORS
//
// Non salva nulla: legge, controlla e inoltra. Gira su Cloudflare Workers, senza dipendenze.

const ORIGINI = [
  "https://pietrofabbri.github.io",
  "https://rilegaretesi.it",
  "https://www.rilegaretesi.it",
  "http://localhost:8765",
  "http://localhost:8766",
];
const MAX_PAGINA = 3 * 1024 * 1024;
const MAX_IMMAGINE = 8 * 1024 * 1024;
const TEMPO = 8000;
const AGENTE = "rilegaretesi-abbinamento/1.0 (+https://rilegaretesi.it)";

export function urlSicuro(testo) {
  let u;
  try { u = new URL(testo); } catch { return null; }
  if (u.protocol !== "https:") return null;
  if (u.username || u.password) return null;
  if (u.port && u.port !== "443") return null;
  const host = u.hostname.toLowerCase();
  if (!host.includes(".") || host.endsWith(".local") || host.endsWith(".internal") || host === "localhost") return null;
  if (/^[\d.]+$/.test(host) || host.startsWith("[") || host.includes(":")) return null; // niente indirizzi IP
  return u;
}

function decodifica(s) {
  return s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x2F;/gi, "/").replace(/&#39;/g, "'");
}

// Cerca l'immagine principale: og:image, twitter:image, link image_src, poi JSON-LD "image".
export function immagineDaHtml(html, base) {
  const meta = [...html.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0]);
  const attr = (tag, nome) => {
    const r = tag.match(new RegExp(nome + "\\s*=\\s*([\"'])(.*?)\\1", "i"));
    return r ? decodifica(r[2]) : null;
  };
  const cerca = (chiavi) => {
    for (const tag of meta) {
      const k = (attr(tag, "property") || attr(tag, "name") || "").toLowerCase();
      if (chiavi.includes(k)) {
        const v = attr(tag, "content");
        if (v) return v;
      }
    }
    return null;
  };
  let trovata = cerca(["og:image:secure_url", "og:image", "og:image:url"]) || cerca(["twitter:image", "twitter:image:src"]);
  if (!trovata) {
    const link = html.match(/<link\b[^>]*rel\s*=\s*["']image_src["'][^>]*>/i);
    if (link) {
      const h = link[0].match(/href\s*=\s*(["'])(.*?)\1/i);
      if (h) trovata = decodifica(h[2]);
    }
  }
  if (!trovata) {
    for (const blocco of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
      try {
        const dati = JSON.parse(blocco[1]);
        const lista = Array.isArray(dati) ? dati : [dati];
        for (const d of lista) {
          const img = Array.isArray(d.image) ? d.image[0] : d.image;
          const u = typeof img === "string" ? img : img && img.url;
          if (u) { trovata = u; break; }
        }
      } catch { /* JSON non valido: si ignora */ }
      if (trovata) break;
    }
  }
  if (!trovata) return null;
  try { return new URL(trovata, base).toString(); } catch { return null; }
}

async function leggi(risposta, max) {
  const lunghezza = Number(risposta.headers.get("content-length") || 0);
  if (lunghezza > max) throw new Errore(413, "file troppo grande");
  const lettore = risposta.body.getReader();
  const pezzi = [];
  let totale = 0;
  for (;;) {
    const { done, value } = await lettore.read();
    if (done) break;
    totale += value.byteLength;
    if (totale > max) { lettore.cancel(); throw new Errore(413, "file troppo grande"); }
    pezzi.push(value);
  }
  const tutto = new Uint8Array(totale);
  let pos = 0;
  for (const p of pezzi) { tutto.set(p, pos); pos += p.byteLength; }
  return tutto;
}

class Errore extends Error {
  constructor(stato, messaggio) { super(messaggio); this.stato = stato; }
}

async function scarica(url, accetta, fetcher) {
  const r = await fetcher(url, {
    headers: { "User-Agent": AGENTE, Accept: accetta, "Accept-Language": "it-IT,it;q=0.9" },
    redirect: "follow",
    signal: AbortSignal.timeout(TEMPO),
  });
  if (!r.ok) throw new Errore(502, "il negozio ha risposto " + r.status);
  const finale = urlSicuro(r.url || url);
  if (!finale) throw new Errore(400, "indirizzo non ammesso dopo il reindirizzamento");
  return r;
}

function intestazioni(origine) {
  const h = new Headers({ "Vary": "Origin", "X-Content-Type-Options": "nosniff" });
  if (ORIGINI.includes(origine)) {
    h.set("Access-Control-Allow-Origin", origine);
    h.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  }
  return h;
}

export async function gestisci(richiesta, fetcher = fetch) {
  const origine = richiesta.headers.get("Origin") || "";
  const h = intestazioni(origine);
  if (richiesta.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
  if (richiesta.method !== "GET") return new Response("Metodo non ammesso", { status: 405, headers: h });
  if (!ORIGINI.includes(origine)) return new Response("Origine non ammessa", { status: 403, headers: h });

  const q = new URL(richiesta.url).searchParams;
  try {
    let immagine;
    if (q.get("img")) {
      immagine = urlSicuro(q.get("img"));
      if (!immagine) throw new Errore(400, "indirizzo dell'immagine non valido");
    } else {
      const pagina = urlSicuro(q.get("url") || "");
      if (!pagina) throw new Errore(400, "indirizzo della pagina non valido");
      const r = await scarica(pagina.toString(), "text/html,application/xhtml+xml", fetcher);
      const html = new TextDecoder().decode(await leggi(r, MAX_PAGINA));
      const trovata = immagineDaHtml(html, r.url || pagina.toString());
      immagine = trovata && urlSicuro(trovata);
      if (!immagine) throw new Errore(404, "nella pagina non c'è una foto del prodotto");
    }
    const ri = await scarica(immagine.toString(), "image/avif,image/webp,image/png,image/jpeg,image/*", fetcher);
    const tipo = (ri.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (!/^image\/(jpeg|png|webp|avif|gif)$/.test(tipo)) throw new Errore(415, "il file non è un'immagine");
    const corpo = await leggi(ri, MAX_IMMAGINE);
    h.set("Content-Type", tipo);
    h.set("Cache-Control", "public, max-age=86400");
    h.set("X-Immagine", immagine.toString());
    return new Response(corpo, { status: 200, headers: h });
  } catch (e) {
    const stato = e instanceof Errore ? e.stato : 502;
    h.set("Content-Type", "text/plain; charset=utf-8");
    return new Response(e instanceof Errore ? e.message : "il negozio non risponde", { status: stato, headers: h });
  }
}

export default { fetch: (richiesta) => gestisci(richiesta) };

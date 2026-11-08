// Test della funzione server: node --test worker/test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { urlSicuro, immagineDaHtml, gestisci } from "./index.js";

const ZALANDO = `<html><head>
<meta content="https://img01.ztat.net/article/spp-media-p1/9cc8/a721.png?imwidth=800&amp;filter=packshot" property="og:image">
<meta name="twitter:image" content="https://img01.ztat.net/altro.png"></head><body></body></html>`;
const PNG = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);

function finto(mappa) {
  return async (url) => {
    const v = mappa[url];
    if (!v) return new Response("no", { status: 404 });
    const r = new Response(v.corpo, { status: 200, headers: { "content-type": v.tipo } });
    Object.defineProperty(r, "url", { value: url });
    return r;
  };
}
const richiesta = (q, origine = "https://pietrofabbri.github.io") =>
  new Request("https://colore.example.workers.dev/?" + q, { headers: { Origin: origine } });

test("urlSicuro accetta solo https pubblici", () => {
  assert.ok(urlSicuro("https://www.zalando.it/abito.html"));
  for (const u of ["http://www.zalando.it/x", "https://localhost/x", "https://127.0.0.1/x", "https://[::1]/x",
    "https://10.0.0.1/x", "https://intranet/x", "https://a.b:8443/x", "https://user:pw@a.it/x", "ftp://a.it/x", "non un url"]) {
    assert.equal(urlSicuro(u), null, u);
  }
});

test("og:image con attributi in qualsiasi ordine ed entità HTML", () => {
  assert.equal(immagineDaHtml(ZALANDO, "https://www.zalando.it/p.html"),
    "https://img01.ztat.net/article/spp-media-p1/9cc8/a721.png?imwidth=800&filter=packshot");
});

test("ripiego su JSON-LD e indirizzi relativi", () => {
  const html = `<script type="application/ld+json">{"@type":"Product","image":["/img/abito.jpg"]}</script>`;
  assert.equal(immagineDaHtml(html, "https://negozio.it/prodotti/1"), "https://negozio.it/img/abito.jpg");
  assert.equal(immagineDaHtml("<p>niente</p>", "https://negozio.it/"), null);
});

test("dal link della pagina restituisce la foto con CORS", async () => {
  const f = finto({
    "https://www.zalando.it/abito.html": { corpo: ZALANDO, tipo: "text/html; charset=utf-8" },
    "https://img01.ztat.net/article/spp-media-p1/9cc8/a721.png?imwidth=800&filter=packshot": { corpo: PNG, tipo: "image/png" },
  });
  const r = await gestisci(richiesta("url=" + encodeURIComponent("https://www.zalando.it/abito.html")), f);
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("content-type"), "image/png");
  assert.equal(r.headers.get("access-control-allow-origin"), "https://pietrofabbri.github.io");
  assert.deepEqual(new Uint8Array(await r.arrayBuffer()), PNG);
});

test("rifiuta origini non ammesse, file non immagine e pagine senza foto", async () => {
  const f = finto({
    "https://negozio.it/p": { corpo: "<p>niente</p>", tipo: "text/html" },
    "https://negozio.it/finto.png": { corpo: "<script>", tipo: "text/html" },
  });
  assert.equal((await gestisci(richiesta("url=https%3A%2F%2Fnegozio.it%2Fp", "https://altro.it"), f)).status, 403);
  assert.equal((await gestisci(richiesta("url=https%3A%2F%2Fnegozio.it%2Fp"), f)).status, 404);
  assert.equal((await gestisci(richiesta("img=https%3A%2F%2Fnegozio.it%2Ffinto.png"), f)).status, 415);
  assert.equal((await gestisci(richiesta("url=http%3A%2F%2Fnegozio.it%2Fp"), f)).status, 400);
});

test("blocca i file troppo grandi", async () => {
  const grande = new Uint8Array(9 * 1024 * 1024);
  const f = finto({ "https://cdn.negozio.it/enorme.jpg": { corpo: grande, tipo: "image/jpeg" } });
  assert.equal((await gestisci(richiesta("img=https%3A%2F%2Fcdn.negozio.it%2Fenorme.jpg"), f)).status, 413);
});

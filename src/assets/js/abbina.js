// Abbinamento della copertina al colore del vestito.
// La foto resta nel browser: si legge il colore, si cercano le copertine più vicine (CIEDE2000).
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var form = document.getElementById("configuratore");
  var tela = $("abbina-tela");
  var ctx = tela.getContext("2d", { willReadFrequently: true });
  var dati = null;
  var copertine = [];

  fetch("assets/catalogo.json").then(function (r) { return r.json(); }).then(function (d) {
    dati = d;
    copertine = d.copertine.filter(function (c) { return c.disponibile; }).map(function (c) {
      return { c: c, lab: lab(hexRgb(c.colore)) };
    });
  });

  // ---- Colori -------------------------------------------------------------
  function hexRgb(h) {
    var n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgbHex(r, g, b) {
    return "#" + [r, g, b].map(function (v) { return Math.round(v).toString(16).padStart(2, "0"); }).join("").toUpperCase();
  }
  function lab(rgb) {
    var l = rgb.map(function (v) { v /= 255; return v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92; });
    var x = (l[0] * 0.4124 + l[1] * 0.3576 + l[2] * 0.1805) / 0.95047;
    var y = l[0] * 0.2126 + l[1] * 0.7152 + l[2] * 0.0722;
    var z = (l[0] * 0.0193 + l[1] * 0.1192 + l[2] * 0.9505) / 1.08883;
    var f = function (t) { return t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116; };
    return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
  }
  // Differenza di colore CIEDE2000: sotto 3 la differenza si nota appena.
  function deltaE(a, b) {
    var rad = Math.PI / 180;
    var C1 = Math.hypot(a[1], a[2]), C2 = Math.hypot(b[1], b[2]), Cm = (C1 + C2) / 2;
    var G = 0.5 * (1 - Math.sqrt(Math.pow(Cm, 7) / (Math.pow(Cm, 7) + Math.pow(25, 7))));
    var a1 = (1 + G) * a[1], a2 = (1 + G) * b[1];
    var c1 = Math.hypot(a1, a[2]), c2 = Math.hypot(a2, b[2]);
    var h1 = (Math.atan2(a[2], a1) / rad + 360) % 360, h2 = (Math.atan2(b[2], a2) / rad + 360) % 360;
    var dL = b[0] - a[0], dC = c2 - c1, dh = h2 - h1;
    if (c1 * c2 === 0) dh = 0; else if (dh > 180) dh -= 360; else if (dh < -180) dh += 360;
    var dH = 2 * Math.sqrt(c1 * c2) * Math.sin(dh * rad / 2);
    var Lm = (a[0] + b[0]) / 2, cm = (c1 + c2) / 2;
    var hm = h1 + h2;
    if (c1 * c2 !== 0) hm = Math.abs(h1 - h2) > 180 ? (h1 + h2 + (h1 + h2 < 360 ? 360 : -360)) / 2 : (h1 + h2) / 2;
    var T = 1 - 0.17 * Math.cos((hm - 30) * rad) + 0.24 * Math.cos(2 * hm * rad) + 0.32 * Math.cos((3 * hm + 6) * rad) - 0.2 * Math.cos((4 * hm - 63) * rad);
    var SL = 1 + 0.015 * Math.pow(Lm - 50, 2) / Math.sqrt(20 + Math.pow(Lm - 50, 2));
    var SC = 1 + 0.045 * cm, SH = 1 + 0.015 * cm * T;
    var RT = -2 * Math.sqrt(Math.pow(cm, 7) / (Math.pow(cm, 7) + Math.pow(25, 7))) * Math.sin(60 * Math.exp(-Math.pow((hm - 275) / 25, 2)) * rad);
    return Math.sqrt(Math.pow(dL / SL, 2) + Math.pow(dC / SC, 2) + Math.pow(dH / SH, 2) + RT * (dC / SC) * (dH / SH));
  }
  function croma(l) { return Math.hypot(l[1], l[2]); }
  function tono(l) { return (Math.atan2(l[2], l[1]) * 180 / Math.PI + 360) % 360; }

  // Scritta consigliata: contrasto sui colori chiari, argento sui freddi, oro sui caldi e sul nero.
  function scritta(l) {
    var L = l[0], C = croma(l), h = tono(l);
    if (L > 75) return C > 12 && (h > 330 || h < 45) ? "Oro rosa" : "Bronzo";
    if (C < 8) return L < 35 ? "Oro" : "Argento";
    if (h >= 200 && h <= 320) return "Argento";
    return "Oro";
  }

  // ---- Foto ---------------------------------------------------------------
  function messaggio(t, errore) {
    var m = $("abbina-messaggio");
    m.textContent = t || "";
    m.classList.toggle("abbina__messaggio--errore", !!errore);
  }

  function disegna(img) {
    var max = 520, k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    tela.width = Math.round(img.naturalWidth * k);
    tela.height = Math.round(img.naturalHeight * k);
    ctx.drawImage(img, 0, 0, tela.width, tela.height);
    $("abbina-lavoro").hidden = false;
    $("abbina-mirino").hidden = true;
    palette();
  }

  function caricaFile(file) {
    if (!file) return;
    if (!/^image\//.test(file.type)) { messaggio("Serve una foto o uno screenshot (JPG o PNG).", true); return; }
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function () { disegna(img); URL.revokeObjectURL(url); messaggio(""); };
    img.onerror = function () { messaggio("Non riusciamo a leggere questa immagine. Prova con un JPG o PNG, oppure con uno screenshot.", true); };
    img.src = url;
  }

  // Colori principali della parte centrale della foto, con k-means nello spazio Lab.
  function palette() {
    var w = tela.width, h = tela.height;
    var dati_ = ctx.getImageData(Math.round(w * 0.15), Math.round(h * 0.1), Math.round(w * 0.7), Math.round(h * 0.85)).data;
    var punti = [];
    var passo = Math.max(1, Math.floor(dati_.length / 4 / 4000)) * 4;
    for (var i = 0; i < dati_.length; i += passo) {
      if (dati_[i + 3] < 200) continue;
      punti.push({ rgb: [dati_[i], dati_[i + 1], dati_[i + 2]], lab: lab([dati_[i], dati_[i + 1], dati_[i + 2]]) });
    }
    var k = 6, centri = [];
    for (var c = 0; c < k; c++) centri.push(punti[Math.floor((c + 0.5) * punti.length / k)].lab.slice());
    var gruppi;
    for (var it = 0; it < 10; it++) {
      gruppi = centri.map(function () { return []; });
      punti.forEach(function (p) {
        var best = 0, bd = Infinity;
        centri.forEach(function (ce, j) {
          var d = Math.pow(p.lab[0] - ce[0], 2) + Math.pow(p.lab[1] - ce[1], 2) + Math.pow(p.lab[2] - ce[2], 2);
          if (d < bd) { bd = d; best = j; }
        });
        gruppi[best].push(p);
      });
      centri = gruppi.map(function (g, j) {
        if (!g.length) return centri[j];
        var s = [0, 0, 0];
        g.forEach(function (p) { s[0] += p.lab[0]; s[1] += p.lab[1]; s[2] += p.lab[2]; });
        return s.map(function (v) { return v / g.length; });
      });
    }
    var colori = gruppi.map(function (g) {
      if (!g.length) return null;
      var s = [0, 0, 0];
      g.forEach(function (p) { s[0] += p.rgb[0]; s[1] += p.rgb[1]; s[2] += p.rgb[2]; });
      var rgb = s.map(function (v) { return v / g.length; });
      return { hex: rgbHex(rgb[0], rgb[1], rgb[2]), quota: g.length / punti.length, lab: lab(rgb) };
    }).filter(Boolean).sort(function (a, b) { return b.quota - a.quota; });
    // Le sfumature quasi uguali (ombre dello stesso tessuto) diventano un colore solo.
    var uniti = [];
    colori.forEach(function (col) {
      var simile = uniti.filter(function (u) { return deltaE(u.lab, col.lab) < 8; })[0];
      if (simile) simile.quota += col.quota; else uniti.push(col);
    });
    colori = uniti.filter(function (x) { return x.quota > 0.03; });

    var box = $("abbina-palette");
    box.textContent = "";
    colori.forEach(function (col) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "abbina__colore";
      b.style.setProperty("--c", col.hex);
      b.setAttribute("aria-pressed", "false");
      b.setAttribute("aria-label", col.hex + ", " + Math.round(col.quota * 100) + "% della foto");
      b.innerHTML = "<span></span>" + col.hex;
      b.addEventListener("click", function () { scegli(col.hex); });
      box.appendChild(b);
    });
    // Proposta iniziale: il colore più presente che non sia lo sfondo bianco o grigio.
    var proposta = colori.filter(function (c) { return !(c.lab[0] > 88 && croma(c.lab) < 8); })[0] || colori[0];
    if (proposta) scegli(proposta.hex);
  }

  tela.addEventListener("click", function (e) {
    var r = tela.getBoundingClientRect();
    var x = Math.round((e.clientX - r.left) * tela.width / r.width);
    var y = Math.round((e.clientY - r.top) * tela.height / r.height);
    var lato = 7, x0 = Math.max(0, x - 3), y0 = Math.max(0, y - 3);
    var px = ctx.getImageData(x0, y0, Math.min(lato, tela.width - x0), Math.min(lato, tela.height - y0)).data;
    var ch = [[], [], []];
    for (var i = 0; i < px.length; i += 4) { ch[0].push(px[i]); ch[1].push(px[i + 1]); ch[2].push(px[i + 2]); }
    var med = ch.map(function (a) { a.sort(function (p, q) { return p - q; }); return a[a.length >> 1]; });
    var m = $("abbina-mirino");
    m.hidden = false;
    m.style.left = (e.clientX - r.left) + "px";
    m.style.top = (e.clientY - r.top) + "px";
    scegli(rgbHex(med[0], med[1], med[2]));
  });

  // ---- Scelta del colore e copertine vicine ---------------------------------
  function scegli(hex) {
    hex = hex.toUpperCase();
    $("abbina-hex").value = hex;
    $("abbina-colore").value = hex.toLowerCase();
    $("abbina-campione").style.background = hex;
    document.querySelectorAll(".abbina__colore").forEach(function (b) {
      b.setAttribute("aria-pressed", b.style.getPropertyValue("--c").toUpperCase() === hex ? "true" : "false");
    });
    trova(hex);
  }

  function giudizio(d) {
    if (d < 3) return "Quasi identico";
    if (d < 6) return "Molto vicino";
    if (d < 12) return "Vicino";
    return "Il più vicino che abbiamo";
  }

  function trova(hex) {
    if (!dati) return;
    var l = lab(hexRgb(hex));
    var vicine = copertine.map(function (x) { return { c: x.c, lab: x.lab, d: deltaE(l, x.lab) }; })
      .sort(function (a, b) { return a.d - b.d; }).slice(0, 4);
    var lista = $("abbina-lista");
    lista.textContent = "";
    vicine.forEach(function (v) {
      var sc = scritta(v.lab);
      var li = document.createElement("li");
      li.innerHTML =
        '<span class="abbina__cop" style="--cop:' + v.c.colore + '"></span>' +
        '<span class="abbina__info"><strong></strong><span class="abbina__dettagli"></span></span>' +
        '<button type="button" class="bottone bottone--piccolo">Usa questa</button>';
      li.querySelector("strong").textContent = v.c.nome;
      li.querySelector(".abbina__dettagli").textContent = giudizio(v.d) + ". " + Libro.euro(v.c.prezzo) + ", scritta consigliata: " + sc.toLowerCase() + ".";
      li.querySelector("button").addEventListener("click", function () { usa(v.c, sc); });
      lista.appendChild(li);
    });
    $("abbina-risultati").hidden = false;
  }

  function usa(c, sc) {
    var cop = form.querySelector('input[name="copertina"][value="' + c.codice + '"]');
    var tessera = cop.closest(".tessera");
    if (tessera.hidden) document.getElementById("azzera-filtri").click();
    cop.checked = true;
    var foil = form.querySelector('input[name="testo"][value="' + sc + '"]');
    if (foil) { foil.checked = true; foil.dispatchEvent(new Event("change", { bubbles: true })); }
    $("abbinamento").checked = true;
    $("abbinamento").dispatchEvent(new Event("change", { bubbles: true }));
    var griglia = $("griglia");
    griglia.scrollTop = tessera.offsetTop - griglia.offsetTop - 8;
    messaggio("Fatto: " + c.nome + " con scritta " + sc.toLowerCase() + ". Abbinamento aggiunto all'ordine.");
  }

  // ---- Ingressi -------------------------------------------------------------
  $("abbina-foto").addEventListener("change", function () { caricaFile(this.files[0]); });
  $("abbina-colore").addEventListener("input", function () { scegli(this.value); });
  $("abbina-hex").addEventListener("change", function () {
    var v = this.value.trim();
    if (v[0] !== "#") v = "#" + v;
    if (/^#[0-9a-fA-F]{6}$/.test(v)) { messaggio(""); scegli(v); }
    else messaggio("Il codice colore ha 6 cifre esadecimali, per esempio #6B1E2A.", true);
  });

  // ---- Dal link -------------------------------------------------------------
  // Il browser non può leggere le pagine di altri siti: la pagina la legge la funzione server
  // (abbinamento.api_link). Un link diretto a un'immagine si prova anche senza server.
  function eImmagine(url) {
    return /\.(jpe?g|png|webp|avif|gif)(\?|#|$)/i.test(url) || /(^|\.)ztat\.net$/i.test(new URL(url).hostname);
  }

  function nomeNegozio(url) {
    return new URL(url).hostname.replace(/^www\./, "");
  }

  function consiglioCopia(url) {
    messaggio("Da " + nomeNegozio(url) + " non riusciamo a prendere la foto in automatico. Copia la foto del vestito dalla pagina del negozio (tasto destro o tieni premuto, Copia immagine) e incollala nel riquadro «Copia e incolla la foto».", true);
    $("abbina-incolla").focus();
  }

  function immagineDiretta(url) {
    return new Promise(function (ok, ko) {
      var img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function () {
        try { disegna(img); ok(); } catch (e) { ko(e); }
      };
      img.onerror = ko;
      img.src = url;
    });
  }

  function daServer(url) {
    var api = dati && dati.abbinamento.api_link;
    if (!api) return Promise.reject(new Error("nessun server"));
    var param = eImmagine(url) ? "img" : "url";
    return fetch(api + "?" + param + "=" + encodeURIComponent(url))
      .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.blob(); })
      .then(function (blob) {
        if (!/^image\//.test(blob.type)) throw new Error("non immagine");
        caricaFile(new File([blob], "vestito", { type: blob.type }));
      });
  }

  function daLink(url) {
    url = (url || "").trim();
    var valido = false;
    try { valido = /^https?:$/.test(new URL(url).protocol); } catch (e) { valido = false; }
    if (!valido) { messaggio("Incolla l'indirizzo completo della pagina del vestito, che inizia con https://", true); return; }
    messaggio("Cerco la foto del vestito…");
    daServer(url)
      .catch(function () { if (eImmagine(url)) return immagineDiretta(url).then(function () { messaggio(""); }); throw new Error("pagina"); })
      .catch(function () { consiglioCopia(url); });
  }

  $("abbina-url-vai").addEventListener("click", function () { daLink($("abbina-url").value); });
  $("abbina-url").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); daLink(this.value); } });

  // ---- Incolla e trascina ------------------------------------------------------
  function immagineDa(dt) {
    if (!dt) return null;
    for (var i = 0; i < dt.items.length; i++) {
      if (dt.items[i].kind === "file" && /^image\//.test(dt.items[i].type)) return dt.items[i].getAsFile();
    }
    return null;
  }

  var pannello = document.getElementById("abbina");
  document.addEventListener("paste", function (e) {
    if (!pannello.open) return;
    var file = immagineDa(e.clipboardData);
    var dentro = e.target.id === "abbina-incolla" || e.target.id === "abbina-url";
    if (file) {
      e.preventDefault();
      caricaFile(file);
      $("abbina-incolla").textContent = "";
      return;
    }
    if (dentro) {
      var testo = (e.clipboardData.getData("text/plain") || "").trim();
      if (e.target.id === "abbina-incolla") {
        e.preventDefault();
        if (/^https?:\/\//.test(testo)) { $("abbina-url").value = testo; daLink(testo); }
        else messaggio("Negli appunti non c'è un'immagine. Sul negozio usa «Copia immagine» sulla foto del vestito, poi incolla qui.", true);
      } else if (/^https?:\/\//.test(testo)) {
        setTimeout(function () { daLink($("abbina-url").value); }, 0);
      }
    }
  });
  $("abbina-incolla").addEventListener("input", function () { this.textContent = ""; });
  if (window.matchMedia("(pointer: coarse)").matches) $("abbina-incolla").dataset.testo = "Tocca qui, poi Incolla";

  var zona = document.querySelector(".abbina__fonte.caricamento");
  ["dragenter", "dragover"].forEach(function (t) {
    zona.addEventListener(t, function (e) { e.preventDefault(); zona.classList.add("caricamento--sopra"); });
  });
  ["dragleave", "drop"].forEach(function (t) {
    zona.addEventListener(t, function () { zona.classList.remove("caricamento--sopra"); });
  });
  zona.addEventListener("drop", function (e) {
    e.preventDefault();
    var file = e.dataTransfer.files[0];
    if (file) { caricaFile(file); return; }
    var link = (e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain") || "").split("\n")[0].trim();
    if (link) { $("abbina-url").value = link; daLink(link); }
  });
})();

// Arrivando da "Abbina la tesi al vestito" il pannello è già aperto.
if (location.hash === "#abbina") {
  var pannello = document.getElementById("abbina");
  pannello.open = true;
  pannello.scrollIntoView({ block: "start" });
}

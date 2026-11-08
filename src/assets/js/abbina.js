// Trova i colori del vestito: da uno screenshot o da una foto ricava i colori del capo,
// che si possono usare per la copertina e per la scritta.
// Gratis con i materiali del catalogo; il colore esatto (stampato) costa di più ed è gestito da configura.js.
// L'immagine resta nel browser.
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var form = document.getElementById("configuratore");
  var tela = $("abbina-tela");
  var ctx = tela.getContext("2d", { willReadFrequently: true });
  var dati = null;
  var copertine = [];
  var foil = [];
  var scelta = { copertina: null, scritta: null };

  fetch("assets/catalogo.json").then(function (r) { return r.json(); }).then(function (d) {
    dati = d;
    copertine = d.copertine.filter(function (c) { return c.disponibile; }).map(function (c) {
      return { c: c, lab: lab(hexRgb(c.colore)) };
    });
    foil = d.colori_testo.map(function (t) { return { nome: t.nome, colore: t.colore, lab: lab(hexRgb(t.colore)) }; });
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

  // Scritta consigliata quando il cliente non ha scelto un colore per la scritta.
  function scrittaConsigliata(l) {
    var L = l[0], C = croma(l), h = tono(l);
    if (L > 75) return C > 12 && (h > 330 || h < 45) ? "Oro rosa" : "Bronzo";
    if (C < 8) return L < 35 ? "Oro" : "Argento";
    if (h >= 200 && h <= 320) return "Argento";
    return "Oro";
  }
  function foilPiuVicino(hex) {
    var l = lab(hexRgb(hex));
    return foil.slice().sort(function (a, b) { return deltaE(l, a.lab) - deltaE(l, b.lab); })[0];
  }

  // ---- Nomi dei colori ------------------------------------------------------
  // Al cliente si mostrano nomi, non codici: il codice resta nell'ordine per la bottega.
  var NOMI = [
    ["bianco", "#F7F7F5"], ["panna", "#F3EBD9"], ["avorio", "#EEE3C8"], ["crema", "#F1E3B5"], ["champagne", "#E6D3A8"],
    ["beige", "#D9C6A5"], ["sabbia", "#CDB58C"], ["tortora", "#A39382"], ["cammello", "#B5895A"], ["nocciola", "#9C6B43"],
    ["cognac", "#8E4B22"], ["marrone", "#6B4226"], ["cioccolato", "#4A2C1D"], ["oro antico", "#B8954A"], ["senape", "#C9A227"],
    ["giallo", "#F2D23C"], ["giallo limone", "#F4EA56"], ["pesca", "#F5B994"], ["albicocca", "#F0A35E"], ["arancione", "#E8742A"],
    ["corallo", "#F07B6A"], ["salmone", "#F29B88"], ["terracotta", "#C0603E"], ["rosso", "#C8202A"], ["rosso ciliegia", "#A3122A"],
    ["bordeaux", "#6E1A26"], ["vinaccia", "#5A1F35"], ["rosa cipria", "#E7C3BE"], ["rosa confetto", "#F4C6D4"], ["rosa", "#E99AB4"],
    ["rosa antico", "#C59A98"], ["malva", "#A9798F"], ["fucsia", "#C8287A"], ["magenta", "#B0236F"], ["lilla", "#C2AED2"],
    ["glicine", "#B39BCF"], ["lavanda", "#A99BD6"], ["viola", "#5E3482"], ["prugna", "#5B2A4A"], ["melanzana", "#3E1F3D"],
    ["blu notte", "#141B33"], ["blu navy", "#1E2A4A"], ["blu", "#1F3C88"], ["blu cobalto", "#1F45A0"], ["blu elettrico", "#2A4BE0"],
    ["carta da zucchero", "#8FA9C4"], ["azzurro", "#7DB3E0"], ["celeste", "#B8D8F0"], ["turchese", "#2AA3A6"], ["ottanio", "#1F5C66"],
    ["petrolio", "#1D4B57"], ["verde acqua", "#7CC6B8"], ["verde menta", "#A8DCC0"], ["verde salvia", "#9AAE93"], ["verde oliva", "#6B6B2E"],
    ["verde militare", "#4B5320"], ["kaki", "#8F8456"], ["verde prato", "#3E8E3E"], ["verde lime", "#A6C93A"], ["verde smeraldo", "#137A4F"],
    ["verde bottiglia", "#1F4A35"], ["verde scuro", "#1E3B2B"], ["grigio perla", "#D3D4D2"], ["grigio", "#8E9295"],
    ["grigio antracite", "#3D4044"], ["nero", "#1A1A1C"], ["argento", "#B8BCC2"]
  ].map(function (n) { return { nome: n[0], lab: lab(hexRgb(n[1])) }; });

  function nomeColore(hex) {
    var l = lab(hexRgb(hex));
    var best = NOMI.slice().sort(function (a, b) { return deltaE(l, a.lab) - deltaE(l, b.lab); })[0];
    var d = deltaE(l, best.lab), dl = l[0] - best.lab[0];
    if (d > 10 && Math.abs(dl) > 8 && !/bianco|nero|scuro|notte/.test(best.nome)) return best.nome + (dl > 0 ? " chiaro" : " scuro");
    return best.nome;
  }

  // ---- Immagine -------------------------------------------------------------
  function messaggio(t, errore) {
    var m = $("abbina-messaggio");
    m.textContent = t || "";
    m.classList.toggle("abbina__messaggio--errore", !!errore);
  }

  function caricaFile(file) {
    if (!file) return;
    if (!/^image\//.test(file.type)) { messaggio("Serve uno screenshot o una foto (JPG o PNG).", true); return; }
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function () {
      var max = 520, k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      tela.width = Math.round(img.naturalWidth * k);
      tela.height = Math.round(img.naturalHeight * k);
      ctx.drawImage(img, 0, 0, tela.width, tela.height);
      URL.revokeObjectURL(url);
      $("abbina-lavoro").hidden = false;
      $("abbina-mirino").hidden = true;
      messaggio("");
      trovaColori();
    };
    img.onerror = function () { messaggio("Non riusciamo a leggere questa immagine. Prova con uno screenshot in PNG o JPG.", true); };
    img.src = url;
  }

  function pixel(x, y, w, h, conPosizione) {
    var d = ctx.getImageData(x, y, w, h).data, out = [];
    var passo = Math.max(1, Math.floor(d.length / 4 / 6000)) * 4;
    for (var i = 0; i < d.length; i += passo) {
      if (d[i + 3] <= 200) continue;
      var rgb = [d[i], d[i + 1], d[i + 2]];
      if (conPosizione) { var n = i / 4; out.push({ rgb: rgb, x: x + n % w, y: y + Math.floor(n / w) }); }
      else out.push(rgb);
    }
    return out;
  }

  // Lo sfondo è il colore più comune lungo i bordi dell'immagine.
  function sfondo() {
    var w = tela.width, h = tela.height, b = Math.max(2, Math.round(Math.min(w, h) * 0.04));
    var bordo = pixel(0, 0, w, b).concat(pixel(0, h - b, w, b), pixel(0, 0, b, h), pixel(w - b, 0, b, h));
    var canali = [0, 1, 2].map(function (k) { return bordo.map(function (p) { return p[k]; }).sort(function (a, c) { return a - c; }); });
    return lab(canali.map(function (a) { return a[a.length >> 1]; }));
  }

  // Tiene solo i colori del capo: dentro il riquadro occupato dal colore principale (così pulsanti e
  // scritte del negozio restano fuori) e non sfumature di bordo tra il capo e lo sfondo.
  function soloSulCapo(colori, fondo) {
    if (!colori.length) return colori;
    var princ = colori[0];
    var xs = princ.punti.map(function (p) { return p.x; }).sort(function (a, b) { return a - b; });
    var ys = princ.punti.map(function (p) { return p.y; }).sort(function (a, b) { return a - b; });
    var q = function (a, f) { return a[Math.floor((a.length - 1) * f)]; };
    var mx = (q(xs, 0.98) - q(xs, 0.02)) * 0.08, my = (q(ys, 0.98) - q(ys, 0.02)) * 0.08;
    var box = { x0: q(xs, 0.02) - mx, x1: q(xs, 0.98) + mx, y0: q(ys, 0.02) - my, y1: q(ys, 0.98) + my };
    var dentro = function (c) {
      var n = c.punti.filter(function (p) { return p.x >= box.x0 && p.x <= box.x1 && p.y >= box.y0 && p.y <= box.y1; }).length;
      return n / c.punti.length > 0.7;
    };
    // Una sfumatura sta sulla linea tra due colori più presenti (o tra un colore e lo sfondo).
    var traDue = function (c, a, z) {
        var v = [z[0] - a.lab[0], z[1] - a.lab[1], z[2] - a.lab[2]];
        var u = [c.lab[0] - a.lab[0], c.lab[1] - a.lab[1], c.lab[2] - a.lab[2]];
        var vv = v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
        var t = (u[0] * v[0] + u[1] * v[1] + u[2] * v[2]) / vv;
        if (t < 0.12 || t > 0.88) return false;
        var d = Math.hypot(u[0] - t * v[0], u[1] - t * v[1], u[2] - t * v[2]);
        return d < 7;
    };
    var sfumatura = function (c, i) {
      var prima = colori.slice(0, i).filter(function (a) { return a.quota >= c.quota; });
      return prima.some(function (a) {
        return traDue(c, a, fondo) || prima.some(function (z) { return z !== a && traDue(c, a, z.lab); });
      });
    };
    var tenuti = colori.filter(function (c, i) { return i === 0 || (dentro(c) && !sfumatura(c, i)); });
    var tot = tenuti.reduce(function (s, c) { return s + c.quota; }, 0);
    tenuti.forEach(function (c) { c.quota = c.quota / tot; });
    return tenuti.filter(function (c) { return c.quota > 0.03; });
  }

  // I colori del capo: k-means in Lab nella parte centrale, sfondo escluso, sfumature unite.
  function trovaColori() {
    var w = tela.width, h = tela.height;
    var punti = pixel(0, 0, w, h, true).map(function (p) { p.lab = lab(p.rgb); return p; });
    var fondo = sfondo();
    punti = punti.filter(function (p) { return deltaE(p.lab, fondo) > 10; });
    if (punti.length < 50) { messaggio("Non troviamo il vestito nella foto. Tocca il vestito per prendere il colore.", true); return; }
    var k = Math.min(8, punti.length), centri = [];
    for (var c = 0; c < k; c++) centri.push(punti[Math.floor((c + 0.5) * punti.length / k)].lab.slice());
    var gruppi;
    for (var it = 0; it < 12; it++) {
      gruppi = centri.map(function () { return []; });
      punti.forEach(function (p) {
        var best = 0, bd = Infinity;
        centri.forEach(function (ce, j) {
          var dd = Math.pow(p.lab[0] - ce[0], 2) + Math.pow(p.lab[1] - ce[1], 2) + Math.pow(p.lab[2] - ce[2], 2);
          if (dd < bd) { bd = dd; best = j; }
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
    var colori = gruppi.filter(function (g) { return g.length; }).map(function (g) {
      var s = [0, 0, 0];
      g.forEach(function (p) { s[0] += p.rgb[0]; s[1] += p.rgb[1]; s[2] += p.rgb[2]; });
      var rgb = s.map(function (v) { return v / g.length; });
      return { hex: rgbHex(rgb[0], rgb[1], rgb[2]), quota: g.length / punti.length, lab: lab(rgb), punti: g };
    }).sort(function (a, b) { return b.quota - a.quota; });
    var uniti = [];
    colori.forEach(function (col) {
      var simile = uniti.filter(function (u) { return deltaE(u.lab, col.lab) < 9; })[0];
      if (simile) { simile.quota += col.quota; simile.punti = simile.punti.concat(col.punti); } else uniti.push(col);
    });
    colori = soloSulCapo(uniti.sort(function (a, b) { return b.quota - a.quota; }), fondo);

    var box = $("abbina-palette");
    box.textContent = "";
    colori.forEach(function (col) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "abbina__colore";
      b.dataset.hex = col.hex;
      b.style.setProperty("--c", col.hex);
      var dot = document.createElement("span");
      b.appendChild(dot);
      b.appendChild(document.createTextNode(nomeColore(col.hex)));
      b.addEventListener("click", function () { assegna(dove(), col.hex); });
      box.appendChild(b);
    });
    // Proposta iniziale: il colore principale per la copertina, un secondo colore ben distinto per la scritta.
    if (colori[0]) assegna("copertina", colori[0].hex);
    var secondo = colori.slice(1).filter(function (c) { return deltaE(c.lab, colori[0].lab) > 20; })[0];
    if (secondo) assegna("scritta", secondo.hex); else assegnaMetallo(scrittaConsigliata(colori[0].lab));
    $("abbina-risultati").hidden = false;
  }

  tela.addEventListener("click", function (e) {
    var r = tela.getBoundingClientRect();
    var x = Math.round((e.clientX - r.left) * tela.width / r.width);
    var y = Math.round((e.clientY - r.top) * tela.height / r.height);
    var x0 = Math.max(0, x - 3), y0 = Math.max(0, y - 3);
    var px = ctx.getImageData(x0, y0, Math.min(7, tela.width - x0), Math.min(7, tela.height - y0)).data;
    var ch = [[], [], []];
    for (var i = 0; i < px.length; i += 4) { ch[0].push(px[i]); ch[1].push(px[i + 1]); ch[2].push(px[i + 2]); }
    var med = ch.map(function (a) { a.sort(function (p, q) { return p - q; }); return a[a.length >> 1]; });
    var m = $("abbina-mirino");
    m.hidden = false;
    m.style.left = (e.clientX - r.left) + "px";
    m.style.top = (e.clientY - r.top) + "px";
    assegna(dove(), rgbHex(med[0], med[1], med[2]));
  });

  // ---- Copertina e scritta ----------------------------------------------------
  // scelta.copertina = { hex, nome }; scelta.scritta = { hex, nome, metallo } (metallo: "Oro", "Argento"… se a caldo).
  function dove() { return form.querySelector('input[name="abbina-dove"]:checked').value; }

  function mostra(casella) {
    var v = scelta[casella];
    var campione = $("abbina-campione-" + casella);
    campione.style.background = v ? v.hex : "";
    campione.style.setProperty("--c", v ? v.hex : "");
    campione.classList.toggle("abbina__campione--vuoto", !v);
    campione.classList.toggle("abbina__campione--metallo", !!(v && v.metallo));
    $("abbina-nome-" + casella).textContent = v ? (v.metallo ? v.metallo + ", a caldo" : maiuscola(v.nome)) : "da scegliere";
    document.querySelectorAll(".abbina__colore").forEach(function (b) {
      var h = b.dataset.hex;
      b.classList.toggle("abbina__colore--copertina", !!scelta.copertina && !b.dataset.metallo && h === scelta.copertina.hex);
      b.classList.toggle("abbina__colore--scritta", !!scelta.scritta && (scelta.scritta.metallo ? b.dataset.metallo === scelta.scritta.metallo : !b.dataset.metallo && h === scelta.scritta.hex));
    });
  }
  function maiuscola(t) { return t.charAt(0).toUpperCase() + t.slice(1); }

  function assegna(casella, hex) {
    hex = hex ? hex.toUpperCase() : null;
    scelta[casella] = hex ? { hex: hex, nome: nomeColore(hex), metallo: null } : null;
    mostra(casella);
    proposte();
  }

  function assegnaMetallo(nome) {
    var f = foil.filter(function (x) { return x.nome === nome; })[0];
    if (!f) return;
    scelta.scritta = { hex: f.colore, nome: nome.toLowerCase(), metallo: nome };
    form.querySelector('input[name="abbina-dove"][value="scritta"]').checked = true;
    mostra("scritta");
    proposte();
  }

  function giudizio(d) {
    if (d < 3) return "Quasi identica";
    if (d < 6) return "Molto vicina";
    if (d < 12) return "Vicina";
    return "La più vicina che abbiamo";
  }

  function proposte() {
    if (!dati || !scelta.copertina) return;
    $("abbina-risultati").hidden = false;
    var l = lab(hexRgb(scelta.copertina.hex));
    var s = scelta.scritta;
    var metallo = s ? (s.metallo || foilPiuVicino(s.hex).nome) : null;
    $("abbina-scritta-materiali").textContent = !s
      ? "Per ogni copertina ti consigliamo il metallizzato più adatto."
      : s.metallo
        ? "Scritta in " + s.metallo.toLowerCase() + ", a caldo."
        : "Scritta in " + metallo.toLowerCase() + " a caldo, il metallizzato più vicino al colore scelto. Per la scritta stampata proprio in quel colore, guarda il colore esatto.";

    var vicine = copertine.map(function (x) { return { c: x.c, lab: x.lab, d: deltaE(l, x.lab) }; })
      .sort(function (a, b) { return a.d - b.d; }).slice(0, 3);
    var lista = $("abbina-lista");
    lista.textContent = "";
    vicine.forEach(function (v) {
      var sc = metallo || scrittaConsigliata(v.lab);
      var li = document.createElement("li");
      var cop = document.createElement("span");
      cop.className = "abbina__cop";
      cop.style.setProperty("--cop", v.c.colore);
      var info = document.createElement("span");
      info.className = "abbina__info";
      var nome = document.createElement("strong");
      nome.textContent = v.c.nome;
      var det = document.createElement("span");
      det.className = "abbina__dettagli";
      det.textContent = giudizio(v.d) + ". " + Libro.euro(v.c.prezzo) + ", scritta in " + sc.toLowerCase() + ".";
      info.appendChild(nome);
      info.appendChild(det);
      var bt = document.createElement("button");
      bt.type = "button";
      bt.className = "bottone bottone--piccolo";
      bt.textContent = "Usa questa";
      bt.addEventListener("click", function () { usaMateriale(v.c, sc); });
      li.appendChild(cop);
      li.appendChild(info);
      li.appendChild(bt);
      lista.appendChild(li);
    });
    propostaEsatta();
  }

  // ---- Leggibilità della scritta stampata -------------------------------------
  function luminanza(hex) {
    var c = hexRgb(hex).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  // Rapporto di contrasto WCAG: 3 è il minimo per testi grandi come quelli in copertina.
  function contrasto(a, b) {
    var x = luminanza(a), y = luminanza(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }
  var MIN_CONTRASTO = 3;

  // Se il colore voluto si legge male sulla copertina: il colore leggibile più vicino tra quelli del vestito,
  // i metallizzati, il bianco e il nero.
  function scrittaLeggibile(fondo, voluta) {
    if (contrasto(fondo, voluta.hex) >= MIN_CONTRASTO) return voluta;
    var candidati = [].slice.call(document.querySelectorAll("#abbina-palette .abbina__colore")).map(function (b) { return { hex: b.dataset.hex, nome: nomeColore(b.dataset.hex), metallo: null }; })
      .concat(foil.map(function (f) { return { hex: f.colore, nome: f.nome.toLowerCase(), metallo: f.nome }; }),
        [{ hex: "#FFFFFF", nome: "bianco", metallo: null }, { hex: "#1C1C1C", nome: "nero", metallo: null }]);
    var ok = candidati.filter(function (c) { return contrasto(fondo, c.hex) >= MIN_CONTRASTO; });
    if (!ok.length) ok = [contrasto(fondo, "#FFFFFF") > contrasto(fondo, "#1C1C1C") ? candidati[candidati.length - 2] : candidati[candidati.length - 1]];
    var lv = lab(hexRgb(voluta.hex));
    return ok.sort(function (a, b) { return deltaE(lv, lab(hexRgb(a.hex))) - deltaE(lv, lab(hexRgb(b.hex))); })[0];
  }

  function materialeAttuale() {
    var r = form.querySelector('input[name="copertina"]:checked');
    var cod = r ? r.value : "CP-030";
    return dati.copertine.filter(function (c) { return c.codice === cod; })[0];
  }

  // Proposta «colore esatto»: copertina e/o scritta stampate nel colore del vestito, sempre leggibili.
  var esatta = null;
  function propostaEsatta() {
    if (!dati || !scelta.copertina) return;
    var s = scelta.scritta;
    var chkC = $("abbina-parte-copertina"), chkS = $("abbina-parte-scritta");
    var scrittaStampabile = !!(s && !s.metallo);
    chkS.disabled = !scrittaStampabile;
    $("abbina-parte-scritta-testo").textContent = scrittaStampabile
      ? "Scritta stampata " + s.nome
      : "Scritta stampata nel colore del vestito (scegline uno per la scritta)";
    $("abbina-parte-copertina-testo").textContent = "Copertina stampata " + scelta.copertina.nome;
    var partC = chkC.checked, partS = chkS.checked && scrittaStampabile;
    var mat = materialeAttuale();
    var fondo = partC ? scelta.copertina.hex : mat.colore;

    var testo, corretta = false;
    if (partS) {
      testo = scrittaLeggibile(fondo, s);
      corretta = testo.hex !== s.hex;
    } else {
      var m = s && s.metallo ? s.metallo : scrittaConsigliata(lab(hexRgb(fondo)));
      var f = foil.filter(function (x) { return x.nome === m; })[0] || foil[0];
      testo = { hex: f.colore, nome: f.nome.toLowerCase(), metallo: f.nome };
    }
    esatta = {
      copertina: partC ? scelta.copertina : null,
      scritta: testo.metallo ? null : testo,
      metallo: testo.metallo || null
    };

    var ant = $("abbina-hex-anteprima");
    ant.style.setProperty("--cop", fondo);
    ant.style.color = testo.hex;
    var frasi = [partC ? "Copertina " + scelta.copertina.nome + ", stampata e plastificata in bottega" : "Copertina " + mat.nome + " del catalogo"];
    frasi.push(testo.metallo ? "scritta in " + testo.metallo.toLowerCase() + " a caldo" : "scritta stampata " + testo.nome);
    $("abbina-hex-testo").textContent = frasi.join(", ") + ".";

    var avviso = $("abbina-leggibile");
    avviso.hidden = !corretta;
    if (corretta) {
      avviso.textContent = "Una scritta " + s.nome + " su questa copertina si leggerebbe male: usiamo " +
        (testo.metallo ? "l'" + testo.metallo.toLowerCase() + " a caldo" : "il " + testo.nome) + ", il colore leggibile più vicino.";
    }
    var niente = !esatta.copertina && !esatta.scritta;
    var bt = $("abbina-hex-scegli");
    bt.disabled = niente;
    bt.textContent = niente ? "Scegli copertina o scritta" : "Scegli il colore esatto";
  }

  function usaMateriale(c, sc) {
    var cop = form.querySelector('input[name="copertina"][value="' + c.codice + '"]');
    var tessera = cop.closest(".tessera");
    if (tessera.hidden) document.getElementById("azzera-filtri").click();
    cop.checked = true;
    cop.dispatchEvent(new Event("change", { bubbles: true }));
    var r = form.querySelector('input[name="testo"][value="' + sc + '"]');
    if (r) { r.checked = true; r.dispatchEvent(new Event("change", { bubbles: true })); }
    var griglia = $("griglia");
    griglia.scrollTop = tessera.offsetTop - griglia.offsetTop - 8;
    messaggio("Fatto: " + c.nome + " con scritta in " + sc.toLowerCase() + ", al prezzo normale.");
  }

  $("abbina-hex-scegli").addEventListener("click", function () {
    if (!esatta || (!esatta.copertina && !esatta.scritta)) return;
    $("hex-copertina").value = esatta.copertina ? esatta.copertina.hex : "";
    $("hex-copertina-nome").value = esatta.copertina ? esatta.copertina.nome : "";
    $("hex-scritta").value = esatta.scritta ? esatta.scritta.hex : "";
    $("hex-scritta-nome").value = esatta.scritta ? esatta.scritta.nome : "";
    if (esatta.copertina) form.querySelectorAll('input[name="copertina"]').forEach(function (r) { r.checked = false; });
    if (esatta.metallo) {
      var r = form.querySelector('input[name="testo"][value="' + esatta.metallo + '"]');
      if (r) r.checked = true;
    }
    form.dispatchEvent(new Event("hex-cambiato"));
    messaggio("Fatto: colore esatto del vestito, " + Libro.euro(dati.abbinamento.prezzo_hex) + " in più a copia.");
    $("hex-stato").scrollIntoView({ block: "nearest" });
  });
  ["abbina-parte-copertina", "abbina-parte-scritta"].forEach(function (id) { $(id).addEventListener("change", propostaEsatta); });
  form.querySelectorAll('input[name="copertina"]').forEach(function (r) { r.addEventListener("change", propostaEsatta); });

  // ---- Ingressi -------------------------------------------------------------
  document.querySelectorAll("#abbina-metalli .abbina__colore").forEach(function (b) {
    b.addEventListener("click", function () { assegnaMetallo(b.dataset.metallo); });
  });
  $("abbina-colore-mano").addEventListener("input", function () { assegna(dove(), this.value); });
  $("abbina-foto").addEventListener("change", function () { caricaFile(this.files[0]); });

  function immagineDa(dt) {
    if (!dt) return null;
    for (var i = 0; i < dt.items.length; i++) {
      if (dt.items[i].kind === "file" && /^image\//.test(dt.items[i].type)) return dt.items[i].getAsFile();
    }
    return null;
  }
  var pannello = $("abbina");
  document.addEventListener("paste", function (e) {
    if (!pannello.open) return;
    var file = immagineDa(e.clipboardData);
    if (file) { e.preventDefault(); caricaFile(file); $("abbina-incolla").textContent = ""; return; }
    if (e.target.id === "abbina-incolla") {
      e.preventDefault();
      messaggio("Negli appunti non c'è un'immagine. Sul negozio usa «Copia immagine» sulla foto del vestito, oppure fai uno screenshot.", true);
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
    if (file) caricaFile(file);
    else messaggio("Trascina il file dell'immagine, oppure usa «Copia immagine» e incolla.", true);
  });

  // Arrivando da "Trova i colori del vestito" il pannello è già aperto.
  if (location.hash === "#abbina") {
    pannello.open = true;
    pannello.scrollIntoView({ block: "start" });
  }
})();

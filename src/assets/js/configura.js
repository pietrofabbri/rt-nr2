// Configuratore: anteprima della copertina, controllo del PDF, prezzo e data di spedizione.
(function () {
  var form = document.getElementById("configuratore");
  var libro = document.getElementById("libro-conf");
  var $ = function (id) { return document.getElementById(id); };
  var dati = null;
  var perCodice = {};
  var esitoPdf = null;

  fetch("assets/catalogo.json")
    .then(function (r) { return r.json(); })
    .then(function (d) {
      dati = d;
      d.copertine.forEach(function (c) { perCodice[c.codice] = c; });
      preseleziona();
      aggiorna();
    });

  function preseleziona() {
    var codice = new URLSearchParams(location.search).get("copertina");
    var input = codice && form.querySelector('input[name="copertina"][value="' + codice + '"]');
    if (input) {
      input.checked = true;
      var griglia = $("griglia");
      var t = input.closest(".tessera");
      griglia.scrollTop = t.offsetTop - griglia.offsetTop - 8;
    }
  }

  function scelto(nome) {
    var el = form.querySelector('input[name="' + nome + '"]:checked');
    return el || null;
  }

  function prezzoStampa(facciate) {
    for (var i = 0; i < dati.stampa.length; i++) {
      var s = dati.stampa[i];
      if (facciate >= s.da && facciate <= s.a) return s.prezzo;
    }
    return null;
  }

  // Data di spedizione o di ritiro. Entro le 12 spesso parte in giornata, ma non è garantito:
  // la data garantita è al più tardi dopo i giorni massimi di lavorazione.
  function aggiornaDate(consegna) {
    var primo = DateRT.spedizione(dati, new Date());
    var ultimo = DateRT.aggiungiLavorativi(dati, primo, dati.ordini.giorni_massimi_lavorazione);
    var oggi = DateRT.iso(new Date()) === DateRT.iso(primo);
    var quando = (oggi ? "spesso già oggi" : "a volte già " + DateRT.fmt(primo)) + ", al più tardi " + DateRT.fmt(ultimo);
    var testo, breve, avviso = "";
    if (consegna === "ritiro") {
      testo = "Pronta per il ritiro in via Voltapaletto 25: " + quando + ".";
      breve = "Ritiro entro " + DateRT.fmt(ultimo);
    } else {
      testo = "Spedizione: " + quando + ". Il corriere consegna di solito in 24-48 ore lavorative dalla spedizione: garantiamo la data di spedizione, non quella di arrivo.";
      breve = "Spedizione entro " + DateRT.fmt(ultimo);
    }
    var laurea = $("laurea").value;
    if (laurea) {
      var dl = DateRT.iso(new Date(laurea + "T12:00:00"));
      if (dl < DateRT.iso(ultimo) || (consegna === "ritiro" && dl === DateRT.iso(ultimo))) {
        avviso = "La laurea è molto vicina e non possiamo garantire di arrivare in tempo: chiamaci allo 0532 208932 prima di ordinare.";
      } else if (consegna !== "ritiro" && dl <= DateRT.iso(DateRT.aggiungiLavorativi(dati, ultimo, 2))) {
        avviso = "Con il corriere potrebbe non arrivare in tempo per la laurea. Se puoi, scegli il ritiro in bottega a Ferrara, oppure chiamaci.";
      }
    }
    var p = $("data-consegna");
    p.textContent = testo;
    p.classList.toggle("data-consegna--avviso", !!avviso);
    if (avviso) {
      var a = document.createElement("strong");
      a.textContent = " " + avviso;
      p.appendChild(a);
    }
    $("conto-data").textContent = breve;
  }

  // Copertina scelta: un materiale del catalogo, oppure il colore esatto del vestito (stampato, +10 € a copia).
  function copertinaScelta() {
    var hexC = $("hex-copertina").value;
    if (hexC) {
      var base = dati.finiture.filter(function (f) { return f.nome === dati.abbinamento.finitura_base_hex; })[0];
      var nomeC = $("hex-copertina-nome").value || "colore del vestito";
      return { nome: nomeC.charAt(0).toUpperCase() + nomeC.slice(1) + " su misura", prezzo: base.prezzo, colore: hexC, finitura: "Stampata", hex: hexC };
    }
    var r = scelto("copertina");
    if (!r) { r = form.querySelector('input[name="copertina"][value="CP-030"]'); r.checked = true; }
    return perCodice[r.value];
  }

  function statoHex(c, hexS, foilRadio) {
    var box = $("hex-stato");
    box.hidden = !(c.hex || hexS);
    if (box.hidden) return;
    $("hex-stato-cop").style.background = c.colore;
    $("hex-stato-scr").style.background = hexS || (foilRadio ? foilRadio.dataset.colore : "");
    $("hex-stato-testo").textContent = "Colore esatto del vestito: copertina " + (c.hex ? c.nome.charAt(0).toLowerCase() + c.nome.slice(1) : c.nome) + ", scritta " +
      (hexS ? "stampata " + $("hex-scritta-nome").value : "in " + (foilRadio ? foilRadio.value.toLowerCase() : "oro") + " a caldo") + ". " +
      Libro.euro(dati.abbinamento.prezzo_hex) + " in più a copia.";
  }

  var ultimoMateriale = "CP-030";
  function togliHex() {
    $("hex-copertina").value = "";
    $("hex-scritta").value = "";
    if (!scelto("copertina")) form.querySelector('input[name="copertina"][value="' + ultimoMateriale + '"]').checked = true;
  }

  function aggiorna() {
    if (!dati) return;
    var c = copertinaScelta();
    var hexS = $("hex-scritta").value;
    var foilRadio = scelto("testo");
    Libro.scritta(libro, hexS || (foilRadio ? foilRadio.dataset.colore : "#C9A24A"));
    libro.classList.toggle("libro--stampato", !!hexS);
    var decoro = $("decoro").checked;
    var facciate = parseInt($("facciate").value, 10);
    var copie = Math.min(50, Math.max(1, parseInt($("copie").value, 10) || 1));
    var max = dati.stampa[dati.stampa.length - 1].a;
    var cons = scelto("consegna");
    var prezzoConsegna = Number(cons.dataset.prezzo);

    Libro.copertina(libro, { colore: c.colore, finitura: Libro.classeFinitura(c.finitura), nome: c.nome, prezzo: Libro.euro(c.prezzo) });
    Libro.decoro(libro, decoro);
    $("riga-decoro").hidden = !decoro;
    $("riga-abbinamento").hidden = !(c.hex || hexS);
    statoHex(c, hexS, foilRadio);
    $("conto-copertina").textContent = Libro.euro(c.prezzo);
    $("conto-copie").textContent = copie;
    $("conto-consegna-nome").textContent = cons.value === "ritiro" ? "Ritiro in bottega" : "Spedizione";
    $("conto-consegna").textContent = prezzoConsegna ? Libro.euro(prezzoConsegna) : "gratis";
    aggiornaDate(cons.value);
    mostraEsito();

    if (facciate > 0) { $("facciate").removeAttribute("aria-invalid"); erroreTappa(1, ""); }
    var stampa = facciate > 0 ? prezzoStampa(facciate) : null;
    var riepilogo = $("riepilogo");
    if (stampa === null) {
      ["conto-stampa", "conto-copia", "conto-totale", "barra-totale"].forEach(function (id) { $(id).textContent = "—"; });
      riepilogo.textContent = facciate > max
        ? "Oltre " + max + " facciate facciamo un preventivo su misura: scrivici a info@rilegaretesi.it."
        : "Carica il PDF o indica il numero di facciate per vedere il totale.";
      return;
    }
    var copia = c.prezzo + (decoro ? dati.decoro.prezzo : 0) + (c.hex || hexS ? dati.abbinamento.prezzo_hex : 0) + stampa;
    var totale = copia * copie + prezzoConsegna;
    $("conto-stampa").textContent = Libro.euro(stampa);
    $("conto-copia").textContent = Libro.euro(copia);
    $("conto-totale").textContent = Libro.euro(totale);
    $("barra-totale").textContent = Libro.euro(totale);
    riepilogo.textContent = copie + (copie === 1 ? " copia" : " copie") + " in " + c.nome + (hexS ? " con scritta " + $("hex-scritta-nome").value + " stampata" : "") + ", " + facciate + " facciate, " +
      (cons.value === "ritiro" ? "ritiro in bottega" : "spedizione compresa") + ": " + Libro.euro(totale) + ".";
  }

  // Esito del controllo del PDF
  function elencoPagine(pagine) {
    var primi = pagine.slice(0, 8).join(", ");
    return pagine.length > 8 ? primi + " e altre " + (pagine.length - 8) : primi;
  }
  function riga(lista, testo, tipo) {
    var li = document.createElement("li");
    li.className = "esito--" + tipo;
    li.textContent = testo;
    lista.appendChild(li);
  }
  function mostraEsito() {
    if (!esitoPdf || esitoPdf.errore) return;
    var lista = $("esito-controlli");
    lista.textContent = "";
    var e = esitoPdf;
    riga(lista, e.facciate + " facciate: le abbiamo inserite nel prezzo.", "ok");
    if (e.nonA4.length) riga(lista, (e.nonA4.length === e.facciate ? "Le pagine non sono" : "Le pagine " + elencoPagine(e.nonA4) + " non sono") + " in formato A4: le stampiamo in A4, controlla che il risultato ti vada bene.", "attenzione");
    if (e.orizzontali.length) riga(lista, "Pagine orizzontali: " + elencoPagine(e.orizzontali) + ". Le stampiamo ruotate, come succede nei libri.", "info");
    if (!e.bianchiControllati) {
      riga(lista, "Con più di 600 facciate le pagine bianche le controlliamo noi in bottega.", "info");
    } else if (e.bianche.length) {
      var fr = scelto("lati").value === "fronte-retro";
      riga(lista, (e.bianche.length === 1 ? "Una pagina bianca: " : e.bianche.length + " pagine bianche: ") + elencoPagine(e.bianche) + ". " +
        (fr ? "Con il fronte e retro servono a far iniziare i capitoli sulla pagina dispari: se le hai messe tu, va bene così."
            : "Con la stampa solo fronte diventano fogli bianchi nella tesi. Sono volute?"), fr ? "info" : "attenzione");
    }
    if (!e.nonA4.length && !e.bianche.length && e.bianchiControllati) riga(lista, "Formato A4 e nessuna pagina bianca.", "ok");
    if (typeof e.colori === "number") {
      riga(lista, e.colori
        ? (e.colori === 1 ? "Una pagina a colori" : e.colori + " pagine a colori") + ": le stampiamo allo stesso prezzo del bianco e nero."
        : "Nessuna pagina a colori: se ne aggiungi, il prezzo non cambia.", "ok");
      lista.lastChild.classList.add("esito--risalto");
    }
  }

  function scegliFile(file) {
    if (!file) return;
    var box = $("esito");
    box.hidden = false;
    $("esito-file").textContent = file.name + ": controllo in corso…";
    $("esito-controlli").textContent = "";
    esitoPdf = null;
    var avvia = function () {
      ControlloPDF.analizza(file, function (i, n) {
        $("esito-file").textContent = file.name + ": pagina " + i + " di " + n + "…";
      }).then(function (e) {
        esitoPdf = e;
        if (e.errore) {
          $("esito-file").textContent = file.name;
          riga($("esito-controlli"), "Questo file non è un PDF. Se hai la tesi in Word, salvala come PDF (File › Salva con nome › PDF) e caricala di nuovo.", "errore");
          return;
        }
        var peso = file.size >= 1048576 ? (file.size / 1048576).toFixed(1).replace(".", ",") + " MB" : Math.max(1, Math.round(file.size / 1024)) + " KB";
        $("esito-file").textContent = file.name + ", " + peso;
        $("facciate").value = e.facciate;
        sfogliaTesi(e);
        var titolo = form.querySelector('[data-anteprima="titolo"]');
        if (e.titolo && !titolo.value) {
          titolo.value = e.titolo;
          Libro.testo(libro, "titolo", e.titolo, titolo.placeholder);
        }
        aggiorna();
      }).catch(function () {
        $("esito-file").textContent = file.name;
        riga($("esito-controlli"), "Non riusciamo a leggere questo PDF: potrebbe essere protetto da password o danneggiato. Prova a esportarlo di nuovo, oppure scrivici.", "errore");
      });
    };
    if (window.ControlloPDF) avvia();
    else window.addEventListener("controllo-pdf-pronto", avvia, { once: true });
  }

  // Miniature delle pagine e conteggio delle pagine a colori (che non costano di più)
  function sfogliaTesi(e) {
    var box = $("sfoglia-box"), strip = $("sfoglia"), stato = $("sfoglia-stato");
    strip.textContent = "";
    box.hidden = false;
    stato.textContent = "";
    ControlloPDF.sfoglia(strip, e.bianche, function (i, n, colori) {
      stato.textContent = i < n ? "pagina " + i + " di " + n + "…" : "";
      if (i === n && esitoPdf === e) { e.colori = colori; mostraEsito(); }
    });
  }

  $("pdf").addEventListener("change", function () { scegliFile(this.files[0]); });
  var zona = $("caricamento");
  ["dragenter", "dragover"].forEach(function (t) {
    zona.addEventListener(t, function (e) { e.preventDefault(); zona.classList.add("caricamento--sopra"); });
  });
  ["dragleave", "drop"].forEach(function (t) {
    zona.addEventListener(t, function () { zona.classList.remove("caricamento--sopra"); });
  });
  zona.addEventListener("drop", function (e) {
    e.preventDefault();
    if (e.dataTransfer.files.length) scegliFile(e.dataTransfer.files[0]);
  });

  // Filtri della griglia
  var filtroFinitura = "";
  function filtra() {
    var famiglia = $("filtro-famiglia").value;
    var visibili = 0;
    form.querySelectorAll(".tessera").forEach(function (t) {
      var okF = !filtroFinitura || (filtroFinitura === "__scelti" ? t.hasAttribute("data-scelto") : t.dataset.finitura === filtroFinitura);
      var ok = okF && (!famiglia || t.dataset.famiglia === famiglia);
      t.hidden = !ok;
      if (ok) visibili++;
    });
    $("griglia-vuota").hidden = visibili > 0;
  }
  form.querySelectorAll(".filtro").forEach(function (b) {
    b.addEventListener("click", function () {
      filtroFinitura = b.dataset.valore;
      form.querySelectorAll(".filtro").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      filtra();
    });
  });
  $("filtro-famiglia").addEventListener("change", filtra);
  $("azzera-filtri").addEventListener("click", function () {
    filtroFinitura = "";
    $("filtro-famiglia").value = "";
    form.querySelectorAll(".filtro").forEach(function (x, i) { x.setAttribute("aria-pressed", i === 0 ? "true" : "false"); });
    filtra();
  });

  // Scritta e anteprima dei testi
  form.querySelectorAll('input[name="testo"]').forEach(function (r) {
    r.addEventListener("change", function () { $("hex-scritta").value = ""; Libro.scritta(libro, r.dataset.colore); });
  });
  form.querySelectorAll("[data-anteprima]").forEach(function (input) {
    input.addEventListener("input", function () {
      Libro.testo(libro, input.dataset.anteprima, input.value, input.placeholder);
    });
  });

  // Copie
  form.querySelectorAll("[data-copie]").forEach(function (b) {
    b.addEventListener("click", function () {
      var n = (parseInt($("copie").value, 10) || 1) + parseInt(b.dataset.copie, 10);
      $("copie").value = Math.min(50, Math.max(1, n));
      aggiorna();
    });
  });

  // Fattura
  $("vuole-fattura").addEventListener("change", function () { $("campi-fattura").hidden = !this.checked; });

  form.querySelectorAll('input[name="copertina"]').forEach(function (r) {
    r.addEventListener("change", function () { ultimoMateriale = r.value; togliHex(); });
  });
  $("hex-togli").addEventListener("click", function () { togliHex(); aggiorna(); });
  form.addEventListener("hex-cambiato", aggiorna);
  form.addEventListener("change", aggiorna);
  form.addEventListener("input", function (e) { if (e.target.id !== "pdf" && e.target.id.indexOf("abbina") !== 0) aggiorna(); });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var facciate = $("facciate");
    if (!(parseInt(facciate.value, 10) > 0)) {
      facciate.setAttribute("aria-invalid", "true");
      facciate.focus();
      $("riepilogo").textContent = "Manca il numero di facciate: carica il PDF o scrivilo a mano.";
      return;
    }
    facciate.removeAttribute("aria-invalid");
    if ($("vuole-fattura").checked && (!$("f-nome").value.trim() || !$("f-piva").value.trim())) {
      $("f-nome").focus();
      $("riepilogo").textContent = "Per la fattura servono almeno ragione sociale e partita IVA o codice fiscale.";
      return;
    }
    var avviso = $("avviso-staging");
    if (avviso) avviso.hidden = false;
  });

  // ---- Passi: uno alla volta, con riepilogo finale -------------------------------
  var tappe = [].slice.call(form.querySelectorAll(".tappa"));
  var tappa = 1;

  function erroreTappa(n, testo) {
    var sez = tappe[n - 1];
    var p = sez.querySelector(".tappa__errore");
    if (!p) {
      p = document.createElement("p");
      p.className = "tappa__errore";
      p.setAttribute("role", "alert");
      sez.insertBefore(p, sez.querySelector(".tappa__nav"));
    }
    p.textContent = testo || "";
    p.hidden = !testo;
  }

  function puoAndareOltre(n) {
    if (n === 1 && !(parseInt($("facciate").value, 10) > 0)) {
      $("facciate").setAttribute("aria-invalid", "true");
      erroreTappa(1, "Carica il PDF della tesi oppure scrivi quante facciate ha: serve per il prezzo.");
      return false;
    }
    erroreTappa(n, "");
    $("facciate").removeAttribute("aria-invalid");
    return true;
  }

  function vai(n, senzaFocus) {
    tappa = n;
    tappe.forEach(function (t, i) { t.hidden = i !== n - 1; });
    form.querySelectorAll(".tappe button").forEach(function (b) {
      var k = Number(b.dataset.vai);
      if (k === n) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
      b.classList.toggle("tappe__fatta", k < n);
    });
    $("barra-avanti").textContent = n < tappe.length ? "Avanti" : "Paga";
    if (n === tappe.length) riepilogoOrdine();
    if (!senzaFocus) {
      var titolo = tappe[n - 1].querySelector(".tappa__titolo");
      titolo.setAttribute("tabindex", "-1");
      form.scrollIntoView({ block: "start" });
      titolo.focus({ preventScroll: true });
    }
  }

  function avanti() { if (puoAndareOltre(tappa)) vai(tappa + 1); }
  form.querySelectorAll("[data-avanti]").forEach(function (b) { b.addEventListener("click", avanti); });
  form.querySelectorAll("[data-indietro]").forEach(function (b) { b.addEventListener("click", function () { vai(tappa - 1); }); });
  form.querySelectorAll(".tappe button").forEach(function (b) { b.addEventListener("click", function () { vai(Number(b.dataset.vai)); }); });
  $("barra-avanti").addEventListener("click", function () {
    if (tappa < tappe.length) avanti(); else $("ordina").click();
  });

  function rigaRiepilogo(dl, etichetta, valore, n) {
    var div = document.createElement("div");
    var dt = document.createElement("dt");
    dt.textContent = etichetta;
    var dd = document.createElement("dd");
    dd.textContent = valore;
    div.appendChild(dt);
    div.appendChild(dd);
    if (n) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "collegamento collegamento--piccolo";
      b.textContent = "Modifica";
      b.addEventListener("click", function () { vai(n); });
      div.appendChild(b);
    }
    dl.appendChild(div);
  }

  function riepilogoOrdine() {
    var box = $("riepilogo-ordine");
    box.textContent = "";
    var dl = document.createElement("dl");
    var tip = scelto("tipologia");
    rigaRiepilogo(dl, "Rilegatura", tip ? tip.closest(".scelta").querySelector(".scelta__nome").textContent : "", 1);
    var file = $("pdf").files[0];
    rigaRiepilogo(dl, "La tesi", (file ? file.name + ", " : "") + $("facciate").value + " facciate, " +
      (scelto("lati").value === "fronte-retro" ? "fronte e retro" : "solo fronte"), 1);
    var c = copertinaScelta();
    rigaRiepilogo(dl, "Copertina", c.nome + (c.hex ? ", stampata nel colore del vestito" : ""), 2);
    var hexS = $("hex-scritta").value, foilR = scelto("testo");
    rigaRiepilogo(dl, "Scritta", (hexS ? "stampata " + $("hex-scritta-nome").value : (foilR ? foilR.value.toLowerCase() : "oro") + " a caldo") +
      ($("decoro").checked ? ", con cornice decorativa" : ""), 3);
    var titolo = form.querySelector('[data-anteprima="titolo"]').value.trim();
    rigaRiepilogo(dl, "In copertina", titolo ? "«" + titolo + "», dal tuo frontespizio" : "Il frontespizio del tuo PDF", 3);
    var copie = $("copie").value;
    rigaRiepilogo(dl, "Copie", copie, 4);
    var cons = scelto("consegna");
    var laurea = $("laurea").value;
    rigaRiepilogo(dl, "Consegna", cons.dataset.nome + ", " + $("conto-data").textContent.toLowerCase() +
      (laurea ? "; laurea " + new Date(laurea + "T12:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "long" }) : ""), 5);
    rigaRiepilogo(dl, "Totale", $("conto-totale").textContent, null);
    box.appendChild(dl);
  }

  if (location.hash === "#abbina") vai(2, true);
  else vai(1, true);
})();

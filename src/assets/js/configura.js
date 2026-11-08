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

  function aggiorna() {
    if (!dati) return;
    var c = perCodice[scelto("copertina").value];
    var decoro = $("decoro").checked;
    var facciate = parseInt($("facciate").value, 10);
    var copie = Math.min(50, Math.max(1, parseInt($("copie").value, 10) || 1));
    var max = dati.stampa[dati.stampa.length - 1].a;
    var cons = scelto("consegna");
    var prezzoConsegna = Number(cons.dataset.prezzo);

    Libro.copertina(libro, { colore: c.colore, finitura: Libro.classeFinitura(c.finitura), nome: c.nome, prezzo: Libro.euro(c.prezzo) });
    Libro.decoro(libro, decoro);
    $("riga-decoro").hidden = !decoro;
    $("riga-abbinamento").hidden = !$("abbinamento").checked;
    $("conto-copertina").textContent = Libro.euro(c.prezzo);
    $("conto-copie").textContent = copie;
    $("conto-consegna-nome").textContent = cons.value === "ritiro" ? "Ritiro in bottega" : "Spedizione";
    $("conto-consegna").textContent = prezzoConsegna ? Libro.euro(prezzoConsegna) : "gratis";
    aggiornaDate(cons.value);
    mostraEsito();

    var stampa = facciate > 0 ? prezzoStampa(facciate) : null;
    var riepilogo = $("riepilogo");
    if (stampa === null) {
      ["conto-stampa", "conto-copia", "conto-totale", "barra-totale"].forEach(function (id) { $(id).textContent = "—"; });
      riepilogo.textContent = facciate > max
        ? "Oltre " + max + " facciate facciamo un preventivo su misura: scrivici a info@rilegaretesi.it."
        : "Carica il PDF o indica il numero di facciate per vedere il totale.";
      return;
    }
    var abbinamento = $("abbinamento").checked;
    var copia = c.prezzo + (decoro ? dati.decoro.prezzo : 0) + (abbinamento ? dati.abbinamento.prezzo : 0) + stampa;
    var totale = copia * copie + prezzoConsegna;
    $("conto-stampa").textContent = Libro.euro(stampa);
    $("conto-copia").textContent = Libro.euro(copia);
    $("conto-totale").textContent = Libro.euro(totale);
    $("barra-totale").textContent = Libro.euro(totale);
    riepilogo.textContent = copie + (copie === 1 ? " copia" : " copie") + " in " + c.nome + ", " + facciate + " facciate, " +
      (abbinamento ? "abbinata al vestito, " : "") + (cons.value === "ritiro" ? "ritiro in bottega" : "spedizione compresa") + ": " + Libro.euro(totale) + ".";
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
    r.addEventListener("change", function () { Libro.scritta(libro, r.dataset.colore); });
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
})();

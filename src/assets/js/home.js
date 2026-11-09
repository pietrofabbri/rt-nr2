// Campioni in apertura: cambiano la copertina dell'anteprima.
(function () {
  var libro = document.getElementById("libro-home");
  var vai = document.getElementById("vai-configura");
  var campioni = document.querySelectorAll(".campione");
  campioni.forEach(function (b) {
    b.addEventListener("click", function () {
      campioni.forEach(function (x) { x.setAttribute("aria-checked", x === b ? "true" : "false"); });
      Libro.copertina(libro, { colore: b.dataset.colore, finitura: b.dataset.finitura, nome: b.dataset.nome, prezzo: b.dataset.prezzo });
      document.getElementById("palco").style.setProperty("--tinta", b.dataset.colore);
      vai.href = "configura.html?copertina=" + b.dataset.codice;
    });
  });
})();

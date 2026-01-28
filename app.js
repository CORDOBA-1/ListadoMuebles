// Fecha actual en el encabezado
const opcionesFecha = { day: "2-digit", month: "2-digit", year: "numeric" };
document.getElementById("fecha-actual").textContent =
  new Date().toLocaleDateString("es-AR", opcionesFecha);

// Filtro de búsqueda por código / descripción (todas las tablas)
const inputBusqueda = document.getElementById("search-input");

function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function aplicarFiltro() {
  const term = normalizar(inputBusqueda.value.trim());

  // Todas las filas de todas las tablas de precios
  const filas = document.querySelectorAll("table.tabla-precios tbody tr");

  if (!term) {
    filas.forEach((tr) => tr.classList.remove("hidden-row"));
    return;
  }

  filas.forEach((tr) => {
    const celdas = tr.querySelectorAll("td");
    const codigo = celdas[0]?.textContent || "";
    const descripcion = celdas[1]?.textContent || "";
    const texto = normalizar(`${codigo} ${descripcion}`);

    if (texto.includes(term)) {
      tr.classList.remove("hidden-row");
    } else {
      tr.classList.add("hidden-row");
    }
  });
}

inputBusqueda.addEventListener("input", aplicarFiltro);

// Botón PDF: abre el diálogo de impresión (ahí se puede elegir "Guardar como PDF")
document.getElementById("btn-pdf").addEventListener("click", function () {
  window.print();
});

// Filtro por línea de muebles
const filterButtons = document.querySelectorAll(".filter-btn");
const lineSections = document.querySelectorAll(".line-section");

filterButtons.forEach((btn) => {
  btn.addEventListener("click", function () {
    const selectedLine = this.getAttribute("data-line");

    // Limpiar el buscador para evitar conflictos con el filtro por línea
    inputBusqueda.value = "";
    aplicarFiltro();

    // Actualizar estado activo de los botones
    filterButtons.forEach((b) => b.classList.remove("active"));
    this.classList.add("active");

    // Mostrar/ocultar secciones: "Baku" muestra Comedor Baku y Dormitorio Baku; "Dormitorio" muestra Mesas de luz y Dormitorio Baku
    lineSections.forEach((section) => {
      const sectionLine = section.getAttribute("data-line") || "";
      const show =
        selectedLine === "all" ||
        sectionLine.split(/\s+/).some((part) => part === selectedLine);
      section.style.display = show ? "" : "none";
    });
  });
});

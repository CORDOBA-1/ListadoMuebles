  // Fecha actual en el encabezado
  const opcionesFecha = { day: "2-digit", month: "2-digit", year: "numeric" };
  document.getElementById("fecha-actual").textContent =
    new Date().toLocaleDateString("es-AR", opcionesFecha);

  // +21% IVA = COSTO × 1.21 | +35% = (columna +21% IVA) × 1.35
  function parsePrecio(texto) {
    const limpio = (texto || "").trim().replace(/\s/g, "").replace("$", "");
    if (!limpio || limpio === "-") return null;
    const num = limpio.replace(/\./g, "").replace(",", ".");
    const n = parseFloat(num);
    return isNaN(n) ? null : n;
  }

  function formatearPrecio(num) {
    if (num == null || isNaN(num)) return "-";
    const entero = Math.floor(num);
    const decimal = Math.round((num - entero) * 100);
    const parteEntera = entero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const parteDecimal = decimal.toString().padStart(2, "0");
    return "$" + parteEntera + "," + parteDecimal;
  }

  /** Formato para edición: solo $ + número con coma (sin puntos de miles). */
  function formatearPrecioParaEdicion(num) {
    if (num == null || isNaN(num)) return "$";
    const entero = Math.floor(num);
    const decimal = Math.round((num - entero) * 100);
    return "$" + entero + "," + decimal.toString().padStart(2, "0");
  }

  /** Deja solo dígitos y una coma para decimales (máx. 2 decimales). Sin $. */
  function sanitizeCostoInput(str) {
    const sinSigno = (str || "").replace(/\s/g, "").replace("$", "");
    const soloNumerosYComa = sinSigno.replace(/[^\d,]/g, "");
    const partes = soloNumerosYComa.split(",");
    if (partes.length === 1) {
      return partes[0].replace(/\D/g, ""); // solo parte entera
    }
    const entero = (partes[0] || "").replace(/\D/g, "");
    const decimal = (partes[1] || "").replace(/\D/g, "").slice(0, 2);
    return decimal.length ? entero + "," + decimal : entero;
  }

  /** Actualiza las columnas +21% y +35%: +21% = COSTO×1.21, +35% = (+21% IVA)×1.35. */
  function actualizarDesdeCosto(tr) {
    const celdas = tr.querySelectorAll("td");
    if (celdas.length < 6) return;
    const costo = parsePrecio(celdas[2].textContent);
    if (costo != null) {
      const valor21 = costo * 1.21;
      celdas[4].textContent = formatearPrecio(valor21);
      celdas[5].textContent = formatearPrecio(valor21 * 1.35);
    } else {
      celdas[4].textContent = "-";
      celdas[5].textContent = "-";
    }
  }

  /** Recalcula +21% y +35% en todas las filas desde COSTO. */
  function actualizarTodasLasFilas() {
    document.querySelectorAll("table.tabla-precios tbody tr").forEach(actualizarDesdeCosto);
  }

  actualizarTodasLasFilas();

  // Modo edición de precios: al editar COSTO se recalculan solos el 21% y el 35%
  const btnEditarPrecios = document.getElementById("btn-editar-precios");
  let editMode = false;

  function entrarModoEdicion() {
    editMode = true;
    btnEditarPrecios.classList.add("active");
    btnEditarPrecios.textContent = "Salir de edición";
    document.querySelectorAll("table.tabla-precios tbody tr").forEach((tr) => {
      const celdas = tr.querySelectorAll("td");
      if (celdas.length < 6) return;
      const costoCell = celdas[2];
      const costo = parsePrecio(costoCell.textContent);
      costoCell.textContent = formatearPrecioParaEdicion(costo);
      costoCell.contentEditable = true;
      costoCell.classList.add("costo-editable");
      costoCell.setAttribute("data-costo-cell", "1");
    });
  }

  function salirModoEdicion() {
    editMode = false;
    btnEditarPrecios.classList.remove("active");
    btnEditarPrecios.textContent = "Editar precios";
    document.querySelectorAll("table.tabla-precios td[data-costo-cell]").forEach((cell) => {
      cell.contentEditable = false;
      cell.classList.remove("costo-editable");
      cell.removeAttribute("data-costo-cell");
      const tr = cell.closest("tr");
      if (tr) {
        const costo = parsePrecio(cell.textContent);
        if (costo != null) cell.textContent = formatearPrecio(costo);
      }
    });
  }

  btnEditarPrecios.addEventListener("click", function () {
    if (editMode) salirModoEdicion();
    else entrarModoEdicion();
  });

  document.addEventListener("blur", function (e) {
    if (!editMode) return;
    const cell = e.target.closest("td[data-costo-cell]");
    if (!cell) return;
    const tr = cell.closest("tr");
    if (!tr) return;
    const costo = parsePrecio(cell.textContent);
    if (costo != null) {
      cell.textContent = formatearPrecio(costo);
      actualizarDesdeCosto(tr);
    } else {
      actualizarDesdeCosto(tr);
    }
  }, true);

  document.addEventListener("input", function (e) {
    if (!editMode) return;
    const cell = e.target.closest("td[data-costo-cell]");
    if (!cell) return;
    const sanitized = sanitizeCostoInput(cell.textContent);
    cell.textContent = sanitized ? "$" + sanitized : "$";
    actualizarDesdeCosto(cell.closest("tr"));
  }, true);

  document.addEventListener("keydown", function (e) {
    if (!editMode) return;
    const cell = e.target.closest("td[data-costo-cell]");
    if (!cell) return;
    if (e.key === "Enter") {
      e.preventDefault();
      cell.blur();
      return;
    }
    // Solo permitir: dígitos, una coma, teclas de control
    const controlKeys = ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
    if (controlKeys.includes(e.key)) return;
    if (e.ctrlKey || e.metaKey) {
      if (["a", "c", "v", "x"].includes(e.key.toLowerCase())) return;
    }
    if (e.key === "$" || e.key === ".") {
      e.preventDefault();
      return;
    }
    if (e.key === ",") {
      if (cell.textContent.replace("$", "").includes(",")) e.preventDefault();
      return;
    }
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  }, true);

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

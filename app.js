  // Tema claro/oscuro (guardado en localStorage)
  const STORAGE_THEME = "muebles-euro-theme";
  const html = document.documentElement;
  const btnTheme = document.getElementById("btn-theme");

  function aplicarTema(dark) {
    if (dark) {
      html.classList.remove("theme-light");
      html.classList.add("theme-dark");
      btnTheme.setAttribute("title", "Modo claro");
      btnTheme.setAttribute("aria-label", "Activar modo claro");
    } else {
      html.classList.remove("theme-dark");
      html.classList.add("theme-light");
      btnTheme.setAttribute("title", "Modo oscuro");
      btnTheme.setAttribute("aria-label", "Activar modo oscuro");
    }
    try { localStorage.setItem(STORAGE_THEME, dark ? "dark" : "light"); } catch (e) {}
  }

  try {
    const saved = localStorage.getItem(STORAGE_THEME);
    aplicarTema(saved === "dark");
  } catch (e) {
    aplicarTema(false);
  }

  btnTheme.addEventListener("click", function () {
    aplicarTema(!html.classList.contains("theme-dark"));
  });

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
    const costoCell = celdas[2];
    const input = costoCell.querySelector("input.costo-input");
    const costo = input
      ? parsePrecio("$" + sanitizeCostoInput(input.value))
      : parsePrecio(costoCell.textContent);
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

  // Modal de contraseña (solo se guarda hash, no la clave en claro)
  const modalEditar = document.getElementById("modal-editar");
  const formModalEditar = document.getElementById("form-modal-editar");
  const inputModalPassword = document.getElementById("modal-password");
  const modalPasswordWrap = inputModalPassword.closest(".modal-password-wrap");
  const modalPasswordToggle = document.getElementById("modal-password-toggle");
  const modalError = document.getElementById("modal-editar-error");
  const modalCancel = document.getElementById("modal-cancel");

  modalPasswordToggle.addEventListener("click", function () {
    const visible = inputModalPassword.type === "text";
    if (visible) {
      inputModalPassword.type = "password";
      modalPasswordWrap.classList.remove("visible");
      modalPasswordToggle.setAttribute("title", "Mostrar contraseña");
      modalPasswordToggle.setAttribute("aria-label", "Mostrar contraseña");
    } else {
      inputModalPassword.type = "text";
      modalPasswordWrap.classList.add("visible");
      modalPasswordToggle.setAttribute("title", "Ocultar contraseña");
      modalPasswordToggle.setAttribute("aria-label", "Ocultar contraseña");
    }
  });

  function abrirModalEditar() {
    inputModalPassword.value = "";
    inputModalPassword.type = "password";
    if (modalPasswordWrap) modalPasswordWrap.classList.remove("visible");
    if (modalPasswordToggle) {
      modalPasswordToggle.setAttribute("title", "Mostrar contraseña");
      modalPasswordToggle.setAttribute("aria-label", "Mostrar contraseña");
    }
    modalError.textContent = "";
    modalEditar.removeAttribute("hidden");
    inputModalPassword.focus();
  }

  function cerrarModalEditar() {
    modalEditar.setAttribute("hidden", "");
    inputModalPassword.value = "";
    modalError.textContent = "";
  }

  async function verificarYEntrar(clave) {
    const enc = new TextEncoder();
    const data = enc.encode(clave);
    const buf = await crypto.subtle.digest("SHA-256", data);
    const hex = Array.from(new Uint8Array(buf))
      .map(function (b) { return b.toString(16).padStart(2, "0"); })
      .join("");
    return hex === "37058d3691ef37af32606164b2ea86fe75b1bbff54b0642e0b47e9b5735d2d9e";
  }

  btnEditarPrecios.addEventListener("click", function () {
    if (editMode) {
      salirModoEdicion();
      return;
    }
    abrirModalEditar();
  });

  formModalEditar.addEventListener("submit", function (e) {
    e.preventDefault();
    const clave = inputModalPassword.value;
    modalError.textContent = "";
    verificarYEntrar(clave).then(function (ok) {
      if (ok) {
        cerrarModalEditar();
        entrarModoEdicion();
      } else {
        modalError.textContent = "Contraseña incorrecta.";
        inputModalPassword.focus();
      }
    });
  });

  modalCancel.addEventListener("click", cerrarModalEditar);
  modalEditar.addEventListener("click", function (e) {
    if (e.target === modalEditar) cerrarModalEditar();
  });
  modalEditar.addEventListener("keydown", function (e) {
    if (e.key === "Escape") cerrarModalEditar();
  });

  function aplicarCostoDesdeInput(input) {
    const cell = input.closest("td");
    const tr = input.closest("tr");
    if (!cell || !tr) return;
    const raw = (input.value || "").trim();
    const costo = raw ? parsePrecio("$" + sanitizeCostoInput(raw)) : null;
    cell.removeAttribute("data-costo-cell");
    cell.classList.remove("costo-editable");
    cell.innerHTML = "";
    cell.textContent = costo != null ? formatearPrecio(costo) : "-";
    cell.setAttribute("data-copyable", "1");
    actualizarDesdeCosto(tr);
  }

  document.addEventListener("blur", function (e) {
    if (!editMode) return;
    const input = e.target.closest("input.costo-input");
    if (!input) return;
    aplicarCostoDesdeInput(input);
  }, true);

  document.addEventListener("keydown", function (e) {
    if (!editMode) return;
    const input = e.target.closest("input.costo-input");
    if (!input) return;
    if (e.key === "Enter") {
      e.preventDefault();
      input.blur();
      return;
    }
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
      if (input.value.includes(",")) e.preventDefault();
      return;
    }
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  }, true);

  document.addEventListener("paste", function (e) {
    if (!editMode) return;
    const input = e.target.closest("input.costo-input");
    if (!input) return;
    e.preventDefault();
    const pasted = (e.clipboardData?.getData("text/plain") || "").trim();
    const sanitized = sanitizeCostoInput(pasted);
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    const newVal = input.value.slice(0, start) + sanitized + input.value.slice(end);
    const sanitizedNew = sanitizeCostoInput(newVal);
    input.value = sanitizedNew;
    input.setSelectionRange(sanitizedNew.length, sanitizedNew.length);
    actualizarDesdeCosto(input.closest("tr"));
  }, true);

  document.addEventListener("input", function (e) {
    if (!editMode) return;
    const input = e.target.closest("input.costo-input");
    if (!input) return;
    actualizarDesdeCosto(input.closest("tr"));
  }, true);

  // Filtro de búsqueda por código / descripción (todas las tablas)
  const inputBusqueda = document.getElementById("search-input");

  function normalizar(texto) {
    return (texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function escapeHtml(str) {
    const s = String(str || "");
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /** Resalta el término de búsqueda en el texto (para código y descripción). */
  function resaltarTexto(texto, term) {
    if (!term || !texto) return escapeHtml(texto);
    const nTerm = normalizar(term);
    const nTexto = normalizar(texto);
    let resultado = "";
    let lastIndex = 0;
    let pos;
    while ((pos = nTexto.indexOf(nTerm, lastIndex)) !== -1) {
      const fin = pos + nTerm.length;
      resultado += escapeHtml(texto.slice(lastIndex, pos)) +
        "<mark>" + escapeHtml(texto.slice(pos, fin)) + "</mark>";
      lastIndex = fin;
    }
    resultado += escapeHtml(texto.slice(lastIndex));
    return resultado;
  }

  const lineSections = document.querySelectorAll(".line-section");
  const searchResultCount = document.getElementById("search-result-count");
  const noResultsMsg = document.getElementById("no-results-msg");

  function quitarResaltadoFilas() {
    document.querySelectorAll("table.tabla-precios tbody tr").forEach((tr) => {
      const celdas = tr.querySelectorAll("td");
      if (celdas[0]) celdas[0].textContent = celdas[0].textContent;
      if (celdas[1]) celdas[1].textContent = celdas[1].textContent;
    });
  }

  function aplicarFiltro() {
    const termRaw = inputBusqueda.value.trim();
    const term = normalizar(termRaw);
    const filas = document.querySelectorAll("table.tabla-precios tbody tr");

    if (!term) {
      quitarResaltadoFilas();
      filas.forEach((tr) => tr.classList.remove("hidden-row"));
      const selectedLine = document.querySelector(".filter-btn.active")?.getAttribute("data-line") || "all";
      lineSections.forEach((section) => {
        const sectionLine = section.getAttribute("data-line") || "";
        const show =
          selectedLine === "all" ||
          sectionLine.split(/\s+/).some((part) => part === selectedLine);
        section.style.display = show ? "" : "none";
      });
      searchResultCount.textContent = "";
      noResultsMsg.style.display = "none";
      return;
    }

    quitarResaltadoFilas();
    filas.forEach((tr) => {
      const celdas = tr.querySelectorAll("td");
      const codigo = celdas[0]?.textContent || "";
      const descripcion = celdas[1]?.textContent || "";
      const texto = normalizar(`${codigo} ${descripcion}`);

      if (texto.includes(term)) {
        tr.classList.remove("hidden-row");
        celdas[0].innerHTML = resaltarTexto(codigo, termRaw);
        celdas[1].innerHTML = resaltarTexto(descripcion, termRaw);
      } else {
        tr.classList.add("hidden-row");
      }
    });

    lineSections.forEach((section) => {
      const tabla = section.querySelector("table.tabla-precios");
      if (!tabla) return;
      const filasVisibles = tabla.querySelectorAll("tbody tr:not(.hidden-row)");
      section.style.display = filasVisibles.length > 0 ? "" : "none";
    });

    const totalVisible = document.querySelectorAll("table.tabla-precios tbody tr:not(.hidden-row)").length;
    if (totalVisible === 0) {
      searchResultCount.textContent = "";
      noResultsMsg.style.display = "block";
    } else {
      searchResultCount.textContent = totalVisible === 1 ? "1 resultado" : totalVisible + " resultados";
      noResultsMsg.style.display = "none";
    }
  }

  inputBusqueda.addEventListener("input", aplicarFiltro);

  // Copiar precio al hacer clic (para consultas rápidas por WhatsApp, etc.)
  function mostrarToast(mensaje) {
    const existente = document.getElementById("toast-copiado");
    if (existente) existente.remove();
    const toast = document.createElement("div");
    toast.id = "toast-copiado";
    toast.className = "toast-copiado";
    toast.textContent = mensaje;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 1500);
  }

  document.querySelectorAll("table.tabla-precios tbody tr").forEach((tr) => {
    const celdas = tr.querySelectorAll("td");
    if (celdas.length < 6) return;
    [celdas[2], celdas[3], celdas[4], celdas[5]].forEach((td) => td.setAttribute("data-copyable", "1"));
  });

  document.addEventListener("click", function (e) {
    const td = e.target.closest("td[data-copyable]");
    if (!td || td.closest("td[data-costo-cell]")) return;
    const precio = td.textContent.trim();
    if (!precio || precio === "-") return;
    const tr = td.closest("tr");
    if (!tr) return;
    const celdas = tr.querySelectorAll("td");
    const descripcion = (celdas[1]?.textContent || "").trim();
    const texto = descripcion ? "" + descripcion + "= " + precio : precio;
    navigator.clipboard.writeText(texto).then(
      () => mostrarToast("Copiado"),
      () => {}
    );
  }, true);

  function valorParaInput(costo) {
    if (costo == null || isNaN(costo)) return "";
    const entero = Math.floor(costo);
    const decimal = Math.round((costo - entero) * 100);
    return entero + "," + decimal.toString().padStart(2, "0");
  }

  function entrarModoEdicion() {
    editMode = true;
    btnEditarPrecios.classList.add("active");
    btnEditarPrecios.textContent = "Salir de edición";
    document.querySelectorAll("table.tabla-precios tbody tr").forEach((tr) => {
      const celdas = tr.querySelectorAll("td");
      if (celdas.length < 6) return;
      const costoCell = celdas[2];
      costoCell.removeAttribute("data-copyable");
      const costo = parsePrecio(costoCell.textContent);
      const valorInput = valorParaInput(costo);
      costoCell.classList.add("costo-editable");
      costoCell.setAttribute("data-costo-cell", "1");
      costoCell.innerHTML = "<span class=\"costo-prefix\">$</span><input type=\"text\" class=\"costo-input\" value=\"" + escapeHtml(valorInput) + "\" />";
      const input = costoCell.querySelector("input.costo-input");
      input.addEventListener("input", function () {
        const sanitized = sanitizeCostoInput(input.value);
        if (sanitized !== input.value) {
          const pos = input.selectionStart ?? 0;
          input.value = sanitized;
          input.setSelectionRange(Math.min(pos, sanitized.length), Math.min(pos, sanitized.length));
        }
        actualizarDesdeCosto(tr);
      });
      actualizarDesdeCosto(tr);
    });
  }

  function salirModoEdicion() {
    editMode = false;
    btnEditarPrecios.classList.remove("active");
    btnEditarPrecios.textContent = "Editar precios";
    document.querySelectorAll("input.costo-input").forEach((input) => {
      aplicarCostoDesdeInput(input);
    });
  }

  // Botón PDF: abre el diálogo de impresión (ahí se puede elegir "Guardar como PDF")
  document.getElementById("btn-pdf").addEventListener("click", function () {
    window.print();
  });

  // Filtro por línea de muebles
  const filterButtons = document.querySelectorAll(".filter-btn");

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

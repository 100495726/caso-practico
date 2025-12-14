// Funcionalidad de búsqueda de destinos
document.addEventListener("DOMContentLoaded", function () {
  const inputBuscador = document.querySelector(".input-buscador");
  const inputBuscadorHeader = document.querySelector(".buscador-header input");

  // Funcionalidad de búsqueda global desde el header
  // Si estamos en cualquier página que NO es destinos.html, redirigimos
  if (inputBuscadorHeader) {
    const esDestinosPage = window.location.pathname.includes("destinos.html");

    inputBuscadorHeader.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        const termino = this.value.trim();
        if (termino) {
          // Redirigir a destinos.html con el parámetro de búsqueda
          const urlBase = esDestinosPage ? "destinos.html" : "destinos.html";
          window.location.href = `${urlBase}?buscar=${encodeURIComponent(
            termino
          )}`;
        }
      }
    });

    // Si estamos en destinos.html, sincronizar con el buscador principal
    if (esDestinosPage && inputBuscador) {
      inputBuscadorHeader.addEventListener("input", function () {
        inputBuscador.value = this.value;
        inputBuscador.dispatchEvent(new Event("input"));
      });
    }
  }

  if (!inputBuscador) return;

  // Crear elemento para mensaje de "sin resultados"
  let mensajeSinResultados = document.createElement("div");
  mensajeSinResultados.className = "mensaje-sin-resultados";
  mensajeSinResultados.style.display = "none";
  mensajeSinResultados.style.textAlign = "center";
  mensajeSinResultados.style.padding = "40px 20px";
  mensajeSinResultados.style.fontSize = "18px";
  mensajeSinResultados.style.color = "#8a7361";
  mensajeSinResultados.innerHTML = `
    <p style="font-weight: 500; margin-bottom: 8px;">No se encontraron destinos</p>
    <p style="font-size: 14px;">Intenta con otro término de búsqueda</p>
  `;

  const contenidoPrincipal = document.querySelector(".contenido-principal");
  if (contenidoPrincipal) {
    contenidoPrincipal.appendChild(mensajeSinResultados);
  }

  // Función de búsqueda
  function buscarDestinos(termino) {
    const terminoLower = termino.toLowerCase().trim();

    // Obtener todas las tarjetas de destinos (populares y recomendados)
    const tarjetasDestino = document.querySelectorAll(".tarjeta-destino");
    const tarjetasRecomendado = document.querySelectorAll(
      ".tarjeta-recomendado"
    );
    const todasLasTarjetas = [...tarjetasDestino, ...tarjetasRecomendado];

    let hayResultados = false;

    todasLasTarjetas.forEach((tarjeta) => {
      const titulo = tarjeta.querySelector(".titulo-destino");
      const descripcion = tarjeta.querySelector(".descripcion-destino");

      if (!titulo) return;

      const textoTitulo = titulo.textContent.toLowerCase();
      const textoDescripcion = descripcion
        ? descripcion.textContent.toLowerCase()
        : "";

      // Buscar el término en el título o descripción
      const coincide =
        textoTitulo.includes(terminoLower) ||
        textoDescripcion.includes(terminoLower);

      if (terminoLower === "" || coincide) {
        tarjeta.style.display = "";
        hayResultados = true;
      } else {
        tarjeta.style.display = "none";
      }
    });

    // Mostrar/ocultar secciones vacías y mensaje
    mostrarSeccionesConResultados(hayResultados, terminoLower);
  }

  // Función para mostrar u ocultar secciones según si tienen resultados
  function mostrarSeccionesConResultados(hayResultados, termino) {
    const secciones = [
      {
        selector: ".grid-destinos-populares",
        titulo: ".seccion:has(.grid-destinos-populares)",
      },
      {
        selector: ".grid-destinos-recomendados",
        titulo: ".seccion:has(.grid-destinos-recomendados)",
      },
    ];

    secciones.forEach((seccionInfo) => {
      const grid = document.querySelector(seccionInfo.selector);
      const seccionTitulo = document.querySelector(seccionInfo.titulo);

      if (!grid || !seccionTitulo) return;

      const tarjetasVisibles = Array.from(grid.children).filter(
        (tarjeta) => tarjeta.style.display !== "none"
      );

      if (tarjetasVisibles.length === 0) {
        seccionTitulo.style.display = "none";
      } else {
        seccionTitulo.style.display = "";
      }
    });

    // Mostrar mensaje si no hay resultados y hay búsqueda activa
    if (mensajeSinResultados) {
      if (!hayResultados && termino !== "") {
        mensajeSinResultados.style.display = "block";
      } else {
        mensajeSinResultados.style.display = "none";
      }
    }
  }

  // Event listener para el input de búsqueda
  inputBuscador.addEventListener("input", function (e) {
    buscarDestinos(e.target.value);
  });

  // Leer parámetro de búsqueda de la URL (cuando se viene desde otra página)
  const urlParams = new URLSearchParams(window.location.search);
  const buscarParam = urlParams.get("buscar");
  if (buscarParam) {
    inputBuscador.value = buscarParam;
    // También actualizar el buscador del header si existe
    if (inputBuscadorHeader) {
      inputBuscadorHeader.value = buscarParam;
    }
    // Ejecutar la búsqueda
    buscarDestinos(buscarParam);
    // Hacer scroll al buscador principal
    inputBuscador.scrollIntoView({ behavior: "smooth", block: "center" });
    inputBuscador.focus();
  }
});

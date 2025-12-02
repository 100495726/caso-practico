// Menú hamburguesa
document.addEventListener("DOMContentLoaded", function () {
  const menuHamburguesa = document.querySelector(".menu-hamburguesa");
  const menuMovil = document.querySelector(".menu-movil");
  const menuOverlay = document.querySelector(".menu-overlay");
  const menuCerrar = document.querySelector(".menu-cerrar");
  const body = document.body;

  // Función para abrir/cerrar el menú
  function toggleMenu() {
    menuHamburguesa.classList.toggle("activo");
    menuMovil.classList.toggle("activo");
    menuOverlay.classList.toggle("activo");
    body.style.overflow = menuMovil.classList.contains("activo")
      ? "hidden"
      : "";
  }

  // Event listener para el botón hamburguesa
  if (menuHamburguesa) {
    menuHamburguesa.addEventListener("click", toggleMenu);
  }

  // Event listener para el botón cerrar
  if (menuCerrar) {
    menuCerrar.addEventListener("click", toggleMenu);
  }

  // Cerrar menú al hacer clic en el overlay
  if (menuOverlay) {
    menuOverlay.addEventListener("click", toggleMenu);
  }

  // Cerrar menú al hacer clic en un enlace
  const enlacesMovil = document.querySelectorAll(".navegacion-movil a");
  enlacesMovil.forEach((enlace) => {
    enlace.addEventListener("click", function () {
      if (menuMovil.classList.contains("activo")) {
        toggleMenu();
      }
    });
  });

  // Cerrar menú al redimensionar a desktop
  window.addEventListener("resize", function () {
    if (window.innerWidth > 767 && menuMovil.classList.contains("activo")) {
      toggleMenu();
    }
  });

  // Cerrar menú con tecla Escape
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && menuMovil.classList.contains("activo")) {
      toggleMenu();
    }
  });
});

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

// Modal del footer y funciones de interacción
function ensureFooterModal() {
  if (document.getElementById("footer-modal-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "footer-modal-overlay";
  overlay.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,.45);
    display: none; align-items: center; justify-content: center;
    padding: 16px; z-index: 9999;
  `;

  const modal = document.createElement("div");
  modal.id = "footer-modal";
  modal.style.cssText = `
    width: min(640px, 100%);
    background: #fff; border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0,0,0,.25);
    padding: 18px 18px 14px;
    font-family: "Plus Jakarta Sans", system-ui, -apple-system, Segoe UI, Roboto, Arial;
    color: #171412;
  `;

  modal.innerHTML = `
    <div style="display:flex; gap:12px; align-items:flex-start; justify-content:space-between;">
      <div>
        <h3 id="footer-modal-title" style="margin:0; font-size:1.15rem; font-weight:800;"></h3>
        <p id="footer-modal-body" style="margin:10px 0 0; color:#4a3f39; line-height:1.45;"></p>
      </div>
      <button id="footer-modal-close" aria-label="Cerrar"
        style="border:0; background:#f1ece8; color:#171412; border-radius:10px; padding:8px 10px; cursor:pointer; font-weight:700;">
        ✕
      </button>
    </div>

    <div id="footer-modal-actions" style="margin-top:14px; display:flex; gap:10px; flex-wrap:wrap;"></div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Cerrar al click fuera
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeFooterModal();
  });

  // Cerrar con botón
  document
    .getElementById("footer-modal-close")
    ?.addEventListener("click", closeFooterModal);

  // Cerrar con ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeFooterModal();
  });
}

function openFooterModal({ title, body, actions = [] }) {
  ensureFooterModal();

  const overlay = document.getElementById("footer-modal-overlay");
  const t = document.getElementById("footer-modal-title");
  const b = document.getElementById("footer-modal-body");
  const a = document.getElementById("footer-modal-actions");

  if (!overlay || !t || !b || !a) return;

  t.textContent = title;
  b.textContent = body;

  a.innerHTML = "";
  actions.forEach((act) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = act.label;
    btn.style.cssText = `
      border:0; border-radius: 10px; padding:10px 12px;
      cursor:pointer; font-weight:800;
      background: ${act.primary ? "#8a7361" : "#f1ece8"};
      color: ${act.primary ? "#fff" : "#171412"};
    `;
    btn.addEventListener("click", () => act.onClick?.());
    a.appendChild(btn);
  });

  overlay.style.display = "flex";
}

function closeFooterModal() {
  const overlay = document.getElementById("footer-modal-overlay");
  if (overlay) overlay.style.display = "none";
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fallback antiguo
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

function initFooterInteractions() {
  // 1) Links del footer: Acerca de / Servicios / Contacto / Privacidad
  document.querySelectorAll("footer .footer-nav a").forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href") || "";
      if (href !== "#") return;

      e.preventDefault();

      const texto = (link.textContent || "").trim().toLowerCase();

      if (texto.includes("acerca")) {
        openFooterModal({
          title: "Acerca de",
          body: "Wanderlust es un proyecto académico para explorar destinos y simular la reserva de packs de viaje.",
          actions: [{ label: "Cerrar", onClick: closeFooterModal }],
        });
        return;
      }

      if (texto.includes("servicios")) {
        openFooterModal({
          title: "Servicios",
          body:
            "• Exploración de destinos\n" +
            "• Reserva de packs (simulación)\n" +
            "• Comunidad: lectura y publicación con inicio de sesión",
          actions: [{ label: "Cerrar", onClick: closeFooterModal }],
        });
        return;
      }

      if (texto.includes("contacto")) {
        openFooterModal({
          title: "Contacto",
          body: "Puedes contactarnos por email o teléfono (demo).",
          actions: [
            {
              label: "Enviar email",
              primary: true,
              onClick: () => {
                closeFooterModal();
                location.href =
                  "mailto:contacto@wanderlust.com?subject=Contacto%20Wanderlust";
              },
            },
            {
              label: "Llamar",
              onClick: () => {
                closeFooterModal();
                location.href = "tel:+34000000000";
              },
            },
          ],
        });
        return;
      }

      if (texto.includes("privacidad")) {
        openFooterModal({
          title: "Política de privacidad",
          body: "Este sitio es una demo: los datos de usuario se guardan localmente en tu navegador (localStorage/sessionStorage). No se envían a ningún servidor.",
          actions: [
            { label: "Entendido", primary: true, onClick: closeFooterModal },
          ],
        });
        return;
      }

      openFooterModal({
        title: "Información",
        body: "Sección en construcción.",
        actions: [{ label: "Cerrar", onClick: closeFooterModal }],
      });
    });
  });

  const socials = Array.from(
    document.querySelectorAll("footer .redes-sociales a.red-social")
  );
  socials.forEach((a, idx) => {
    a.addEventListener("click", async (e) => {
      const href = a.getAttribute("href") || "";
      if (href !== "#") return;

      e.preventDefault();

      const url = encodeURIComponent(location.href);
      const text = encodeURIComponent("Mira esta página de Wanderlust:");

      // 0: X/Twitter share | 1: LinkedIn share | 2: Copiar enlace
      if (idx === 0) {
        window.open(
          `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
          "_blank"
        );
        return;
      }
      if (idx === 1) {
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
          "_blank"
        );
        return;
      }

      const ok = await copyToClipboard(location.href);
      openFooterModal({
        title: ok ? "Enlace copiado" : "No se pudo copiar",
        body: ok
          ? "Se ha copiado la URL al portapapeles para que puedas compartirla."
          : "Tu navegador no permitió copiar automáticamente. Copia la URL manualmente desde la barra de direcciones.",
        actions: [{ label: "Cerrar", onClick: closeFooterModal }],
      });
    });
  });
}

// Inicialización global
document.addEventListener("DOMContentLoaded", () => {
  initFooterInteractions();
});

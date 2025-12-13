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

// Gestión de usuarios y autenticación 
const STORAGE = {
  USER_KEY: "usuarioDatos",
  PASS_KEY: "usuarioPass", 
  EMAIL_KEY: "usuario", 
  USERS_LIST: "usuariosMSF", 
  SESSION: "sesionActiva",
  RETURN_TO: "postLoginReturnTo",
  STORIES: "historiasComunidad",

};

function isFileProtocol() {
  return location.protocol === "file:";
}

// Cookies 
function readCookie(name) {
  const pref = name + "=";
  return (
    document.cookie
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.indexOf(pref) === 0)
      ?.substring(pref.length) || null
  );
}
function writeUserCookie(userObj, days = 30) {
  if (isFileProtocol()) return;
  const val = encodeURIComponent(JSON.stringify(userObj));
  const exp = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `usuarioRegistrado=${val}; expires=${exp}; path=/; SameSite=Lax`;
}
function clearUserCookie() {
  if (isFileProtocol()) return;
  document.cookie = `usuarioRegistrado=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

function getStoredUser() {
  let datos = null;
  const rawLS = localStorage.getItem(STORAGE.USER_KEY);
  if (rawLS) {
    try {
      datos = JSON.parse(rawLS);
    } catch {}
  }
  if (!datos && !isFileProtocol()) {
    const raw = readCookie("usuarioRegistrado");
    if (raw) {
      try {
        datos = JSON.parse(decodeURIComponent(raw));
      } catch {}
    }
  }
  return datos;
}
function isLoggedIn() {
  return sessionStorage.getItem(STORAGE.SESSION) === "1";
}
function startSession({ remember = false, email = "" } = {}) {
  if (remember && email) localStorage.setItem(STORAGE.EMAIL_KEY, email);
  sessionStorage.setItem(STORAGE.SESSION, "1");
}
function endSession() {
  sessionStorage.removeItem(STORAGE.SESSION);
  clearUserCookie(); 
}

function setReturnTo(url) {
  if (!url) return;
  sessionStorage.setItem(STORAGE.RETURN_TO, url);
}

function consumeReturnTo() {
  const url = sessionStorage.getItem(STORAGE.RETURN_TO);
  if (url) sessionStorage.removeItem(STORAGE.RETURN_TO);
  return url;
}

// Intercepta clicks a compra.html?destino=... si NO hay sesión
function protectCompraLinks() {
  const links = Array.from(document.querySelectorAll('a[href]'));

  links.forEach((a) => {
    const href = a.getAttribute("href") || "";
    const esCompraDestino =
      href.startsWith("compra.html") && href.includes("destino=");

    if (!esCompraDestino) return;

    a.addEventListener("click", (e) => {
      if (isLoggedIn()) return;

      e.preventDefault();
      alert("Tienes que iniciar sesión para comprar un pack. Te llevamos al inicio de sesión.");

      setReturnTo(href);
      location.href = "login.html";
    });
  });
}

// Si alguien entra directo a compra.html sin sesión, también lo mandamos a login
function protectCompraPage() {
  const esCompra = !!document.getElementById("formularioReserva"); 
  if (!esCompra) return;

  if (!isLoggedIn()) {
    alert("Tienes que iniciar sesión para reservar este viaje.");
    setReturnTo(location.href);
    location.href = "login.html";
  }
}


// Pintar cabecera según sesión 
function renderHeaderAuth() {
  const box = document.querySelector(".botones-auth");
  if (!box) return;

  const esRegistrado = document.body.classList.contains("pagina-registrado");

  if (isLoggedIn()) {
    const u = getStoredUser() || {};
    const nombre = (u.nombre || "").trim() || "Usuario";

    const texto = esRegistrado ? `Bienvenido ${nombre}` : `Hola, ${nombre}`;

    box.innerHTML = `
      <span class="usuario-saludo" style="margin-right:.5rem">${texto}</span>
      <button id="btn-logout" class="boton boton-secundario">Cerrar sesión</button>
    `;

    document.getElementById("btn-logout")?.addEventListener("click", () => {
      endSession();
      location.href = "index.html";
    });
  } else {
    box.innerHTML = `
      <a href="login.html" class="boton boton-primario">Iniciar sesión</a>
      <a href="registro.html" class="boton boton-secundario">Registrarse</a>
    `;
  }
}


// Registro
function attachRegister() {
  const form = document.querySelector(".registro-form");
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const nombreEl = $("nombre");
  const apellidoEl = $("apellido");
  const emailEl = $("email");
  const passEl = $("password");
  const pass2El = $("confirmar-password");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const nombre = (nombreEl?.value || "").trim();
    const apellido = (apellidoEl?.value || "").trim();
    const email = (emailEl?.value || "").trim();
    const pass = passEl?.value || "";
    const pass2 = pass2El?.value || "";

    if (!nombre || !apellido)
      return alert("Nombre y apellido son obligatorios.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return alert("Email no válido.");
    if (pass.length < 8)
      return alert("La contraseña debe tener al menos 8 caracteres.");
    if (pass !== pass2) return alert("Las contraseñas no coinciden.");

    // Evitar duplicados por email
    const lista = (() => {
      try {
        return JSON.parse(localStorage.getItem(STORAGE.USERS_LIST)) || [];
      } catch {
        return [];
      }
    })();
    if (
      lista.some(
        (u) => String(u.email || "").toLowerCase() === email.toLowerCase()
      )
    ) {
      return alert("Ya existe un usuario registrado con ese email.");
    }

    const user = { nombre, apellido, email };
    localStorage.setItem(STORAGE.USER_KEY, JSON.stringify(user));
    localStorage.setItem(STORAGE.PASS_KEY, pass); 
    localStorage.setItem(STORAGE.EMAIL_KEY, email);

    // histórico para evitar duplicados en el futuro
    lista.push({ ...user, createdAt: Date.now() });
    localStorage.setItem(STORAGE.USERS_LIST, JSON.stringify(lista));

    writeUserCookie(user);
    startSession({ remember: true, email });

    // Redirigimos a home
    writeUserCookie(user);
    startSession({ remember: true, email });

    const volverA = consumeReturnTo();
    location.href = volverA || "index.html";

  });
}

// Login 
function attachLogin() {
  const form = document.querySelector(".login-form"); 
  if (!form) return;

  const emailEl = document.getElementById("email");
  const passEl = document.getElementById("password");
  const recordarEl = document.getElementById("recordar");

  // Autorrellenar email si está guardado
  const lastEmail = localStorage.getItem(STORAGE.EMAIL_KEY);
  if (lastEmail && emailEl) emailEl.value = lastEmail;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = (emailEl?.value || "").trim();
    const pass = passEl?.value || "";
    const recordar = !!recordarEl?.checked;

    const user = getStoredUser();
    if (!user) {
      // Si no hay nadie registrado, le llevamos al registro
      alert("No existe un usuario registrado. Crea una cuenta primero.");
      return (location.href = "registro.html");
    }

    if (email.toLowerCase() !== String(user.email || "").toLowerCase()) {
      return alert("El email no coincide con el registrado.");
    }

    const passGuardada = localStorage.getItem(STORAGE.PASS_KEY);
    if (!passGuardada) {
      alert("No hay contraseña guardada. Regístrate de nuevo.");
      return (location.href = "registro.html");
    }
    if (pass !== passGuardada) {
      return alert("Contraseña incorrecta.");
    }

    startSession({ remember: recordar, email });
    startSession({ remember: recordar, email });

    const volverA = consumeReturnTo();
    location.href = volverA || "index.html";

  });
}

// Protección y pintado para registrado.html
function protectRegistrado() {
  if (!document.body.classList.contains("pagina-registrado")) return;
  if (!isLoggedIn()) location.href = "login.html";
}


function renderRegistrado() {
  if (!document.body.classList.contains("pagina-registrado")) return;
  const u = getStoredUser() || {};
  const nombre = [u.nombre, u.apellido].filter(Boolean).join(" ") || "Usuario";
  const email = u.email || "—";
  const saludo = document.getElementById("saludo-usuario");
  const emailSpan = document.getElementById("email-usuario");
  if (saludo) saludo.textContent = `¡Hola, ${nombre}!`;
  if (emailSpan) emailSpan.textContent = email;
}

function humanizeSlug(slug) {
  return String(slug)
    .trim()
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function applyCompraDestinoFromQuery() {
  const selHasta = document.getElementById("hasta");
  if (!selHasta) return;

  const params = new URLSearchParams(location.search);
  const destino = (params.get("destino") || "").toLowerCase().trim();
  if (!destino) return;

  const existe = Array.from(selHasta.options).some((o) => o.value === destino);
  if (!existe) {
    const opt = document.createElement("option");
    opt.value = destino;
    opt.textContent = humanizeSlug(destino);
    selHasta.appendChild(opt);
  }

  // Preseleccionar destino
  selHasta.value = destino;

  // Mostrar texto "Destino seleccionado: X" debajo del título
  const titulo = document.querySelector(".titulo-principal");
  if (titulo && !document.getElementById("destino-elegido")) {
    const p = document.createElement("p");
    p.id = "destino-elegido";
    p.style.marginTop = "8px";
    p.style.color = "#8a7361";
    p.style.fontWeight = "500";
    p.textContent = `Destino seleccionado: ${humanizeSlug(destino)}`;
    titulo.insertAdjacentElement("afterend", p);
  }
}

function getCommunityStories() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE.STORIES)) || [];
  } catch {
    return [];
  }
}

function saveCommunityStories(list) {
  localStorage.setItem(STORAGE.STORIES, JSON.stringify(list));
}

// Renderiza historias de usuarios DENTRO de "Publicaciones de Blog"
function renderCommunityBlogPosts() {
  const cont = document.getElementById("blog-user-posts");
  if (!cont) return;
  const historias = getCommunityStories().slice().sort((a, b) => b.createdAt - a.createdAt);

  cont.innerHTML = "";

  historias.forEach((h) => {
    const art = document.createElement("article");
    art.className = "articulo-blog";

    const contenido = document.createElement("div");
    contenido.className = "contenido-articulo";

    const titulo = document.createElement("h3");
    titulo.className = "titulo-articulo";
    titulo.textContent = h.titulo;

    const texto = document.createElement("p");
    texto.className = "texto-articulo";
    texto.textContent = h.historia;

    const meta = document.createElement("p");
    meta.style.marginTop = "8px";
    meta.style.color = "#8a7361";
    meta.style.fontSize = "0.95rem";
    meta.textContent = `Por ${h.autor} · ${new Date(h.createdAt).toLocaleDateString()}`;

    contenido.appendChild(titulo);
    contenido.appendChild(texto);
    contenido.appendChild(meta);

    // Imagen opcional (para mantener el layout igual que los posts existentes)
    const imgWrap = document.createElement("div");
    imgWrap.className = "imagen-articulo";
    const img = document.createElement("img");
    img.src = "images/blog-bicicleta.png"; 
    img.alt = "Historia publicada por la comunidad";
    imgWrap.appendChild(img);

    art.appendChild(contenido);
    art.appendChild(imgWrap);

    cont.appendChild(art);
  });
}

function attachCommunityStoryForm() {
  const form = document.querySelector(".formulario-historia");
  if (!form) return; 

  const tituloEl = document.getElementById("titulo");
  const historiaEl = document.getElementById("historia");
  const nombreEl = document.getElementById("nombre");

  // Si está logueado, pre-rellenar el nombre del usuario
  if (isLoggedIn()) {
    const u = getStoredUser() || {};
    const nombre = [u.nombre, u.apellido].filter(Boolean).join(" ").trim();
    if (nombre && nombreEl && !nombreEl.value) nombreEl.value = nombre;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Si no hay sesión: alert + login + volver al formulario
    if (!isLoggedIn()) {
      alert("Para publicar una historia necesitas iniciar sesión.");
      setReturnTo("comunidad.html#enviar-historia");
      location.href = "login.html";
      return;
    }

    const titulo = (tituloEl?.value || "").trim();
    const historia = (historiaEl?.value || "").trim();
    const autor = (nombreEl?.value || "").trim();

    if (!titulo || !historia || !autor) {
      alert("Completa título, historia y nombre antes de enviar.");
      return;
    }

    const historias = getCommunityStories();
    historias.push({
      id: String(Date.now()),
      titulo,
      historia,
      autor,
      createdAt: Date.now(),
    });

    saveCommunityStories(historias);

    if (tituloEl) tituloEl.value = "";
    if (historiaEl) historiaEl.value = "";

    renderCommunityBlogPosts();

    alert("¡Historia publicada! Ya aparece en 'Publicaciones de Blog'.");
    document.getElementById("blog-publicaciones")?.scrollIntoView({ behavior: "smooth" });
  });
}

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
  document.getElementById("footer-modal-close")?.addEventListener("click", closeFooterModal);

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
          actions: [
            { label: "Cerrar", onClick: closeFooterModal },
          ],
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
                location.href = "mailto:contacto@wanderlust.com?subject=Contacto%20Wanderlust";
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
          body:
            "Este sitio es una demo: los datos de usuario se guardan localmente en tu navegador (localStorage/sessionStorage). No se envían a ningún servidor.",
          actions: [{ label: "Entendido", primary: true, onClick: closeFooterModal }],
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

  const socials = Array.from(document.querySelectorAll("footer .redes-sociales a.red-social"));
  socials.forEach((a, idx) => {
    a.addEventListener("click", async (e) => {
      const href = a.getAttribute("href") || "";
      if (href !== "#") return;

      e.preventDefault();

      const url = encodeURIComponent(location.href);
      const text = encodeURIComponent("Mira esta página de Wanderlust:");

      // 0: X/Twitter share | 1: LinkedIn share | 2: Copiar enlace
      if (idx === 0) {
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
        return;
      }
      if (idx === 1) {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank");
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
  attachRegister();
  attachLogin();
  renderHeaderAuth();
  protectRegistrado();
  renderRegistrado();
  applyCompraDestinoFromQuery();
  protectCompraPage();   
  protectCompraLinks();  
  renderCommunityBlogPosts();   
  attachCommunityStoryForm();   
  initFooterInteractions();
});

window.requireAuth = function (redirectTo = "index.html") {
  if (!isLoggedIn()) location.href = redirectTo;
};

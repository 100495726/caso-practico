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
      <div class="usuario-logueado">
        <span class="usuario-saludo">${texto}</span>
        <button id="btn-logout" class="boton boton-secundario">Cerrar sesión</button>
      </div>
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

// Intercepta clicks a compra.html?destino=... si NO hay sesión
function protectCompraLinks() {
  const links = Array.from(document.querySelectorAll("a[href]"));

  links.forEach((a) => {
    const href = a.getAttribute("href") || "";
    const esCompraDestino =
      href.startsWith("compra.html") && href.includes("destino=");

    if (!esCompraDestino) return;

    a.addEventListener("click", (e) => {
      if (isLoggedIn()) return;

      e.preventDefault();
      alert(
        "Tienes que iniciar sesión para comprar un pack. Te llevamos al inicio de sesión."
      );

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
  const historias = getCommunityStories()
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt);

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
    meta.textContent = `Por ${h.autor} · ${new Date(
      h.createdAt
    ).toLocaleDateString()}`;

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
    document
      .getElementById("blog-publicaciones")
      ?.scrollIntoView({ behavior: "smooth" });
  });
}

// Inicialización de autenticación
function initAutenticacion() {
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
}

// Ejecutar al cargar el DOM
document.addEventListener("DOMContentLoaded", initAutenticacion);

// Exportar para uso global
window.requireAuth = function (redirectTo = "index.html") {
  if (!isLoggedIn()) location.href = redirectTo;
};

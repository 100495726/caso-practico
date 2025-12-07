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
const STORAGE = {
  USER_KEY: "usuarioDatos",
  PASS_KEY: "usuarioPass",        // (solo práctica)
  EMAIL_KEY: "usuario",           // último email usado
  USERS_LIST: "usuariosMSF",      // histórico para evitar duplicados
  SESSION: "sesionActiva",
};

function isFileProtocol() {
  return location.protocol === "file:";
}

// --- Cookies ---
function readCookie(name) {
  const pref = name + "=";
  return document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.indexOf(pref) === 0)
    ?.substring(pref.length) || null;
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

// --- User getters ---
function getStoredUser() {
  let datos = null;
  const rawLS = localStorage.getItem(STORAGE.USER_KEY);
  if (rawLS) {
    try { datos = JSON.parse(rawLS); } catch {}
  }
  if (!datos && !isFileProtocol()) {
    const raw = readCookie("usuarioRegistrado");
    if (raw) { try { datos = JSON.parse(decodeURIComponent(raw)); } catch {} }
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
  clearUserCookie(); // sigue la conducta del proyecto anterior
}

// --- Pintar cabecera según sesión ---
function renderHeaderAuth() {
  const box = document.querySelector(".botones-auth");
  if (!box) return;

  if (isLoggedIn()) {
    const u = getStoredUser() || {};
    const nombre = [u.nombre, u.apellido].filter(Boolean).join(" ") || "Usuario";
    box.innerHTML = `
      <span class="usuario-saludo" style="margin-right:.5rem">Hola, ${nombre}</span>
      <button id="btn-logout" class="boton boton-secundario">Cerrar sesión</button>
    `;
    document.getElementById("btn-logout")?.addEventListener("click", () => {
      endSession();
      // tras cerrar sesión volvemos a la home
      location.href = "index.html";
    });
  } else {
    // Mostrar botones por defecto (LOGIN / REGISTRO)
    box.innerHTML = `
      <a href="login.html" class="boton boton-primario">Iniciar sesión</a>
      <a href="registro.html" class="boton boton-secundario">Registrarse</a>
    `;
  }
}

// --- Registro ---
function attachRegister() {
  const form = document.querySelector(".registro-form"); // existe en registro.html
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

    // Validaciones mínimas (alineadas con la práctica)
    if (!nombre || !apellido) return alert("Nombre y apellido son obligatorios.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return alert("Email no válido.");
    if (pass.length < 8) return alert("La contraseña debe tener al menos 8 caracteres.");
    if (pass !== pass2) return alert("Las contraseñas no coinciden.");

    // Evitar duplicados por email (como en el proyecto anterior)
    const lista = (() => { try { return JSON.parse(localStorage.getItem(STORAGE.USERS_LIST)) || []; } catch { return []; }})();
    if (lista.some(u => String(u.email || "").toLowerCase() === email.toLowerCase())) {
      return alert("Ya existe un usuario registrado con ese email.");
    }

    const user = { nombre, apellido, email };
    localStorage.setItem(STORAGE.USER_KEY, JSON.stringify(user));
    localStorage.setItem(STORAGE.PASS_KEY, pass); // texto plano, SOLO para la práctica
    localStorage.setItem(STORAGE.EMAIL_KEY, email);

    // histórico para evitar duplicados en el futuro
    lista.push({ ...user, createdAt: Date.now() });
    localStorage.setItem(STORAGE.USERS_LIST, JSON.stringify(lista));

    writeUserCookie(user);
    startSession({ remember: true, email });

    // Redirigimos a la home
    location.href = "index.html";
  });
}

// --- Login ---
function attachLogin() {
  const form = document.querySelector(".login-form"); // existe en login.html
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
      // Si no hay nadie registrado, llévale al registro
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
    location.href = "index.html";
  });
}


// --- Protección y pintado para registrado.html ---
function protectRegistrado() {
  if (!document.body.classList.contains("pagina-registrado")) return;
  if (!isLoggedIn()) location.href = "index.html"; // guard de ruta
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



// --- Inicialización global ---
document.addEventListener("DOMContentLoaded", () => {
  attachRegister();
  attachLogin();
  renderHeaderAuth();
  protectRegistrado();
  renderRegistrado();
});

// --- (Opcional) Guard para páginas privadas, por si creas una sección protegida ---
// Reemplaza lo que tienes por ESTO:
window.requireAuth = function (redirectTo = "index.html") {
  if (!isLoggedIn()) location.href = redirectTo;
};



/*
  Presença ao vivo — cursores de visitantes reais via PartyKit.
  Módulo autossuficiente: cria o próprio canvas de overlay e se conecta
  ao servidor PartyKit. Se falhar (sem rede / esm.sh indisponível), o resto
  do site não é afetado — apenas os cursores ao vivo não aparecem.

  Não depende do script.js e não o modifica.
*/
import PartySocket from "https://esm.sh/partysocket@1.3.0";

/* ===== CONFIG ===========================================================
   Após rodar `npx wrangler deploy`, o terminal mostra um host tipo
   "mansano-presence.SEU_SUBDOMINIO.workers.dev". Cole esse valor aqui.
   Em desenvolvimento (localhost) ele usa localhost:8787 automaticamente.
========================================================================== */
const PROD_HOST = "mansano-presence.rodriguesmath53.workers.dev";
const LOCAL_HOST = "localhost:8787";

const ROOM = "home"; // todos no mesmo room se veem

const SEND_INTERVAL = 45;   // ms mínimo entre envios (throttle)
const STALE_FADE = 5000;    // cursor para de ser atualizado -> começa a sumir
const STALE_DROP = 8000;     // removido totalmente após isso

/* Condições iguais às dos agentes (só desktop com mouse, sem reduced-motion) */
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

if (window.innerWidth >= 768 && finePointer && !reducedMotion) {
  startPresence();
}

/* ----- helpers de desenho (mesma estética dos agentes do script.js) ----- */
const RGB_CACHE = new Map();
function hexToRgb(hex) {
  if (RGB_CACHE.has(hex)) return RGB_CACHE.get(hex);
  const n = parseInt(hex.replace("#", ""), 16);
  const rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  RGB_CACHE.set(hex, rgb);
  return rgb;
}

function flag(cc) {
  if (!cc || cc.length !== 2) return "";
  return cc
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawRemoteCursor(ctx, x, y, label, rgb, alpha) {
  const [r, g, b] = rgb;
  ctx.save();

  // seta (igual ao cursor do script.js)
  ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
  ctx.strokeStyle = `rgba(0,0,0,${alpha * 0.6})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + 14);
  ctx.lineTo(x + 3, y + 11);
  ctx.lineTo(x + 5, y + 16);
  ctx.lineTo(x + 6.5, y + 15.5);
  ctx.lineTo(x + 4.5, y + 10.5);
  ctx.lineTo(x + 8, y + 10.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // rótulo com nome + bandeira
  if (alpha > 0.06) {
    ctx.font = "600 11px Inter, system-ui, sans-serif";
    const tw = ctx.measureText(label).width;
    const padX = 7;
    const w = tw + padX * 2;
    const h = 17;
    const lx = x + 12;
    const ly = y + 14;

    ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
    roundRect(ctx, lx, ly, w, h, 5);
    ctx.fill();

    ctx.fillStyle = `rgba(6,6,8,${alpha})`;
    ctx.textBaseline = "middle";
    ctx.fillText(label, lx + padX, ly + h / 2 + 0.5);
  }

  ctx.restore();
}

/* ------------------------------- principal ------------------------------- */
function startPresence() {
  const isLocal =
    location.hostname === "localhost" || location.hostname === "127.0.0.1";
  const host = isLocal ? LOCAL_HOST : PROD_HOST;

  // overlay canvas
  const canvas = document.createElement("canvas");
  canvas.id = "presence-canvas";
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100vw",
    height: "100vh",
    pointerEvents: "none",
    zIndex: "9998",
  });
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W = window.innerWidth;
  let H = window.innerHeight;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize, { passive: true });

  const remote = new Map(); // id -> { tx, ty, dx, dy, lastSeen, label, color }

  // cursor do próprio visitante — desenhado igual aos remotos
  const me = {
    tx: -999, ty: -999, // fora da tela até o mouse mover
    dx: -999, dy: -999,
    label: "",
    color: "#ffffff",
    visible: false,
  };

  let socket = null;
  let myId = null;
  let lastSent = 0;
  let lastX = -1;
  let lastY = -1;

  function send(x, y, force) {
    if (!socket || socket.readyState !== 1) return; // 1 = OPEN
    if (!force && Date.now() - lastSent < SEND_INTERVAL) return;
    lastSent = Date.now();
    socket.send(JSON.stringify({ type: "cursor", x, y }));
  }

  try {
    socket = new PartySocket({ host, room: ROOM });
  } catch (e) {
    console.warn("[presence] não conectou:", e);
    return;
  }

  socket.addEventListener("message", (e) => {
    let m;
    try {
      m = JSON.parse(e.data);
    } catch {
      return;
    }

    if (m.type === "hello") {
      myId = m.id;
      // popula o cursor local com o nome/cor atribuídos pelo servidor
      me.color = m.color;
      me.label = (m.country ? flag(m.country) + " " : "") + m.name;
      me.visible = true;
      // posição inicial no centro até o mouse mover
      if (lastX < 0) { me.tx = Math.round(W / 2); me.ty = Math.round(H / 2); }
      send(lastX >= 0 ? lastX : Math.round(W / 2), lastY >= 0 ? lastY : Math.round(H / 2), true);

      // mostra o nome do animal no cursor existente do script.js
      const cursorEl = document.getElementById("cursor");
      const labelEl  = document.getElementById("cursor-label");
      if (cursorEl && labelEl) {
        labelEl.textContent = m.name;
        cursorEl.classList.add("has-animal");
      }
    } else if (m.type === "cursor") {
      if (m.id === myId) return; // ignora eco do próprio
      const label = (m.country ? flag(m.country) + " " : "") + m.name;
      const existing = remote.get(m.id);
      if (!existing) {
        remote.set(m.id, {
          tx: m.x, ty: m.y,
          dx: m.x, dy: m.y,
          lastSeen: Date.now(),
          label, color: m.color,
        });
      } else {
        existing.tx = m.x;
        existing.ty = m.y;
        existing.lastSeen = Date.now();
        existing.label = label;
        existing.color = m.color;
      }
    } else if (m.type === "leave") {
      remote.delete(m.id);
    }
  });

  // envia a posição do mouse (throttled) e atualiza o cursor local
  window.addEventListener(
    "mousemove",
    (e) => {
      lastX = e.clientX;
      lastY = e.clientY;
      me.tx = e.clientX;
      me.ty = e.clientY;
      send(e.clientX, e.clientY);
    },
    { passive: true }
  );

  // keepalive: mesmo parado, avisa que continua on-line a cada 3s
  setInterval(() => {
    if (document.hidden) return;
    if (lastX >= 0) send(lastX, lastY, true);
  }, 3000);

  // loop de desenho
  function frame() {
    ctx.clearRect(0, 0, W, H);
    const now = Date.now();

    // cursores remotos
    for (const c of Array.from(remote.values())) {
      c.dx += (c.tx - c.dx) * 0.32;
      c.dy += (c.ty - c.dy) * 0.32;

      const age = now - c.lastSeen;
      let alpha = 1;
      if (age > STALE_FADE) {
        alpha = Math.max(0, 1 - (age - STALE_FADE) / (STALE_DROP - STALE_FADE));
      }
      if (age > STALE_DROP) { remote.delete(c.id); continue; }
      if (alpha <= 0.02) continue;

      drawRemoteCursor(ctx, c.dx, c.dy, c.label, hexToRgb(c.color), alpha);
    }

    // cursor do próprio visitante (só depois de receber o hello e mover o mouse)
    if (me.visible && lastX >= 0) {
      me.dx += (me.tx - me.dx) * 0.32;
      me.dy += (me.ty - me.dy) * 0.32;
      drawRemoteCursor(ctx, me.dx, me.dy, me.label, hexToRgb(me.color), 1);
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

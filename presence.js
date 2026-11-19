/*
  presence.js — cursores ao vivo, chat flutuante, explosões e placar.
  Autossuficiente: não modifica script.js. Se falhar, o site continua intacto.
*/
import PartySocket from "https://esm.sh/partysocket@1.3.0";

/* ── CONFIG ─────────────────────────────────────────────────────────────── */
const PROD_HOST  = "mansano-presence.rodriguesmath53.workers.dev";
const LOCAL_HOST = "localhost:8787";
const ROOM       = "home";

const SEND_INTERVAL = 45;    // ms mínimo entre envios de cursor
const STALE_FADE    = 5000;  // ms até cursor remoto começar a sumir
const STALE_DROP    = 8000;  // ms até cursor remoto ser removido
const CHAT_TTL      = 3000;  // ms que a bolha de texto fica visível
const DBL_CLICK_MS  = 400;   // janela para detectar double-click

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer   = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

if (window.innerWidth >= 768 && finePointer && !reducedMotion) startPresence();

/* ── HELPERS DE DESENHO ─────────────────────────────────────────────────── */
const RGB_CACHE = new Map();
function hexToRgb(hex) {
  if (RGB_CACHE.has(hex)) return RGB_CACHE.get(hex);
  const n = parseInt(hex.replace("#", ""), 16);
  const v = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  RGB_CACHE.set(hex, v);
  return v;
}

function flag(cc) {
  if (!cc || cc.length !== 2) return "";
  return cc.toUpperCase().replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) { ctx.roundRect(x, y, w, h, r); return; }
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* Desenha a seta + label de nome */
function drawCursor(ctx, x, y, label, rgb, alpha) {
  const [r, g, b] = rgb;
  ctx.save();

  // seta
  ctx.fillStyle   = `rgba(${r},${g},${b},${alpha})`;
  ctx.strokeStyle = `rgba(0,0,0,${alpha * 0.55})`;
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(x,      y);
  ctx.lineTo(x,      y + 14);
  ctx.lineTo(x + 3,  y + 11);
  ctx.lineTo(x + 5,  y + 16);
  ctx.lineTo(x + 6.5,y + 15.5);
  ctx.lineTo(x + 4.5,y + 10.5);
  ctx.lineTo(x + 8,  y + 10.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // pill de nome
  if (alpha > 0.06 && label) {
    ctx.font = "600 11px Inter, system-ui, sans-serif";
    const tw   = ctx.measureText(label).width;
    const padX = 7, pw = tw + padX * 2, ph = 17;
    const lx   = x + 12, ly = y + 14;
    ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
    roundRect(ctx, lx, ly, pw, ph, 5);
    ctx.fill();
    ctx.fillStyle    = `rgba(6,6,8,${alpha})`;
    ctx.textBaseline = "middle";
    ctx.fillText(label, lx + padX, ly + ph / 2 + 0.5);
  }

  ctx.restore();
}

/* Bolha de chat estilo Figma acima do cursor */
function drawChatBubble(ctx, x, y, text, rgb, alpha) {
  const [r, g, b] = rgb;
  ctx.save();
  ctx.font = "500 12px Inter, system-ui, sans-serif";
  const tw   = ctx.measureText(text).width;
  const padX = 10, padY = 7;
  const bw   = tw + padX * 2;
  const bh   = 28;
  const bx   = x + 4;
  const by   = y - bh - 10;

  // sombra
  ctx.shadowColor   = `rgba(0,0,0,${0.18 * alpha})`;
  ctx.shadowBlur    = 8;
  ctx.shadowOffsetY = 2;

  // fundo
  ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
  roundRect(ctx, bx, by, bw, bh, 8);
  ctx.fill();

  // pequeno triângulo apontando pra baixo
  ctx.beginPath();
  ctx.moveTo(bx + 12,       by + bh);
  ctx.lineTo(bx + 20,       by + bh);
  ctx.lineTo(bx + 16,       by + bh + 7);
  ctx.closePath();
  ctx.fill();

  ctx.shadowColor = "transparent";

  // texto
  ctx.fillStyle    = `rgba(255,255,255,${alpha})`;
  ctx.textBaseline = "middle";
  ctx.fillText(text, bx + padX, by + bh / 2 + 0.5);

  ctx.restore();
}

/* Partículas de explosão */
function createExplosion(x, y, rgb, particles) {
  const COUNT = 18;
  for (let i = 0; i < COUNT; i++) {
    const angle = (Math.PI * 2 * i) / COUNT + Math.random() * 0.4;
    const speed = 3 + Math.random() * 5;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: 0.025 + Math.random() * 0.02,
      r: 2 + Math.random() * 3,
      rgb,
    });
  }
}

function updateAndDrawParticles(ctx, particles) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x  += p.vx;
    p.y  += p.vy;
    p.vy += 0.18; // gravidade leve
    p.vx *= 0.94;
    p.life -= p.decay;
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    const [r, g, b] = p.rgb;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r},${g},${b},${p.life})`;
    ctx.fill();
  }
}

/* ── PLACAR (DOM) ────────────────────────────────────────────────────────── */
function createScoreboard() {
  const el = document.createElement("div");
  el.id = "presence-scoreboard";
  Object.assign(el.style, {
    position:     "fixed",
    bottom:       "24px",
    right:        "24px",
    zIndex:       "9997",
    background:   "rgba(6,6,8,0.78)",
    backdropFilter: "blur(12px)",
    border:       "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    padding:      "12px 16px",
    minWidth:     "170px",
    fontFamily:   "Inter, system-ui, sans-serif",
    fontSize:     "12px",
    color:        "#fff",
    pointerEvents:"none",
    userSelect:   "none",
  });
  el.innerHTML = `<div style="font-weight:700;letter-spacing:.06em;opacity:.45;margin-bottom:8px;font-size:10px">PLACAR 💥</div><div id="presence-scores"></div>`;
  document.body.appendChild(el);
  return el;
}

function updateScoreboard(scores, myId) {
  const el = document.getElementById("presence-scores");
  if (!el) return;
  const sorted = [...scores].sort((a, b) => b.score - a.score).slice(0, 8);
  el.innerHTML = sorted.map((s, i) => {
    const isMe = s.id === myId;
    const medal = i === 0 && s.score > 0 ? "🥇 " : i === 1 && s.score > 0 ? "🥈 " : i === 2 && s.score > 0 ? "🥉 " : "";
    return `<div style="display:flex;justify-content:space-between;gap:16px;padding:2px 0;opacity:${isMe ? 1 : 0.7}">
      <span style="color:${s.color};font-weight:${isMe ? 700 : 500}">${medal}${s.name}${isMe ? " (você)" : ""}</span>
      <span style="font-weight:700">${s.score}</span>
    </div>`;
  }).join("") || `<div style="opacity:.4">Ninguém ainda</div>`;
}

/* ── INPUT DE CHAT (DOM) ────────────────────────────────────────────────── */
function createChatInput(onSend) {
  const wrap = document.createElement("div");
  wrap.id = "presence-chat-wrap";
  Object.assign(wrap.style, {
    position:     "fixed",
    bottom:       "80px",
    left:         "50%",
    transform:    "translateX(-50%)",
    zIndex:       "10000",
    display:      "none",
    alignItems:   "center",
    gap:          "8px",
    background:   "rgba(6,6,8,0.85)",
    backdropFilter: "blur(16px)",
    border:       "1px solid rgba(255,255,255,0.12)",
    borderRadius: "12px",
    padding:      "10px 14px",
    boxShadow:    "0 8px 32px rgba(0,0,0,0.4)",
    fontFamily:   "Inter, system-ui, sans-serif",
  });

  const hint = document.createElement("span");
  hint.textContent = "💬";
  hint.style.fontSize = "16px";

  const input = document.createElement("input");
  input.placeholder = "Diga algo... (Enter para enviar)";
  Object.assign(input.style, {
    background:  "transparent",
    border:      "none",
    outline:     "none",
    color:       "#fff",
    fontSize:    "13px",
    width:       "260px",
    fontFamily:  "inherit",
    cursor:      "text",
  });

  const esc = document.createElement("span");
  esc.textContent = "Esc";
  Object.assign(esc.style, {
    fontSize:    "10px",
    opacity:     ".4",
    padding:     "2px 6px",
    border:      "1px solid rgba(255,255,255,0.2)",
    borderRadius:"4px",
    cursor:      "pointer",
  });

  wrap.appendChild(hint);
  wrap.appendChild(input);
  wrap.appendChild(esc);
  document.body.appendChild(wrap);

  function open() {
    wrap.style.display = "flex";
    input.value = "";
    input.focus();
  }
  function close() {
    wrap.style.display = "none";
    input.blur();
  }

  input.addEventListener("keydown", e => {
    e.stopPropagation();
    if (e.key === "Enter") {
      const txt = input.value.trim();
      if (txt) onSend(txt);
      close();
    }
    if (e.key === "Escape") close();
  });
  esc.addEventListener("click", close);

  // abre com T ou / quando o input não está focado
  window.addEventListener("keydown", e => {
    if (wrap.style.display === "flex") return;
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (e.key === "t" || e.key === "T" || e.key === "/") {
      e.preventDefault();
      open();
    }
  });

  return { open, close };
}

/* ── PRINCIPAL ───────────────────────────────────────────────────────────── */
function startPresence() {
  const isLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1";
  const host    = isLocal ? LOCAL_HOST : PROD_HOST;

  /* canvas overlay */
  const canvas = document.createElement("canvas");
  canvas.id = "presence-canvas";
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position:      "fixed",
    top:           "0", left: "0",
    width:         "100vw", height: "100vh",
    pointerEvents: "none",
    zIndex:        "9998",
  });
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W = window.innerWidth, H = window.innerHeight;

  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width  = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width  = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize, { passive: true });

  /* estado */
  const remote     = new Map();   // id → cursor remoto
  const chatBubbles = [];         // { id, text, rgb, born }
  const particles  = [];          // partículas de explosão
  let myId         = null;
  let lastSent     = 0;
  let lastX        = -1, lastY = -1;
  const me = { tx: -999, ty: -999, dx: -999, dy: -999, label: "", color: "#fff", visible: false };

  // double-click detection por cursor remoto
  const clickTimes = new Map(); // id → timestamp do último click

  /* placar */
  createScoreboard();

  /* socket */
  let socket;
  try { socket = new PartySocket({ host, room: ROOM }); }
  catch (e) { console.warn("[presence]", e); return; }

  function sendCursor(x, y, force) {
    if (!socket || socket.readyState !== 1) return;
    if (!force && Date.now() - lastSent < SEND_INTERVAL) return;
    lastSent = Date.now();
    socket.send(JSON.stringify({ type: "cursor", x, y }));
  }

  function sendChat(text) {
    if (!socket || socket.readyState !== 1) return;
    socket.send(JSON.stringify({ type: "chat", text }));
  }

  function sendExplode(targetId) {
    if (!socket || socket.readyState !== 1) return;
    socket.send(JSON.stringify({ type: "explode", targetId }));
  }

  /* chat input */
  createChatInput(sendChat);

  /* recepção de mensagens */
  socket.addEventListener("message", e => {
    let m; try { m = JSON.parse(e.data); } catch { return; }

    if (m.type === "hello") {
      myId = m.id;
      me.color   = m.color;
      me.label   = (m.country ? flag(m.country) + " " : "") + m.name;
      me.visible = true;
      if (lastX < 0) { me.tx = W / 2; me.ty = H / 2; }
      sendCursor(lastX >= 0 ? lastX : W / 2, lastY >= 0 ? lastY : H / 2, true);

    } else if (m.type === "cursor") {
      if (m.id === myId) return;
      const label = (m.country ? flag(m.country) + " " : "") + m.name;
      const c = remote.get(m.id);
      if (!c) {
        remote.set(m.id, { tx: m.x, ty: m.y, dx: m.x, dy: m.y, lastSeen: Date.now(), label, color: m.color });
      } else {
        c.tx = m.x; c.ty = m.y; c.lastSeen = Date.now(); c.label = label; c.color = m.color;
      }

    } else if (m.type === "chat") {
      // insere bolha (inclui a própria mensagem que o servidor rebate)
      chatBubbles.push({ id: m.id, text: m.text, rgb: hexToRgb(m.color), born: Date.now() });

    } else if (m.type === "explode") {
      // explosão no cursor da vítima
      const victim = m.id === myId ? me : remote.get(m.id);
      if (victim) {
        const rgb = hexToRgb(victim.color || "#fff");
        createExplosion(victim.dx, victim.dy, rgb, particles);
      }
      // se eu fui explodido, mostra notificação rápida
      if (m.id === myId) {
        chatBubbles.push({
          id: myId,
          text: `💥 ${m.killerName} te explodiu!`,
          rgb: hexToRgb("#ef4444"),
          born: Date.now(),
        });
      }
      // remove cursor da vítima por 2s (re-aparece quando mandar cursor de novo)
      if (m.id !== myId) remote.delete(m.id);

    } else if (m.type === "score") {
      updateScoreboard(m.scores, myId);

    } else if (m.type === "leave") {
      remote.delete(m.id);
    }
  });

  /* mouse */
  window.addEventListener("mousemove", e => {
    lastX = e.clientX; lastY = e.clientY;
    me.tx = e.clientX; me.ty = e.clientY;
    sendCursor(e.clientX, e.clientY);
  }, { passive: true });

  /* double-click para explodir cursor remoto mais próximo */
  window.addEventListener("click", e => {
    const id = _nearestRemote(e.clientX, e.clientY, 60);
    if (!id) return;
    const now = Date.now();
    const last = clickTimes.get(id) ?? 0;
    if (now - last < DBL_CLICK_MS) {
      sendExplode(id);
      clickTimes.delete(id);
    } else {
      clickTimes.set(id, now);
    }
  });

  function _nearestRemote(mx, my, maxDist) {
    let best = null, bestD = maxDist;
    for (const [id, c] of remote) {
      const d = Math.hypot(c.dx - mx, c.dy - my);
      if (d < bestD) { bestD = d; best = id; }
    }
    return best;
  }

  /* keepalive */
  setInterval(() => {
    if (document.hidden || lastX < 0) return;
    sendCursor(lastX, lastY, true);
  }, 3000);

  /* ── LOOP DE RENDER ─────────────────────────────────────────────────── */
  function frame() {
    ctx.clearRect(0, 0, W, H);
    const now = Date.now();

    // partículas de explosão
    updateAndDrawParticles(ctx, particles);

    // bolhas de chat
    for (let i = chatBubbles.length - 1; i >= 0; i--) {
      const b   = chatBubbles[i];
      const age = now - b.born;
      if (age > CHAT_TTL) { chatBubbles.splice(i, 1); continue; }

      // posição: segue o cursor do dono
      let cx, cy;
      if (b.id === myId) { cx = me.dx; cy = me.dy; }
      else {
        const c = remote.get(b.id);
        if (!c) continue;
        cx = c.dx; cy = c.dy;
      }

      // fade nos últimos 600ms
      const fadeStart = CHAT_TTL - 600;
      const alpha = age > fadeStart ? 1 - (age - fadeStart) / 600 : 1;
      // flutua levemente pra cima com o tempo
      const floatY = -(age / CHAT_TTL) * 14;

      drawChatBubble(ctx, cx, cy + floatY, b.text, b.rgb, alpha);
    }

    // cursores remotos
    for (const c of remote.values()) {
      c.dx += (c.tx - c.dx) * 0.32;
      c.dy += (c.ty - c.dy) * 0.32;

      const age = now - c.lastSeen;
      if (age > STALE_DROP) { remote.delete(c.id); continue; }
      const alpha = age > STALE_FADE ? Math.max(0, 1 - (age - STALE_FADE) / (STALE_DROP - STALE_FADE)) : 1;
      if (alpha <= 0.02) continue;

      drawCursor(ctx, c.dx, c.dy, c.label, hexToRgb(c.color), alpha);
    }

    // cursor próprio
    if (me.visible && lastX >= 0) {
      me.dx += (me.tx - me.dx) * 0.32;
      me.dy += (me.ty - me.dy) * 0.32;
      drawCursor(ctx, me.dx, me.dy, me.label, hexToRgb(me.color), 1);
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

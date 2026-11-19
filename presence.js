/*
  presence.js — cursores ao vivo, chat no cursor, explosões e placar.
*/
import PartySocket from "https://esm.sh/partysocket@1.3.0";

/* ── CONFIG ─────────────────────────────────────────────────────────────── */
const PROD_HOST  = "mansano-presence.rodriguesmath53.workers.dev";
const LOCAL_HOST = "localhost:8787";
const ROOM       = "home";

const SEND_INTERVAL = 45;
const STALE_FADE    = 5000;
const STALE_DROP    = 8000;
const CHAT_TTL      = 3000;
const DBL_CLICK_MS  = 400;

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer   = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

if (window.innerWidth >= 768 && finePointer && !reducedMotion) startPresence();

/* ── HELPERS DE COR ─────────────────────────────────────────────────────── */
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

/* ── HELPERS DE CANVAS ──────────────────────────────────────────────────── */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) { ctx.roundRect(x, y, w, h, r); return; }
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.arcTo(x,     y,     x + w, y,     r);
  ctx.closePath();
}

/* Seta do cursor + pill de nome */
function drawCursor(ctx, x, y, label, rgb, alpha) {
  const [r, g, b] = rgb;
  ctx.save();

  ctx.fillStyle   = `rgba(${r},${g},${b},${alpha})`;
  ctx.strokeStyle = `rgba(0,0,0,${alpha * 0.55})`;
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(x,       y);
  ctx.lineTo(x,       y + 14);
  ctx.lineTo(x + 3,   y + 11);
  ctx.lineTo(x + 5,   y + 16);
  ctx.lineTo(x + 6.5, y + 15.5);
  ctx.lineTo(x + 4.5, y + 10.5);
  ctx.lineTo(x + 8,   y + 10.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  if (alpha > 0.06 && label) {
    ctx.font = "600 11px Inter, system-ui, sans-serif";
    const tw = ctx.measureText(label).width;
    const padX = 7, pw = tw + padX * 2, ph = 17;
    const lx = x + 12, ly = y + 14;
    ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
    roundRect(ctx, lx, ly, pw, ph, 5);
    ctx.fill();
    ctx.fillStyle    = `rgba(6,6,8,${alpha})`;
    ctx.textBaseline = "middle";
    ctx.fillText(label, lx + padX, ly + ph / 2 + 0.5);
  }

  ctx.restore();
}

/*
  Balão de chat — aparece acima do cursor.
  isTyping = true  → balão branco com cursor piscando (rascunho local)
  isTyping = false → balão enviado, fade out controlado por alpha
*/
function drawBubble(ctx, x, y, text, rgb, alpha, isTyping) {
  ctx.save();

  const FONT    = "500 13px Inter, system-ui, sans-serif";
  const PAD_X   = 12, PAD_Y = 8;
  const MAX_W   = 240;
  const R       = 10;
  const TAIL    = 8;   // altura do triângulo de cauda

  ctx.font = FONT;

  // quebra o texto se muito longo (só pra display)
  const display = text.length > 60 ? text.slice(0, 57) + "…" : text;
  const tw   = Math.min(ctx.measureText(display).width, MAX_W);
  const bw   = tw + PAD_X * 2 + (isTyping ? 14 : 0); // espaço pro cursor piscante
  const bh   = 20 + PAD_Y * 2;

  // posiciona acima e à direita da ponta da seta
  const bx = x + 4;
  const by = y - bh - TAIL - 8;

  /* sombra */
  ctx.shadowColor   = `rgba(0,0,0,${0.22 * alpha})`;
  ctx.shadowBlur    = 10;
  ctx.shadowOffsetY = 3;

  if (isTyping) {
    /* balão branco com borda colorida da cor do cursor */
    const [r, g, b] = rgb;
    ctx.fillStyle   = `rgba(255,255,255,${alpha})`;
    roundRect(ctx, bx, by, bw, bh, R);
    ctx.fill();

    ctx.shadowColor = "transparent";

    // borda colorida fina
    ctx.strokeStyle = `rgba(${r},${g},${b},${alpha * 0.6})`;
    ctx.lineWidth   = 1.5;
    roundRect(ctx, bx, by, bw, bh, R);
    ctx.stroke();

    // cauda
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath();
    ctx.moveTo(bx + 16,       by + bh);
    ctx.lineTo(bx + 16 + TAIL, by + bh + TAIL);
    ctx.lineTo(bx + 16 + TAIL * 2, by + bh);
    ctx.closePath();
    ctx.fill();
    // borda da cauda
    ctx.strokeStyle = `rgba(${r},${g},${b},${alpha * 0.4})`;
    ctx.lineWidth   = 1;
    ctx.stroke();

    // texto escuro
    ctx.fillStyle    = `rgba(10,10,15,${alpha})`;
    ctx.textBaseline = "middle";
    ctx.fillText(display, bx + PAD_X, by + bh / 2 + 0.5);

    // cursor piscante (pisca a cada 530ms)
    const blink = Math.floor(Date.now() / 530) % 2 === 0;
    if (blink) {
      const cx = bx + PAD_X + ctx.measureText(display).width + 3;
      const cy = by + PAD_Y + 2;
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fillRect(cx, cy, 1.5, bh - PAD_Y * 2 - 2);
    }

  } else {
    /* balão enviado — cor sólida do dono */
    const [r, g, b] = rgb;
    ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
    roundRect(ctx, bx, by, bw, bh, R);
    ctx.fill();

    ctx.shadowColor = "transparent";

    // cauda
    ctx.beginPath();
    ctx.moveTo(bx + 16,            by + bh);
    ctx.lineTo(bx + 16 + TAIL,     by + bh + TAIL);
    ctx.lineTo(bx + 16 + TAIL * 2, by + bh);
    ctx.closePath();
    ctx.fill();

    // texto branco
    ctx.fillStyle    = `rgba(255,255,255,${alpha})`;
    ctx.textBaseline = "middle";
    ctx.fillText(display, bx + PAD_X, by + bh / 2 + 0.5);
  }

  ctx.restore();
}

/* Partículas de explosão */
function createExplosion(x, y, rgb, particles) {
  for (let i = 0; i < 20; i++) {
    const angle = (Math.PI * 2 * i) / 20 + Math.random() * 0.3;
    const speed = 3 + Math.random() * 6;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      life: 1,
      decay: 0.022 + Math.random() * 0.02,
      r: 2 + Math.random() * 3,
      rgb,
    });
  }
}

function tickParticles(ctx, particles) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx; p.y += p.vy;
    p.vy += 0.2; p.vx *= 0.93;
    p.life -= p.decay;
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    const [r, g, b] = p.rgb;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r},${g},${b},${p.life})`;
    ctx.fill();
  }
}

/* ── PLACAR ─────────────────────────────────────────────────────────────── */
function createScoreboard() {
  const el = document.createElement("div");
  el.id = "presence-scoreboard";
  Object.assign(el.style, {
    position:       "fixed",
    bottom:         "24px",
    right:          "24px",
    zIndex:         "9997",
    background:     "rgba(6,6,8,0.78)",
    backdropFilter: "blur(12px)",
    border:         "1px solid rgba(255,255,255,0.08)",
    borderRadius:   "12px",
    padding:        "12px 16px",
    minWidth:       "180px",
    fontFamily:     "Inter, system-ui, sans-serif",
    fontSize:       "12px",
    color:          "#fff",
    pointerEvents:  "none",
    userSelect:     "none",
  });
  el.innerHTML = `<div style="font-weight:700;letter-spacing:.06em;opacity:.45;margin-bottom:8px;font-size:10px">PLACAR 💥</div><div id="presence-scores"></div>`;
  document.body.appendChild(el);
}

function updateScoreboard(scores, myId) {
  const el = document.getElementById("presence-scores");
  if (!el) return;
  const sorted = [...scores].sort((a, b) => b.score - a.score).slice(0, 8);
  el.innerHTML = sorted.map((s, i) => {
    const isMe  = s.id === myId;
    const medal = i === 0 && s.score > 0 ? "🥇 " : i === 1 && s.score > 0 ? "🥈 " : i === 2 && s.score > 0 ? "🥉 " : "";
    return `<div style="display:flex;justify-content:space-between;gap:16px;padding:2px 0;opacity:${isMe ? 1 : 0.7}">
      <span style="color:${s.color};font-weight:${isMe ? 700 : 500}">${medal}${s.name}${isMe ? " (você)" : ""}</span>
      <span style="font-weight:700">${s.score}</span>
    </div>`;
  }).join("") || `<div style="opacity:.4">Ninguém ainda</div>`;
}

/* ── DICA DE ATALHOS (canto inf. esq.) ─────────────────────────────────── */
function createHint() {
  const el = document.createElement("div");
  el.id = "presence-hint";
  Object.assign(el.style, {
    position:      "fixed",
    bottom:        "24px",
    left:          "24px",
    zIndex:        "9997",
    fontFamily:    "Inter, system-ui, sans-serif",
    fontSize:      "11px",
    color:         "rgba(255,255,255,0.3)",
    pointerEvents: "none",
    userSelect:    "none",
    lineHeight:    "1.6",
  });
  el.innerHTML = `<kbd style="background:rgba(255,255,255,0.08);padding:1px 5px;border-radius:4px">T</kbd> chat &nbsp;·&nbsp; <kbd style="background:rgba(255,255,255,0.08);padding:1px 5px;border-radius:4px">2×</kbd> explodir`;
  document.body.appendChild(el);
}

/* ── PRINCIPAL ───────────────────────────────────────────────────────────── */
function startPresence() {
  const isLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1";
  const host    = isLocal ? LOCAL_HOST : PROD_HOST;

  /* canvas overlay — pointer-events: none pra não bloquear cliques no site */
  const canvas = document.createElement("canvas");
  canvas.id = "presence-canvas";
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position:      "fixed",
    top: "0", left: "0",
    width: "100vw", height: "100vh",
    pointerEvents: "none",
    zIndex:        "9998",
  });
  document.body.appendChild(canvas);

  /* div transparente que captura eventos de teclado/clique SEM bloquear o site */
  const capture = document.createElement("div");
  Object.assign(capture.style, {
    position:      "fixed",
    inset:         "0",
    zIndex:        "9999",
    pointerEvents: "none", // começa sem capturar — ativa só no modo chat
  });
  document.body.appendChild(capture);

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

  /* ── estado ── */
  const remote    = new Map();
  const chatBubbles = [];
  const particles = [];
  const clickTimes = new Map();

  let myId   = null;
  let lastSent = 0;
  let lastX = -1, lastY = -1;
  const me = { tx: -999, ty: -999, dx: -999, dy: -999, label: "", color: "#3b82f6", visible: false };

  /* modo de digitação */
  let typing    = false;
  let typingBuf = "";

  createScoreboard();
  createHint();

  /* ── socket ── */
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
    if (!socket || socket.readyState !== 1 || !text.trim()) return;
    socket.send(JSON.stringify({ type: "chat", text: text.trim().slice(0, 120) }));
  }

  function sendExplode(targetId) {
    if (!socket || socket.readyState !== 1) return;
    socket.send(JSON.stringify({ type: "explode", targetId }));
  }

  /* ── teclado: modo chat ── */
  window.addEventListener("keydown", e => {
    // abre com T (quando não está em input do site)
    if (!typing) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        typing    = true;
        typingBuf = "";
        return;
      }
      return;
    }

    // estamos digitando
    e.preventDefault();
    e.stopPropagation();

    if (e.key === "Escape") {
      typing    = false;
      typingBuf = "";
    } else if (e.key === "Enter") {
      if (typingBuf.trim()) sendChat(typingBuf);
      typing    = false;
      typingBuf = "";
    } else if (e.key === "Backspace") {
      typingBuf = typingBuf.slice(0, -1);
    } else if (e.key.length === 1) {
      if (typingBuf.length < 120) typingBuf += e.key;
    }
  }, true); // capture=true para interceptar antes de qualquer outro handler

  /* ── clique: double-click para explodir ── */
  window.addEventListener("click", e => {
    if (typing) return;
    const id = _nearestRemote(e.clientX, e.clientY, 60);
    if (!id) return;
    const now  = Date.now();
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

  /* ── mouse ── */
  window.addEventListener("mousemove", e => {
    lastX = e.clientX; lastY = e.clientY;
    me.tx = e.clientX; me.ty = e.clientY;
    sendCursor(e.clientX, e.clientY);
  }, { passive: true });

  setInterval(() => {
    if (document.hidden || lastX < 0) return;
    sendCursor(lastX, lastY, true);
  }, 3000);

  /* ── mensagens do servidor ── */
  socket.addEventListener("message", ev => {
    let m; try { m = JSON.parse(ev.data); } catch { return; }

    if (m.type === "hello") {
      myId        = m.id;
      me.color    = m.color;
      me.label    = (m.country ? flag(m.country) + " " : "") + m.name;
      me.visible  = true;
      if (lastX < 0) { me.tx = W / 2; me.ty = H / 2; }
      sendCursor(lastX >= 0 ? lastX : W / 2, lastY >= 0 ? lastY : H / 2, true);

    } else if (m.type === "cursor") {
      if (m.id === myId) return;
      const label = (m.country ? flag(m.country) + " " : "") + m.name;
      const c = remote.get(m.id);
      if (!c) remote.set(m.id, { tx: m.x, ty: m.y, dx: m.x, dy: m.y, lastSeen: Date.now(), label, color: m.color });
      else { c.tx = m.x; c.ty = m.y; c.lastSeen = Date.now(); c.label = label; c.color = m.color; }

    } else if (m.type === "chat") {
      chatBubbles.push({ id: m.id, text: m.text, rgb: hexToRgb(m.color), born: Date.now() });

    } else if (m.type === "explode") {
      const victim = m.id === myId ? me : remote.get(m.id);
      if (victim) createExplosion(victim.dx, victim.dy, hexToRgb(victim.color || "#fff"), particles);
      if (m.id === myId) {
        chatBubbles.push({ id: myId, text: `💥 ${m.killerName} te explodiu!`, rgb: hexToRgb("#ef4444"), born: Date.now() });
      }
      if (m.id !== myId) remote.delete(m.id);

    } else if (m.type === "score") {
      updateScoreboard(m.scores, myId);

    } else if (m.type === "leave") {
      remote.delete(m.id);
    }
  });

  /* ── RENDER LOOP ─────────────────────────────────────────────────────── */
  function frame() {
    ctx.clearRect(0, 0, W, H);
    const now = Date.now();

    /* partículas */
    tickParticles(ctx, particles);

    /* bolhas enviadas (seguem o cursor do dono) */
    for (let i = chatBubbles.length - 1; i >= 0; i--) {
      const b   = chatBubbles[i];
      const age = now - b.born;
      if (age > CHAT_TTL) { chatBubbles.splice(i, 1); continue; }

      let cx, cy;
      if (b.id === myId) { cx = me.dx; cy = me.dy; }
      else { const c = remote.get(b.id); if (!c) continue; cx = c.dx; cy = c.dy; }

      const fadeStart = CHAT_TTL - 600;
      const alpha     = age > fadeStart ? 1 - (age - fadeStart) / 600 : 1;
      const floatY    = -(age / CHAT_TTL) * 16;

      drawBubble(ctx, cx, cy + floatY, b.text, b.rgb, alpha, false);
    }

    /* cursores remotos */
    for (const c of remote.values()) {
      c.dx += (c.tx - c.dx) * 0.32;
      c.dy += (c.ty - c.dy) * 0.32;
      const age = now - c.lastSeen;
      if (age > STALE_DROP) { remote.delete(c.id); continue; }
      const alpha = age > STALE_FADE ? Math.max(0, 1 - (age - STALE_FADE) / (STALE_DROP - STALE_FADE)) : 1;
      if (alpha <= 0.02) continue;
      drawCursor(ctx, c.dx, c.dy, c.label, hexToRgb(c.color), alpha);
    }

    /* cursor próprio */
    if (me.visible && lastX >= 0) {
      me.dx += (me.tx - me.dx) * 0.32;
      me.dy += (me.ty - me.dy) * 0.32;
      drawCursor(ctx, me.dx, me.dy, me.label, hexToRgb(me.color), 1);

      /* balão de digitação — aparece colado ao cursor, em tempo real */
      if (typing) {
        const displayText = typingBuf || "";
        drawBubble(ctx, me.dx, me.dy, displayText, hexToRgb(me.color), 1, true);
      }
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

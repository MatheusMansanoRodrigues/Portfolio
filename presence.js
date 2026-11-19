/*
  presence.js — cursores ao vivo, chat no cursor, escudo, explosões e placar.
*/
import PartySocket from "https://esm.sh/partysocket@1.3.0";

/* ── CONFIG ─────────────────────────────────────────────────────────────── */
const PROD_HOST  = "mansano-presence.rodriguesmath53.workers.dev";
const LOCAL_HOST = "localhost:8787";
const ROOM       = "home";

const SEND_INTERVAL   = 45;
const STALE_FADE      = 5000;
const STALE_DROP      = 8000;
const CHAT_TTL        = 5000;   // bolha visível por 5s
const DBL_CLICK_MS    = 400;
const SHIELD_DURATION = 3000;   // ms (espelhado do servidor)
const SHIELD_COOLDOWN = 8000;   // ms (espelhado do servidor)

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer   = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

if (window.innerWidth >= 768 && finePointer && !reducedMotion) startPresence();

/* ── HELPERS DE COR ─────────────────────────────────────────────────────── */
const RGB_CACHE = new Map();
function hexToRgb(hex) {
  if (RGB_CACHE.has(hex)) return RGB_CACHE.get(hex);
  const n = parseInt(hex.replace("#", ""), 16);
  const v = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  RGB_CACHE.set(hex, v); return v;
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

/* Seta + pill de nome */
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
  ctx.fill(); ctx.stroke();

  if (alpha > 0.06 && label) {
    ctx.font = "600 11px Inter, system-ui, sans-serif";
    const tw = ctx.measureText(label).width;
    const padX = 7, pw = tw + padX * 2, ph = 17;
    const lx = x + 12, ly = y + 14;
    ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
    roundRect(ctx, lx, ly, pw, ph, 5); ctx.fill();
    ctx.fillStyle    = `rgba(6,6,8,${alpha})`;
    ctx.textBaseline = "middle";
    ctx.fillText(label, lx + padX, ly + ph / 2 + 0.5);
  }
  ctx.restore();
}

/* Escudo — visual glassmorphism com anel de progresso e partículas */
function drawShield(ctx, x, y, rgb, progress /* 0=cheio, 1=expirou */) {
  const [r, g, b] = rgb;
  const cx     = x + 4;
  const cy     = y + 7;
  const now    = Date.now();
  const pulse  = 0.5 + 0.5 * Math.sin(now / 220);  // 0..1 pulsante
  const radius = 26 + pulse * 3;
  const remaining = 1 - progress;  // 1=cheio, 0=vazio

  ctx.save();

  // ── camada 1: glow exterior suave ──────────────────────────────────────
  const grd = ctx.createRadialGradient(cx, cy, radius * 0.4, cx, cy, radius + 10);
  grd.addColorStop(0,   `rgba(${r},${g},${b},${0.08 * remaining})`);
  grd.addColorStop(0.6, `rgba(${r},${g},${b},${0.14 * remaining})`);
  grd.addColorStop(1,   `rgba(${r},${g},${b},0)`);
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 10, 0, Math.PI * 2);
  ctx.fillStyle = grd;
  ctx.fill();

  // ── camada 2: disco translúcido (glass) ────────────────────────────────
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${r},${g},${b},${0.08 + pulse * 0.04})`;
  ctx.fill();

  // ── camada 3: anel de progresso (trilha) ───────────────────────────────
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(${r},${g},${b},0.15)`;
  ctx.lineWidth   = 3;
  ctx.stroke();

  // ── camada 4: arco preenchido (quanto resta) ───────────────────────────
  if (remaining > 0.01) {
    const start = -Math.PI / 2;
    const end   = start + remaining * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, start, end);
    ctx.strokeStyle = `rgba(${r},${g},${b},${0.7 + pulse * 0.3})`;
    ctx.lineWidth   = 3;
    ctx.lineCap     = "round";
    ctx.shadowColor = `rgba(${r},${g},${b},0.8)`;
    ctx.shadowBlur  = 8;
    ctx.stroke();
    ctx.shadowBlur  = 0;
  }

  // ── camada 5: pontinho de brilho que gira ─────────────────────────────
  if (remaining > 0.05) {
    const angle = -Math.PI / 2 + remaining * Math.PI * 2;
    const dotX  = cx + Math.cos(angle) * radius;
    const dotY  = cy + Math.sin(angle) * radius;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 3.5, 0, Math.PI * 2);
    ctx.fillStyle   = `rgba(255,255,255,${0.9 * remaining})`;
    ctx.shadowColor = `rgba(${r},${g},${b},1)`;
    ctx.shadowBlur  = 10;
    ctx.fill();
    ctx.shadowBlur  = 0;
  }

  ctx.restore();
}

/* Cooldown ring — anel fino mostrando quanto falta */
function drawShieldCooldown(ctx, x, y, rgb, progress /* 1=cheio CD, 0=pronto */) {
  if (progress <= 0.01) return;
  const [r, g, b] = rgb;
  const cx = x + 4, cy = y + 7;
  ctx.save();

  // trilha
  ctx.beginPath();
  ctx.arc(cx, cy, 20, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(${r},${g},${b},0.1)`;
  ctx.lineWidth   = 2;
  ctx.stroke();

  // arco restante (quanto já carregou)
  const filled = 1 - progress;
  if (filled > 0.01) {
    ctx.beginPath();
    ctx.arc(cx, cy, 20, -Math.PI / 2, -Math.PI / 2 + filled * Math.PI * 2);
    ctx.strokeStyle = `rgba(${r},${g},${b},0.45)`;
    ctx.lineWidth   = 2;
    ctx.lineCap     = "round";
    ctx.stroke();
  }

  ctx.restore();
}

/* Balão de chat — com quebra de linha automática */
function drawBubble(ctx, x, y, text, rgb, alpha, isTyping) {
  ctx.save();

  const FONT    = "500 13px Inter, system-ui, sans-serif";
  const PAD_X   = 12, PAD_Y = 10;
  const MAX_W   = 200;  // largura máxima do texto antes de quebrar
  const LINE_H  = 18;
  const R       = 12;
  const TAIL    = 7;
  const [r, g, b] = rgb;

  ctx.font = FONT;

  // ── quebra o texto em linhas ──────────────────────────────────────────
  function wrapText(str) {
    const words  = str.split(" ");
    const lines  = [];
    let   line   = "";
    for (const word of words) {
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > MAX_W && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines.length ? lines : [""];
  }

  const display = text.length > 120 ? text.slice(0, 117) + "…" : text;
  const lines   = wrapText(display);
  const lineCount = lines.length;

  // largura do balão = linha mais longa + padding
  const maxLineW = lines.reduce((m, l) => Math.max(m, ctx.measureText(l).width), 0);
  const bw = Math.max(maxLineW + PAD_X * 2 + (isTyping && lineCount === 1 ? 14 : 0), 60);
  const bh = PAD_Y * 2 + lineCount * LINE_H + (lineCount > 1 ? (lineCount - 1) * 2 : 0);

  // posição: acima do cursor, ajusta pra não sair da tela
  let bx = x + 4;
  const by = y - bh - TAIL - 8;

  // não deixa sair pela direita
  if (typeof window !== "undefined" && bx + bw > window.innerWidth - 12) {
    bx = window.innerWidth - bw - 12;
  }
  if (bx < 8) bx = 8;

  // sombra
  ctx.shadowColor   = `rgba(0,0,0,${0.25 * alpha})`;
  ctx.shadowBlur    = 12;
  ctx.shadowOffsetY = 4;

  if (isTyping) {
    // fundo branco com borda colorida
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    roundRect(ctx, bx, by, bw, bh, R); ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = `rgba(${r},${g},${b},${alpha * 0.55})`;
    ctx.lineWidth   = 1.5;
    roundRect(ctx, bx, by, bw, bh, R); ctx.stroke();

    // cauda
    const tailX = Math.min(bx + 18, bx + bw - 20);
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath();
    ctx.moveTo(tailX,          by + bh);
    ctx.lineTo(tailX + TAIL,   by + bh + TAIL);
    ctx.lineTo(tailX + TAIL*2, by + bh);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = `rgba(${r},${g},${b},${alpha * 0.3})`;
    ctx.lineWidth = 1; ctx.stroke();

    // linhas de texto
    ctx.fillStyle    = `rgba(10,10,15,${alpha})`;
    ctx.textBaseline = "top";
    lines.forEach((line, i) => {
      ctx.fillText(line, bx + PAD_X, by + PAD_Y + i * (LINE_H + 2));
    });

    // cursor piscante na última linha
    if (Math.floor(Date.now() / 530) % 2 === 0) {
      const lastLine = lines[lines.length - 1];
      const cx = bx + PAD_X + ctx.measureText(lastLine).width + 3;
      const cy = by + PAD_Y + (lineCount - 1) * (LINE_H + 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fillRect(cx, cy + 2, 1.5, LINE_H - 4);
    }

  } else {
    // fundo colorido
    ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
    roundRect(ctx, bx, by, bw, bh, R); ctx.fill();
    ctx.shadowColor = "transparent";

    const tailX = Math.min(bx + 18, bx + bw - 20);
    ctx.beginPath();
    ctx.moveTo(tailX,          by + bh);
    ctx.lineTo(tailX + TAIL,   by + bh + TAIL);
    ctx.lineTo(tailX + TAIL*2, by + bh);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle    = `rgba(255,255,255,${alpha})`;
    ctx.textBaseline = "top";
    lines.forEach((line, i) => {
      ctx.fillText(line, bx + PAD_X, by + PAD_Y + i * (LINE_H + 2));
    });
  }

  ctx.restore();
}

/* Explosão */
function createExplosion(x, y, rgb, particles) {
  for (let i = 0; i < 22; i++) {
    const angle = (Math.PI * 2 * i) / 22 + Math.random() * 0.3;
    const speed = 3 + Math.random() * 6;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      life: 1, decay: 0.022 + Math.random() * 0.02,
      r: 2 + Math.random() * 3, rgb,
    });
  }
}
function tickParticles(ctx, particles) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.vx *= 0.93; p.life -= p.decay;
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
    position: "fixed", bottom: "24px", right: "24px", zIndex: "9997",
    background: "rgba(6,6,8,0.78)", backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px",
    padding: "12px 16px", minWidth: "180px",
    fontFamily: "Inter, system-ui, sans-serif", fontSize: "12px", color: "#fff",
    pointerEvents: "none", userSelect: "none",
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
    return `<div style="display:flex;justify-content:space-between;gap:16px;padding:2px 0;opacity:${isMe?1:0.7}">
      <span style="color:${s.color};font-weight:${isMe?700:500}">${medal}${s.name}${isMe?" (você)":""}</span>
      <span style="font-weight:700">${s.score}</span></div>`;
  }).join("") || `<div style="opacity:.4">Ninguém ainda</div>`;
}

/* ── DICA DE ATALHOS ────────────────────────────────────────────────────── */
function createHint() {
  const el = document.createElement("div");
  el.id = "presence-hint";
  Object.assign(el.style, {
    position: "fixed", bottom: "24px", left: "24px", zIndex: "9997",
    fontFamily: "Inter, system-ui, sans-serif", fontSize: "11px",
    color: "rgba(255,255,255,0.35)", pointerEvents: "none", userSelect: "none",
    lineHeight: "1.8", background: "rgba(6,6,8,0.55)",
    backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "10px", padding: "8px 12px",
  });
  el.innerHTML =
    `<kbd style="background:rgba(255,255,255,0.1);padding:1px 6px;border-radius:4px;font-family:inherit">T</kbd> &nbsp;falar<br>` +
    `<kbd style="background:rgba(255,255,255,0.1);padding:1px 6px;border-radius:4px;font-family:inherit">2×</kbd> explodir cursor alheio<br>` +
    `<kbd style="background:rgba(255,255,255,0.1);padding:1px 6px;border-radius:4px;font-family:inherit">►</kbd> escudo (3s · CD 8s)`;
  document.body.appendChild(el);
}

/* ── INDICADOR DE COOLDOWN DO ESCUDO (próprio) ──────────────────────────── */
function createShieldIndicator() {
  const el = document.createElement("div");
  el.id = "presence-shield-cd";
  Object.assign(el.style, {
    position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
    zIndex: "9997", fontFamily: "Inter, system-ui, sans-serif", fontSize: "11px",
    color: "rgba(255,255,255,0.7)", pointerEvents: "none", userSelect: "none",
    background: "rgba(6,6,8,0.7)", backdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px",
    padding: "5px 12px", display: "none", transition: "opacity .3s",
  });
  document.body.appendChild(el);
  return el;
}
function updateShieldIndicator(el, shieldUntil, cdUntil) {
  const now = Date.now();
  if (now < shieldUntil) {
    const left = ((shieldUntil - now) / SHIELD_DURATION * 100).toFixed(0);
    el.textContent = `🛡️ escudo ativo — ${((shieldUntil - now) / 1000).toFixed(1)}s`;
    el.style.display = "block";
    el.style.color   = "rgba(100,220,255,0.9)";
  } else if (now < cdUntil) {
    const left = ((cdUntil - now) / 1000).toFixed(1);
    el.textContent = `🛡️ cooldown — ${left}s`;
    el.style.display = "block";
    el.style.color   = "rgba(255,255,255,0.4)";
  } else {
    el.textContent = `🛡️ pronto`;
    el.style.display = "block";
    el.style.color   = "rgba(100,220,255,0.6)";
    setTimeout(() => { el.style.display = "none"; }, 1500);
  }
}

/* ── PRINCIPAL ───────────────────────────────────────────────────────────── */
function startPresence() {
  const isLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1";
  const host    = isLocal ? LOCAL_HOST : PROD_HOST;

  const canvas = document.createElement("canvas");
  canvas.id = "presence-canvas";
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "fixed", top: "0", left: "0",
    width: "100vw", height: "100vh",
    pointerEvents: "none", zIndex: "9998",
  });
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W = window.innerWidth, H = window.innerHeight;

  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width  = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize, { passive: true });

  /* estado */
  const remote      = new Map();   // id → cursor remoto
  const chatBubbles = [];
  const particles   = [];
  const clickTimes  = new Map();

  let myId   = null;
  let lastSent = 0;
  let lastX = -1, lastY = -1;

  const me = {
    tx: -999, ty: -999, dx: -999, dy: -999,
    label: "", color: "#3b82f6", visible: false,
    shieldUntil: 0, shieldCdUntil: 0,
  };

  // escudos remotos: id → { until }
  const shields = new Map();

  let typing = false, typingBuf = "";

  // textarea invisível — fica focado durante o chat pra receber emoji (Win+.) e paste
  const ghost = document.createElement("textarea");
  Object.assign(ghost.style, {
    position: "fixed", top: "-9999px", left: "-9999px",
    width: "1px", height: "1px", opacity: "0",
    pointerEvents: "none", zIndex: "-1",
  });
  ghost.setAttribute("autocomplete", "off");
  ghost.setAttribute("autocorrect", "off");
  ghost.setAttribute("spellcheck", "false");
  document.body.appendChild(ghost);

  // sincroniza o textarea → typingBuf a cada input (captura emoji, paste, IME)
  ghost.addEventListener("input", () => {
    if (!typing) return;
    typingBuf = ghost.value.slice(0, 120);
  });

  function openTyping() {
    typing    = true;
    typingBuf = "";
    ghost.value = "";
    ghost.focus();
  }
  function closeTyping(send_) {
    if (send_ && typingBuf.trim()) send({ type: "chat", text: typingBuf.trim().slice(0, 120) });
    typing    = false;
    typingBuf = "";
    ghost.value = "";
    ghost.blur();
  }

  createScoreboard();
  createHint();
  const shieldEl = createShieldIndicator();

  /* socket */
  let socket;
  try { socket = new PartySocket({ host, room: ROOM }); }
  catch (e) { console.warn("[presence]", e); return; }

  const send = (obj) => {
    if (socket?.readyState === 1) socket.send(JSON.stringify(obj));
  };

  function sendCursor(x, y, force) {
    if (!force && Date.now() - lastSent < SEND_INTERVAL) return;
    lastSent = Date.now();
    send({ type: "cursor", x, y });
  }

  /* teclado */
  window.addEventListener("keydown", e => {
    if (!typing) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "t" || e.key === "T") { e.preventDefault(); openTyping(); }
      return;
    }
    // Escape e Enter são capturados aqui; o resto vai pro ghost naturalmente
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeTyping(false); }
    else if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); closeTyping(true); }
    // Backspace: deixa o ghost processar primeiro, mas sync manual pra ser imediato no canvas
    else if (e.key === "Backspace") {
      // o ghost já vai disparar "input" e atualizar typingBuf, não precisa fazer nada aqui
    }
  }, true);

  /* botão direito = escudo */
  window.addEventListener("contextmenu", e => {
    e.preventDefault();
    const now = Date.now();
    if (now < me.shieldCdUntil) return; // cooldown ativo
    me.shieldUntil  = now + SHIELD_DURATION;
    me.shieldCdUntil = now + SHIELD_COOLDOWN;
    send({ type: "shield" });
  });

  /* double-click para explodir */
  window.addEventListener("click", e => {
    if (typing) return;
    const id  = _nearestRemote(e.clientX, e.clientY, 60);
    if (!id) return;
    const now = Date.now();
    const last = clickTimes.get(id) ?? 0;
    if (now - last < DBL_CLICK_MS) {
      send({ type: "explode", targetId: id });
      clickTimes.delete(id);
    } else { clickTimes.set(id, now); }
  });

  function _nearestRemote(mx, my, maxDist) {
    let best = null, bestD = maxDist;
    for (const [id, c] of remote) {
      const d = Math.hypot(c.dx - mx, c.dy - my);
      if (d < bestD) { bestD = d; best = id; }
    }
    return best;
  }

  /* mouse */
  window.addEventListener("mousemove", e => {
    lastX = e.clientX; lastY = e.clientY;
    me.tx = e.clientX; me.ty = e.clientY;
    sendCursor(e.clientX, e.clientY);
  }, { passive: true });

  setInterval(() => {
    if (document.hidden || lastX < 0) return;
    sendCursor(lastX, lastY, true);
  }, 3000);

  /* cooldown visual */
  setInterval(() => {
    if (!me.visible) return;
    if (Date.now() < me.shieldUntil || Date.now() < me.shieldCdUntil) {
      updateShieldIndicator(shieldEl, me.shieldUntil, me.shieldCdUntil);
    }
  }, 100);

  /* mensagens */
  socket.addEventListener("message", ev => {
    let m; try { m = JSON.parse(ev.data); } catch { return; }

    if (m.type === "hello") {
      myId = m.id; me.color = m.color;
      me.label   = (m.country ? flag(m.country) + " " : "") + m.name;
      me.visible = true;
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

    } else if (m.type === "shield") {
      if (m.id === myId) return; // o próprio já controla localmente
      shields.set(m.id, { until: m.until });

    } else if (m.type === "explode") {
      const isMe   = m.id === myId;
      const victim = isMe ? me : remote.get(m.id);
      if (victim) createExplosion(victim.dx, victim.dy, hexToRgb(victim.color || "#fff"), particles);
      if (isMe) {
        chatBubbles.push({ id: myId, text: `💥 ${m.killerName} te explodiu!`, rgb: hexToRgb("#ef4444"), born: Date.now() });
      }
      if (!isMe) remote.delete(m.id);

    } else if (m.type === "score") {
      updateScoreboard(m.scores, myId);

    } else if (m.type === "leave") {
      remote.delete(m.id); shields.delete(m.id);
    }
  });

  /* ── RENDER LOOP ─────────────────────────────────────────────────────── */
  function frame() {
    ctx.clearRect(0, 0, W, H);
    const now = Date.now();

    tickParticles(ctx, particles);

    /* bolhas enviadas */
    for (let i = chatBubbles.length - 1; i >= 0; i--) {
      const b   = chatBubbles[i];
      const age = now - b.born;
      if (age > CHAT_TTL) { chatBubbles.splice(i, 1); continue; }
      let cx, cy;
      if (b.id === myId) { cx = me.dx; cy = me.dy; }
      else { const c = remote.get(b.id); if (!c) continue; cx = c.dx; cy = c.dy; }
      const fadeStart = CHAT_TTL - 800;
      const alpha     = age > fadeStart ? 1 - (age - fadeStart) / 800 : 1;
      const floatY    = -(age / CHAT_TTL) * 16;
      drawBubble(ctx, cx, cy + floatY, b.text, b.rgb, alpha, false);
    }

    /* cursores remotos */
    for (const [id, c] of remote) {
      c.dx += (c.tx - c.dx) * 0.32;
      c.dy += (c.ty - c.dy) * 0.32;
      const age = now - c.lastSeen;
      if (age > STALE_DROP) { remote.delete(id); continue; }
      const alpha = age > STALE_FADE ? Math.max(0, 1 - (age - STALE_FADE) / (STALE_DROP - STALE_FADE)) : 1;
      if (alpha <= 0.02) continue;

      // escudo remoto
      const sh = shields.get(id);
      if (sh && now < sh.until) {
        const progress = 1 - (sh.until - now) / SHIELD_DURATION;
        drawShield(ctx, c.dx, c.dy, hexToRgb(c.color), progress);
      }

      drawCursor(ctx, c.dx, c.dy, c.label, hexToRgb(c.color), alpha);
    }

    /* cursor próprio */
    if (me.visible && lastX >= 0) {
      me.dx += (me.tx - me.dx) * 0.32;
      me.dy += (me.ty - me.dy) * 0.32;

      // escudo próprio
      if (now < me.shieldUntil) {
        const progress = 1 - (me.shieldUntil - now) / SHIELD_DURATION;
        drawShield(ctx, me.dx, me.dy, hexToRgb(me.color), progress);
      } else if (now < me.shieldCdUntil) {
        // cooldown ring
        const progress = (me.shieldCdUntil - now) / (SHIELD_COOLDOWN - SHIELD_DURATION);
        drawShieldCooldown(ctx, me.dx, me.dy, hexToRgb(me.color), progress);
      }

      drawCursor(ctx, me.dx, me.dy, me.label, hexToRgb(me.color), 1);

      /* balão de digitação */
      if (typing) drawBubble(ctx, me.dx, me.dy, typingBuf, hexToRgb(me.color), 1, true);
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/* ── CURSOR ── */
const cur = document.getElementById('cur');
let mx = 0, my = 0;

document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cur.style.left = mx + 'px';
    cur.style.top = my + 'px';
});

document.querySelectorAll('button, a, .bento-card, .proj-row, .pill').forEach(el => {
    el.addEventListener('mouseenter', () => cur.classList.add('big'));
    el.addEventListener('mouseleave', () => cur.classList.remove('big'));
});

/* ── SCROLL REVEAL ── */
const srObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); srObs.unobserve(e.target); }
    });
}, { threshold: 0.12 });

document.querySelectorAll('.sr').forEach(el => srObs.observe(el));

/* ── BENTO CARD MAGNETIC HOVER ── */
document.querySelectorAll('.bento-card').forEach(card => {
    card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) / r.width;
        const y = (e.clientY - r.top - r.height / 2) / r.height;
        card.style.transform = `translateY(-3px) translateZ(0) rotateX(${-y * 4}deg) rotateY(${x * 4}deg)`;
        card.style.transformStyle = 'preserve-3d';
    });
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateZ(0)';
        setTimeout(() => { card.style.transform = ''; }, 420);
    });
});

/* ── HERO CARD STACK — fluid drag-behind ── */
(function initStack() {
    const stack = document.getElementById('card-stack');
    if (!stack) return;

    const cards = Array.from(stack.querySelectorAll('.hcs-card'));
    const hint  = stack.querySelector('.stack-hint');
    const N     = cards.length;

    // Visual slots: pos 0 = top, pos N-1 = bottom-behind
    const SLOTS = [
        { y: 0,  rot:  0,  scale: 1.00, z: 30 },
        { y: 14, rot: -4,  scale: 0.96, z: 20 },
        { y: 26, rot:  3,  scale: 0.92, z: 10 },
    ];

    // order[i] = which card index is at slot i
    let order = cards.map((_, i) => i);
    let busy  = false;

    // ── apply slot positions ──
    function place(animate) {
        order.forEach((ci, slot) => {
            const card = cards[ci];
            const s    = SLOTS[Math.min(slot, SLOTS.length - 1)];
            card.style.transition = animate
                ? 'transform .55s cubic-bezier(0.34,1.2,0.64,1), box-shadow .4s ease, z-index 0s .1s'
                : 'none';
            card.style.zIndex    = s.z;
            card.style.transform = `translateY(${s.y}px) rotate(${s.rot}deg) scale(${s.scale})`;
            card.style.boxShadow = slot === 0
                ? '0 20px 50px rgba(119,107,93,0.18)'
                : '0 4px 14px rgba(119,107,93,0.07)';
        });
    }

    place(false);

    // ── cycle: top card slides behind the stack ──
    function cycle(releaseVelX) {
        if (busy) return;
        busy = true;

        const topCI  = order[0];
        const topCard = cards[topCI];

        // 1. Instantly drop z-index so it goes behind
        topCard.style.transition = 'none';
        topCard.style.zIndex = 0;

        // 2. Slide it to the "behind" position with a slight arc
        const dir = releaseVelX >= 0 ? 1 : -1;
        requestAnimationFrame(() => {
            topCard.style.transition = 'transform .48s cubic-bezier(0.4,0,0.2,1)';
            const bottomS = SLOTS[SLOTS.length - 1];
            topCard.style.transform =
                `translateY(${bottomS.y}px) rotate(${bottomS.rot + dir * 6}deg) scale(${bottomS.scale})`;

            // 3. Reorder array and animate everyone to new slots
            setTimeout(() => {
                order = [...order.slice(1), order[0]];
                place(true);
                setTimeout(() => { busy = false; }, 560);
            }, 200);
        });
    }

    // ── drag state ──
    let dragging = false;
    let startX, startY, lastX, velX;

    function getTopCard() { return cards[order[0]]; }

    stack.addEventListener('pointerdown', e => {
        if (busy) return;
        if (!getTopCard().contains(e.target)) return;
        // ignore clicks on the link button
        if (e.target.closest('.hcs-link')) return;
        dragging = true;
        startX = lastX = e.clientX;
        startY = e.clientY;
        velX = 0;
        getTopCard().setPointerCapture(e.pointerId);
        getTopCard().style.transition = 'none';
        hint && (hint.style.opacity = '0');
        e.preventDefault();
    });

    window.addEventListener('pointermove', e => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        velX = e.clientX - lastX;
        lastX = e.clientX;

        // Drag follows finger/mouse with tilt
        const rot   = dx * 0.10;
        const lift  = Math.min(Math.abs(dx) * 0.04, 8);
        const scale = 1 + Math.min(Math.abs(dx) * 0.0002, 0.03); // slight grow on drag
        getTopCard().style.transform =
            `translate(${dx}px, ${dy - lift}px) rotate(${rot}deg) scale(${scale})`;

        // Peek cards below shift slightly toward top as drag progresses
        const progress = Math.min(Math.abs(dx) / 120, 1);
        order.slice(1).forEach((ci, i) => {
            const from = SLOTS[Math.min(i + 1, SLOTS.length - 1)];
            const to   = SLOTS[Math.min(i,     SLOTS.length - 1)];
            const y    = from.y + (to.y - from.y) * progress;
            const r    = from.rot + (to.rot - from.rot) * progress;
            const sc   = from.scale + (to.scale - from.scale) * progress;
            cards[ci].style.transition = 'none';
            cards[ci].style.transform  = `translateY(${y}px) rotate(${r}deg) scale(${sc})`;
        });
    });

    window.addEventListener('pointerup', e => {
        if (!dragging) return;
        dragging = false;

        const dx = e.clientX - startX;
        const THRESH = 80;

        if (Math.abs(dx) > THRESH || Math.abs(velX) > 5) {
            cycle(velX);
        } else {
            // Snap everything back
            place(true);
        }
    });

    // Click top card to cycle (ignore link button)
    stack.addEventListener('click', e => {
        if (busy) return;
        if (e.target.closest('.hcs-link')) return;
        const dx = Math.abs(e.clientX - (startX || e.clientX));
        if (getTopCard().contains(e.target) && dx < 6) cycle(1);
    });

    // Cursor
    stack.addEventListener('mouseenter', () => cur.classList.add('big'));
    stack.addEventListener('mouseleave', () => cur.classList.remove('big'));
})();

/* ── PILL CLICK RIPPLE ── */
document.querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', function (e) {
        const r = this.getBoundingClientRect();
        const rip = document.createElement('span');
        rip.style.cssText = `
      position:absolute;border-radius:50%;
      width:80px;height:80px;
      left:${e.clientX - r.left - 40}px;
      top:${e.clientY - r.top - 40}px;
      background:rgba(0,0,0,0.12);
      transform:scale(0);
      animation:rip .5s ease-out forwards;
      pointer-events:none;
    `;
        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(rip);
        setTimeout(() => rip.remove(), 500);
    });
});

/* ── PROJ ROW CLICK — expand detail ── */
const projDetails = [
    {
        title: 'Esfera 3D',
        desc: 'Controle de esfera 3D usando gestos da mão via câmera. Visão computacional no browser, sem instalar nada.',
        tags: ['JavaScript', 'MediaPipe', 'Three.js', 'Canvas'],
        url: 'https://matheusmansanorodrigues.github.io/esfera_3d/'
    },
    {
        title: 'Ótica Horizonte',
        desc: 'Site completo para ótica em Florianópolis com galeria, depoimentos, formulário de contato e mapa.',
        tags: ['HTML', 'CSS', 'JavaScript', 'Landing Page'],
        url: 'https://matheusmansanorodrigues.github.io/otica_horizonte/'
    },
    {
        title: 'Gestor de Tarefas',
        desc: 'App de produtividade com CRUD completo, filtro por status e pesquisa em tempo real.',
        tags: ['HTML', 'CSS', 'JavaScript', 'LocalStorage'],
        url: 'https://matheusmansanorodrigues.github.io/Projeto-Tarefa/'
    },
    {
        title: 'Tomo do Mestre',
        desc: 'Guia interativo medieval de RPG com suporte a múltiplos sistemas. Escolha o universo e o tomo se transforma.',
        tags: ['HTML', 'CSS', 'JavaScript', 'RPG'],
        url: 'https://matheusmansanorodrigues.github.io/Guia_RPG/'
    },
];

document.querySelectorAll('.proj-row').forEach((row) => {
    const idx = parseInt(row.dataset.idx, 10);
    row.addEventListener('click', () => {
        const d = projDetails[idx];
        if (d) showToast(d.title, d.desc, d.tags, d.url);
    });
});

/* ── TOAST NOTIFICATION ── */
let toastEl = null;
function showToast(title, desc, tags, url) {
    if (toastEl) toastEl.remove();
    toastEl = document.createElement('div');
    toastEl.style.cssText = `
    position:fixed;bottom:32px;right:32px;
    background:#EBE3D5;border:1px solid rgba(119,107,93,0.2);
    border-radius:16px;padding:24px 28px;
    max-width:340px;z-index:9000;
    transform:translateY(20px);opacity:0;
    transition:all .4s cubic-bezier(0.16,1,0.3,1);
    font-family:'Space Grotesk',sans-serif;
    box-shadow:0 20px 60px rgba(119,107,93,0.15);
  `;
    const tagsHtml = tags.map(t => `<span style="padding:4px 10px;background:rgba(176,166,149,0.2);border:1px solid rgba(119,107,93,0.2);border-radius:100px;font-size:12px;color:#776B5D;font-family:'JetBrains Mono',monospace">${t}</span>`).join('');
    const linkHtml = url
        ? `<a href="${url}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;margin-top:14px;padding:9px 18px;background:#776B5D;color:#F3EEEA;font-size:13px;font-weight:600;border-radius:8px;text-decoration:none;font-family:'Space Grotesk',sans-serif;transition:background .2s" onmouseover="this.style.background='#5a5248'" onmouseout="this.style.background='#776B5D'"><i class='fa-solid fa-arrow-up-right-from-square'></i> Ver projeto</a>`
        : '';
    toastEl.innerHTML = `
    <div style="font-size:11px;color:#B0A695;letter-spacing:.12em;text-transform:uppercase;font-family:'JetBrains Mono',monospace;margin-bottom:8px">Projeto</div>
    <div style="font-size:18px;font-weight:700;margin-bottom:8px;font-family:'Syne',sans-serif;color:#776B5D">${title}</div>
    <div style="font-size:14px;color:#B0A695;line-height:1.6;margin-bottom:12px">${desc}</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px">${tagsHtml}</div>
    ${linkHtml}
  `;
    document.body.appendChild(toastEl);
    requestAnimationFrame(() => {
        toastEl.style.transform = 'translateY(0)';
        toastEl.style.opacity = '1';
    });
    setTimeout(() => {
        if (toastEl) {
            toastEl.style.transform = 'translateY(20px)';
            toastEl.style.opacity = '0';
            setTimeout(() => toastEl && toastEl.remove(), 400);
        }
    }, 5000);
}

/* ── RIPPLE KEYFRAME ── */
const s = document.createElement('style');
s.textContent = `
  @keyframes rip { to { transform:scale(1); opacity:0 } }
  .bento-card { perspective: 800px }
`;
document.head.appendChild(s);

/* ── THEME TOGGLE ── */
const themeBtn = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
let isDark = false;

function setThemeIcon(dark) {
    themeIcon.className = dark ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
}

// respect system preference on load
if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    isDark = true;
    document.body.classList.add('dark');
    setThemeIcon(true);
}

themeBtn.addEventListener('click', () => {
    isDark = !isDark;
    document.body.classList.toggle('dark', isDark);
    setThemeIcon(isDark);

    // spin animation on click
    themeBtn.style.transition = 'transform .5s cubic-bezier(0.34,1.56,0.64,1)';
    themeBtn.style.transform = 'scale(1.15) rotate(360deg)';
    setTimeout(() => { themeBtn.style.transform = ''; }, 500);
});

/* ── SNAKE ── */
(function () {
    const canvas  = document.getElementById('snake-canvas');
    const overlay = document.getElementById('game-overlay');
    const startBtn = document.getElementById('game-start-btn');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const CELL = 18;
    let cols, rows, snake, dir, nextDir, food, fruits, grow, score, hi, running, paused, raf, speed;

    // ── FRUIT TYPES ──────────────────────────────────────────
    // idx 0 = comida normal (sempre presente)
    // idx 1–4 = frutas bônus (aparecem por probabilidade, somem com TTL)
    //
    //  spawn chance = probabilidade de aparecer ao comer comida normal
    //  ttlBase      = duração base em ticks (moves)
    //  ttlRand      = variação aleatória extra
    // ─────────────────────────────────────────────────────────
    const FRUIT_TYPES = [
        // 0 — normal (sempre presente)
        { color: '#F3EEEA', glow: 'rgba(243,238,234,0.35)', pts: 10,  grow: 2, size: 0.28, label: null,   spawnChance: 1.00, ttlBase: 0,  ttlRand: 0  },
        // 1 — laranja  +30   (20% de chance, dura ~6s)
        { color: '#e07b54', glow: 'rgba(224,123,84,0.45)',  pts: 30,  grow: 3, size: 0.32, label: '+30',  spawnChance: 0.20, ttlBase: 43, ttlRand: 6  },
        // 2 — azul     +50   (12% de chance, dura ~5s)
        { color: '#7ec8e3', glow: 'rgba(126,200,227,0.45)', pts: 50,  grow: 4, size: 0.34, label: '+50',  spawnChance: 0.12, ttlBase: 36, ttlRand: 4  },
        // 3 — roxo     +100  (6% de chance, dura ~4s)
        { color: '#c97fd4', glow: 'rgba(201,127,212,0.45)', pts: 100, grow: 5, size: 0.38, label: '+100', spawnChance: 0.06, ttlBase: 29, ttlRand: 3  },
        // 4 — amarela  +200  (2% de chance, dura ~3s — raríssima!)
        { color: '#f5d020', glow: 'rgba(245,208,32,0.60)',  pts: 200, grow: 6, size: 0.42, label: '★200', spawnChance: 0.02, ttlBase: 22, ttlRand: 2  },
    ];

    // Velocidade baseada no score com curva suave:
    // 0 pts   → 150ms (bem devagar no início)
    // 200 pts → ~130ms
    // 600 pts → ~105ms
    // 1000 pts → ~85ms
    // 1400 pts → ~70ms (NEON — rápido mas jogável)
    // mínimo absoluto: 55ms
    function calcSpeed(s) {
        return Math.max(55, Math.round(150 - Math.sqrt(s) * 2.1));
    }

    // ── TEMAS POR FASE (a cada 200 pts) ──────────────────────
    // bg       = cor de fundo do canvas
    // snake    = corpo da cobra
    // snakeH   = cabeça da cobra
    // grid     = cor da grade
    // text     = HUD
    // name     = label exibido na transição
    // ─────────────────────────────────────────────────────────
    const THEMES = [
        { bg: '#0a0a0a', snake: '#776B5D', snakeH: '#B0A695', grid: 'rgba(119,107,93,0.06)', text: '#B0A695', name: 'INÍCIO'    },
        { bg: '#0a0f1a', snake: '#3a7bd5', snakeH: '#7ec8e3', grid: 'rgba(58,123,213,0.08)', text: '#7ec8e3', name: 'OCEANO'    },
        { bg: '#0f0a1a', snake: '#8b3ab5', snakeH: '#c97fd4', grid: 'rgba(139,58,181,0.08)', text: '#c97fd4', name: 'GALÁXIA'   },
        { bg: '#1a0a0a', snake: '#b53a3a', snakeH: '#e07b54', grid: 'rgba(181,58,58,0.08)',  text: '#e07b54', name: 'INFERNO'   },
        { bg: '#0a1a0a', snake: '#2e7d32', snakeH: '#66bb6a', grid: 'rgba(46,125,50,0.08)',  text: '#66bb6a', name: 'FLORESTA'  },
        { bg: '#1a1500', snake: '#b8860b', snakeH: '#f5d020', grid: 'rgba(184,134,11,0.08)', text: '#f5d020', name: 'DOURADO'   },
        { bg: '#001a1a', snake: '#00838f', snakeH: '#4dd0e1', grid: 'rgba(0,131,143,0.08)',  text: '#4dd0e1', name: 'ABISSAL'   },
        { bg: '#1a001a', snake: '#ad1457', snakeH: '#f48fb1', grid: 'rgba(173,20,87,0.08)',  text: '#f48fb1', name: 'NEON'      },
    ];

    // Interpolação hex entre dois temas
    function hexToRgb(hex) {
        const r = parseInt(hex.slice(1,3),16);
        const g = parseInt(hex.slice(3,5),16);
        const b = parseInt(hex.slice(5,7),16);
        return [r, g, b];
    }
    function lerpColor(a, b, t) {
        const [r1,g1,b1] = hexToRgb(a);
        const [r2,g2,b2] = hexToRgb(b);
        const r = Math.round(r1 + (r2-r1)*t);
        const g = Math.round(g1 + (g2-g1)*t);
        const bl = Math.round(b1 + (b2-b1)*t);
        return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${bl.toString(16).padStart(2,'0')}`;
    }

    // Estado da transição de tema
    let themeProgress = 0;   // 0..1 — progresso da interpolação atual
    let lastThemeIdx  = 0;   // tema anterior
    let curThemeIdx   = 0;   // tema atual
    let themeFlash    = '';  // nome do tema para exibir brevemente

    function getThemeIdx(s) {
        return Math.floor(s / 200) % THEMES.length;
    }

    // Retorna as cores interpoladas entre lastTheme e curTheme
    function C_live() {
        const p = themeProgress;
        const A = THEMES[lastThemeIdx];
        const B = THEMES[curThemeIdx];
        if (p >= 1) return { bg: B.bg, snake: B.snake, snakeH: B.snakeH, text: B.text, grid: B.grid };
        return {
            bg:     lerpColor(A.bg,     B.bg,     p),
            snake:  lerpColor(A.snake,  B.snake,  p),
            snakeH: lerpColor(A.snakeH, B.snakeH, p),
            text:   B.text,   // texto muda imediatamente
            grid:   B.grid,
        };
    }

    // Checa se houve mudança de fase e dispara transição
    function checkTheme() {
        const idx = getThemeIdx(score);
        if (idx !== curThemeIdx) {
            lastThemeIdx  = curThemeIdx;
            curThemeIdx   = idx;
            themeProgress = 0;
            themeFlash    = THEMES[idx].name;
            setTimeout(() => { themeFlash = ''; }, 1800);
        }
        // Avança a interpolação (~0.06 por tick = ~8 ticks = ~1s de transição)
        if (themeProgress < 1) themeProgress = Math.min(1, themeProgress + 0.06);
    }

    const C = {
        bg:     '#0a0a0a',
        grid:   'rgba(119,107,93,0.06)',
        snake:  '#776B5D',
        snakeH: '#B0A695',
        text:   '#B0A695',
    };

    function resize() {
        const w = canvas.parentElement.clientWidth  || 320;
        const h = canvas.parentElement.clientHeight || 280;
        canvas.width  = Math.floor(w / CELL) * CELL;
        canvas.height = Math.floor(h / CELL) * CELL;
        cols = canvas.width  / CELL;
        rows = canvas.height / CELL;
    }

    function rndPos(exclude) {
        let pos, tries = 0;
        do {
            pos = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) };
            tries++;
        } while (
            tries < 200 && (
                snake.some(s => s.x === pos.x && s.y === pos.y) ||
                (exclude && exclude.some(f => f.x === pos.x && f.y === pos.y))
            )
        );
        return pos;
    }

    // Tenta spawnar cada tipo de fruta bônus com sua probabilidade individual
    function trySpawnFruits() {
        const occupied = [food, ...fruits];
        // Testa tipos 1–4 em ordem crescente de raridade
        for (let typeIdx = 1; typeIdx <= 4; typeIdx++) {
            const ft = FRUIT_TYPES[typeIdx];
            // Não spawna se já existe uma do mesmo tipo na tela
            if (fruits.some(f => f.typeIdx === typeIdx)) continue;
            // Rola o dado
            if (Math.random() < ft.spawnChance) {
                const pos = rndPos(occupied);
                const ttl = ft.ttlBase + Math.floor(Math.random() * ft.ttlRand);
                fruits.push({ ...pos, typeIdx, ttl, maxTtl: ttl });
                occupied.push(pos);
            }
        }
    }

    function init() {
        resize();
        const mx = Math.floor(cols / 2), my = Math.floor(rows / 2);
        snake   = [
            { x: mx,     y: my },
            { x: mx - 1, y: my },
            { x: mx - 2, y: my },
            { x: mx - 3, y: my },
            { x: mx - 4, y: my },
        ];
        dir     = { x: 1, y: 0 };
        nextDir = { x: 1, y: 0 };
        food    = rndPos([]);
        fruits  = [];
        grow    = 0;
        score   = 0;
        speed   = calcSpeed(0);
        hi      = hi || 0;
        // reset tema
        lastThemeIdx  = 0;
        curThemeIdx   = 0;
        themeProgress = 1;
        themeFlash    = '';
        paused        = false;
    }

    function drawGrid() {
        const cl = C_live();
        ctx.strokeStyle = cl.grid;
        ctx.lineWidth = .5;
        for (let x = 0; x <= cols; x++) {
            ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, canvas.height); ctx.stroke();
        }
        for (let y = 0; y <= rows; y++) {
            ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(canvas.width, y * CELL); ctx.stroke();
        }
    }

    function drawSnake() {
        const cl = C_live();
        snake.forEach((seg, i) => {
            const r = i === 0 ? 7 : 5;
            ctx.fillStyle = i === 0 ? cl.snakeH : cl.snake;
            ctx.globalAlpha = i === 0 ? 1 : Math.max(0.3, 1 - i * 0.03);
            roundRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2, r);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }

    function drawOneFruit(fx, fy, typeIdx, t, ttl, maxTtl) {
        const ft = FRUIT_TYPES[typeIdx];

        // Pisca nos últimos 40% do TTL — aviso visual de que vai sumir
        let alpha = 1;
        if (ttl !== undefined && maxTtl) {
            const ratio = ttl / maxTtl;
            if (ratio < 0.40) {
                alpha = 0.2 + 0.8 * Math.abs(Math.sin(t * 0.02));
            }
        }

        const pulse = 1 + Math.sin(t * 0.005 + typeIdx * 1.3) * 0.15;
        ctx.globalAlpha = alpha;

        // glow
        const grad = ctx.createRadialGradient(fx, fy, 0, fx, fy, CELL * pulse * 1.1);
        grad.addColorStop(0, ft.glow);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(fx, fy, CELL * pulse * 1.1, 0, Math.PI * 2); ctx.fill();

        // dot
        ctx.fillStyle = ft.color;
        ctx.beginPath(); ctx.arc(fx, fy, CELL * ft.size * pulse, 0, Math.PI * 2); ctx.fill();

        // label
        if (ft.label) {
            ctx.fillStyle = ft.color;
            ctx.font = `700 8px "JetBrains Mono", monospace`;
            ctx.textAlign = 'center';
            ctx.fillText(ft.label, fx, fy - CELL * ft.size * pulse - 3);
        }

        ctx.globalAlpha = 1;
    }

    function drawFoods(t) {
        drawOneFruit(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, 0, t, undefined, undefined);
        fruits.forEach(f => {
            drawOneFruit(f.x * CELL + CELL / 2, f.y * CELL + CELL / 2, f.typeIdx, t, f.ttl, f.maxTtl);
        });
    }

    function drawHUD() {
        const cl = C_live();
        ctx.fillStyle = cl.text;
        ctx.font = `600 11px "JetBrains Mono", monospace`;
        ctx.textAlign = 'left';
        ctx.fillText(`SCORE  ${String(score).padStart(4,'0')}`, 8, 16);
        ctx.textAlign = 'right';
        ctx.fillText(`BEST  ${String(hi).padStart(4,'0')}`, canvas.width - 8, 16);

        // Flash do nome da fase na transição
        if (themeFlash) {
            ctx.globalAlpha = 0.85;
            ctx.fillStyle = cl.snakeH;
            ctx.font = `900 ${Math.floor(canvas.width / 14)}px "Syne", sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText(themeFlash, canvas.width / 2, canvas.height / 2 + 6);
            ctx.globalAlpha = 1;
        }
    }

    function roundRect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    let lastMove = 0;
    function loop(t) {
        if (!running) return;
        raf = requestAnimationFrame(loop);

        // Se pausado, redesenha o frame estático sem avançar o jogo
        if (paused) {
            const cl = C_live();
            ctx.fillStyle = cl.bg;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            drawGrid();
            drawFoods(t);
            drawSnake();
            drawHUD();
            return;
        }

        const cl = C_live();
        ctx.fillStyle = cl.bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawGrid();
        drawFoods(t);
        drawSnake();
        drawHUD();

        if (t - lastMove < speed) return;
        lastMove = t;

        dir = { ...nextDir };
        const head = { x: (snake[0].x + dir.x + cols) % cols, y: (snake[0].y + dir.y + rows) % rows };

        // self collision
        if (snake.some(s => s.x === head.x && s.y === head.y)) {
            running = false;
            paused  = false;
            if (pauseOverlay) pauseOverlay.classList.remove('visible');
            if (pauseBtn)     pauseBtn.classList.remove('paused');
            if (pauseIcon)    pauseIcon.className = 'fa-solid fa-pause';
            if (monitor)      monitor.classList.remove('game-active');
            if (score > hi) hi = score;
            drawGameOver();
            return;
        }

        snake.unshift(head);

        // tick TTLs — remove frutas expiradas
        fruits = fruits.filter(f => { f.ttl--; return f.ttl > 0; });

        // check normal food
        if (head.x === food.x && head.y === food.y) {
            const ft = FRUIT_TYPES[0];
            score += ft.pts;
            grow  += ft.grow;
            food   = rndPos(fruits);
            speed  = calcSpeed(score);
            checkTheme();
            trySpawnFruits();
        }

        // check bonus fruits
        fruits = fruits.filter(f => {
            if (f.x === head.x && f.y === head.y) {
                const ft = FRUIT_TYPES[f.typeIdx];
                score += ft.pts;
                grow  += ft.grow;
                speed  = calcSpeed(score);
                checkTheme();
                return false;
            }
            return true;
        });

        // grow ou remove cauda
        if (grow > 0) { grow--; } else { snake.pop(); }
    }

    function drawGameOver() {
        const cl = C_live();
        ctx.fillStyle = 'rgba(10,10,10,0.75)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = cl.snakeH;
        ctx.font = `900 ${Math.floor(canvas.width / 10)}px "Syne", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 10);
        ctx.fillStyle = cl.text;
        ctx.font = `500 11px "JetBrains Mono", monospace`;
        ctx.fillText(`score ${score}  ·  press R or tap to restart`, canvas.width / 2, canvas.height / 2 + 20);
    }

    function startGame() {
        overlay && overlay.classList.add('hidden');
        if (dpad) dpad.classList.add('visible');
        monitor && monitor.classList.add('game-active');
        init();
        running = true;
        paused  = false;
        lastMove = 0;
        grow = 0;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(loop);
        canvas.focus();
    }

    // ── D-PAD (declared before use) ──
    const dpad    = document.getElementById('dpad');
    const monitor = canvas.closest('.doom-monitor');
    const pauseOverlay = document.getElementById('pause-overlay');
    const pauseBtn     = document.getElementById('snake-pause-btn');
    const pauseIcon    = pauseBtn ? pauseBtn.querySelector('i') : null;

    function togglePause() {
        if (!running) return;
        paused = !paused;
        if (pauseOverlay) pauseOverlay.classList.toggle('visible', paused);
        if (pauseBtn)     pauseBtn.classList.toggle('paused', paused);
        if (pauseIcon)    pauseIcon.className = paused ? 'fa-solid fa-play' : 'fa-solid fa-pause';
        if (pauseBtn)     pauseBtn.setAttribute('title', paused ? 'Continuar (P)' : 'Pausar (P)');
        if (pauseBtn)     pauseBtn.setAttribute('aria-label', paused ? 'Continuar jogo' : 'Pausar jogo');
        // Ao retomar, reseta o lastMove para evitar salto de velocidade
        if (!paused) lastMove = 0;
    }

    pauseBtn && pauseBtn.addEventListener('click', togglePause);
    pauseBtn && pauseBtn.addEventListener('mouseenter', () => cur && cur.classList.add('big'));
    pauseBtn && pauseBtn.addEventListener('mouseleave', () => cur && cur.classList.remove('big'));
    const dpMap = {
        'dp-up':    { x: 0, y:-1 },
        'dp-down':  { x: 0, y: 1 },
        'dp-left':  { x:-1, y: 0 },
        'dp-right': { x: 1, y: 0 },
    };

    Object.entries(dpMap).forEach(([id, d]) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.addEventListener('touchstart', e => {
            e.preventDefault();
            if (!running) { startGame(); return; }
            if (paused) { togglePause(); return; }
            if (d.x !== -dir.x || d.y !== -dir.y) nextDir = d;
        }, { passive: false });
        btn.addEventListener('mousedown', e => {
            e.preventDefault();
            if (!running) { startGame(); return; }
            if (paused) { togglePause(); return; }
            if (d.x !== -dir.x || d.y !== -dir.y) nextDir = d;
        });
    });

    // controls
    const DIRS = {
        ArrowUp:    { x: 0, y:-1 }, ArrowDown:  { x: 0, y: 1 },
        ArrowLeft:  { x:-1, y: 0 }, ArrowRight: { x: 1, y: 0 },
        w: { x: 0, y:-1 }, s: { x: 0, y: 1 },
        a: { x:-1, y: 0 }, d: { x: 1, y: 0 },
        W: { x: 0, y:-1 }, S: { x: 0, y: 1 },
        A: { x:-1, y: 0 }, D: { x: 1, y: 0 },
    };

    document.addEventListener('keydown', e => {
        // Pause com P ou Espaço
        if ((e.key === 'p' || e.key === 'P' || e.key === ' ') && running) {
            togglePause();
            e.preventDefault();
            return;
        }
        const d = DIRS[e.key];
        if (d) {
            // Retoma o jogo ao pressionar uma direção enquanto pausado
            if (paused) togglePause();
            if (d.x !== -dir.x || d.y !== -dir.y) nextDir = d;
            e.preventDefault();
        }
        if ((e.key === 'r' || e.key === 'R') && !running) startGame();
    });

    // touch swipe (fallback when not using dpad)
    let tx0, ty0;
    canvas.addEventListener('touchstart', e => { tx0 = e.touches[0].clientX; ty0 = e.touches[0].clientY; }, { passive: true });
    canvas.addEventListener('touchend', e => {
        if (!running) { startGame(); return; }
        const dx = e.changedTouches[0].clientX - tx0;
        const dy = e.changedTouches[0].clientY - ty0;
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
            // tap: despausar se pausado
            if (paused) { togglePause(); return; }
            return;
        }
        if (paused) return; // ignora swipe enquanto pausado
        let d;
        if (Math.abs(dx) > Math.abs(dy)) d = dx > 0 ? { x:1,y:0 } : { x:-1,y:0 };
        else d = dy > 0 ? { x:0,y:1 } : { x:0,y:-1 };
        if (d.x !== -dir.x || d.y !== -dir.y) nextDir = d;
    }, { passive: true });

    // start button
    startBtn && startBtn.addEventListener('click', startGame);

    // cursor
    startBtn && startBtn.addEventListener('mouseenter', () => cur.classList.add('big'));
    startBtn && startBtn.addEventListener('mouseleave', () => cur.classList.remove('big'));

    // idle draw
    resize();
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
    new ResizeObserver(() => {
        resize();
        if (!running) { ctx.fillStyle = C.bg; ctx.fillRect(0,0,canvas.width,canvas.height); }
    }).observe(canvas.parentElement);
})();

function animCount(el, target, duration = 1200) {
    let start = null;
    function step(ts) {
        if (!start) start = ts;
        const p = Math.min((ts - start) / duration, 1);
        el.textContent = Math.floor(p * target);
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = target;
    }
    requestAnimationFrame(step);
}

const expNum = document.querySelector('.bc-exp .bc-pad-sm [style*="42px"]');
if (expNum) {
    const obs = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) { animCount(expNum, 2); obs.disconnect(); }
    }, { threshold: 0.5 });
    obs.observe(expNum);
}

/* ── CONTACT FORM (jQuery + WhatsApp) ── */
$(function () {
    const WPP_NUMBER = '5543988080637'; // +55 43 98808-0637

    // cursor nos campos
    $('#contact-form input, #contact-form select, #contact-form textarea, #contact-form button')
        .on('mouseenter', () => cur.classList.add('big'))
        .on('mouseleave', () => cur.classList.remove('big'));

    // validação inline
    function setField($el, valid) {
        $el.css({
            'border-color': valid ? 'rgba(119,107,93,0.4)' : '#c0392b',
            'box-shadow':   valid ? '' : '0 0 0 3px rgba(192,57,43,0.1)'
        });
    }

    $('#f-name, #f-email, #f-msg').on('blur', function () {
        const id  = this.id;
        const val = $(this).val().trim();
        if (id === 'f-email') {
            setField($(this), /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val));
        } else {
            setField($(this), val.length > 0);
        }
    }).on('input', function () {
        $(this).css({ 'border-color': '', 'box-shadow': '' });
    });

    // submit
    $('#contact-form').on('submit', function (e) {
        e.preventDefault();

        const name    = $('#f-name').val().trim();
        const email   = $('#f-email').val().trim();
        const msg     = $('#f-msg').val().trim();
        const company = $('#f-company').val().trim();
        const type    = $('#f-type').val() || 'Não especificado';
        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        // validação
        if (!name)    { setField($('#f-name'),  false); return; }
        if (!emailOk) { setField($('#f-email'), false); return; }
        if (!msg)     { setField($('#f-msg'),   false); return; }

        // loading
        $('#btn-envia-wpp').addClass('loading');
        $('#submit-text').html('<i class="fa-solid fa-spinner fa-spin"></i> Enviando...');

        // monta mensagem
        const texto = [
            `*Olá Matheus! Vim pelo seu portfólio* 👋`,
            ``,
            `*Nome:* ${name}`,
            company ? `*Empresa:* ${company}` : null,
            `*E-mail:* ${email}`,
            `*Tipo:* ${type}`,
            ``,
            `*Mensagem:*`,
            msg
        ].filter(l => l !== null).join('\n');

        const wppUrl = `https://wa.me/${WPP_NUMBER}?text=${encodeURIComponent(texto)}`;
        const smsUrl = `sms:+${WPP_NUMBER}?body=${encodeURIComponent(texto)}`;

        setTimeout(function () {
            // tenta abrir WhatsApp
            const wppWin = window.open(wppUrl, '_blank');

            // se o browser bloqueou o popup ou não abriu, fallback SMS
            if (!wppWin || wppWin.closed || typeof wppWin.closed === 'undefined') {
                window.location.href = smsUrl;
            }

            // mostra sucesso
            $('#contact-form').fadeOut(300, function () {
                $('#form-success').css('display', 'flex').hide().fadeIn(400);
            });
        }, 700);
    });
});

/* ── FOOTER LOGO EASTER EGG ── */
(function () {
    const logo = document.getElementById('footer-logo');
    if (!logo) return;

    const COLORS = ['#e07b54','#7ec8e3','#c97fd4','#f5d020','#66bb6a','#f48fb1','#4dd0e1','#B0A695'];
    let busy = false;

    function spawnConfetti(originX, originY) {
        const count = 38;
        for (let i = 0; i < count; i++) {
            const dot = document.createElement('div');
            dot.className = 'confetti-dot';

            const angle  = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.4;
            const dist   = 80 + Math.random() * 120;
            const tx     = Math.cos(angle) * dist;
            const ty     = Math.sin(angle) * dist - 60; // sobe um pouco
            const rot    = (Math.random() * 720 - 360) + 'deg';
            const dur    = (0.8 + Math.random() * 0.6).toFixed(2) + 's';
            const color  = COLORS[Math.floor(Math.random() * COLORS.length)];
            const size   = (5 + Math.random() * 6).toFixed(1) + 'px';

            dot.style.cssText = `
                left:${originX}px; top:${originY}px;
                background:${color};
                width:${size}; height:${size};
                --tx:${tx}px; --ty:${ty}px;
                --rot:${rot}; --dur:${dur};
                --ease:cubic-bezier(0.16,1,0.3,1);
            `;
            document.body.appendChild(dot);
            setTimeout(() => dot.remove(), parseFloat(dur) * 1000 + 100);
        }
    }

    logo.addEventListener('click', function (e) {
        if (busy) return;
        busy = true;

        // glitch no texto
        logo.classList.add('glitch');
        setTimeout(() => logo.classList.remove('glitch'), 520);

        // confetti a partir do centro do logo
        const r = logo.getBoundingClientRect();
        spawnConfetti(r.left + r.width / 2, r.top + r.height / 2);

        // cursor big
        cur && cur.classList.add('big');
        setTimeout(() => {
            cur && cur.classList.remove('big');
            busy = false;
        }, 600);
    });

    logo.addEventListener('mouseenter', () => cur && cur.classList.add('big'));
    logo.addEventListener('mouseleave', () => cur && cur.classList.remove('big'));
})();

/* ── SNAKE LEGEND MODAL ── */
(function () {
    const btn      = document.getElementById('snake-legend-btn');
    const backdrop = document.getElementById('snake-modal-backdrop');
    const closeBtn = document.getElementById('snake-modal-close');
    if (!btn || !backdrop) return;

    function openModal() {
        backdrop.classList.add('open');
        document.body.style.overflow = 'hidden';
        closeBtn.focus();
    }

    function closeModal() {
        backdrop.classList.remove('open');
        document.body.style.overflow = '';
        btn.focus();
    }

    btn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);

    // Fecha ao clicar no backdrop
    backdrop.addEventListener('click', e => {
        if (e.target === backdrop) closeModal();
    });

    // Fecha com ESC
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && backdrop.classList.contains('open')) closeModal();
    });

    // Cursor
    btn.addEventListener('mouseenter', () => cur && cur.classList.add('big'));
    btn.addEventListener('mouseleave', () => cur && cur.classList.remove('big'));
    closeBtn.addEventListener('mouseenter', () => cur && cur.classList.add('big'));
    closeBtn.addEventListener('mouseleave', () => cur && cur.classList.remove('big'));
})();

/* ── SNAKE FULLSCREEN ── */
(function () {
    const fsBtn  = document.getElementById('snake-fullscreen-btn');
    const monitor = document.querySelector('.doom-monitor');
    if (!fsBtn || !monitor) return;

    const fsIcon = fsBtn.querySelector('i');

    function enterFullscreen() {
        if (monitor.requestFullscreen) {
            monitor.requestFullscreen();
        } else if (monitor.webkitRequestFullscreen) {
            monitor.webkitRequestFullscreen();
        } else if (monitor.mozRequestFullScreen) {
            monitor.mozRequestFullScreen();
        } else if (monitor.msRequestFullscreen) {
            monitor.msRequestFullscreen();
        } else {
            // Fallback CSS para browsers sem suporte à API
            monitor.classList.add('snake-fullscreen');
            document.body.style.overflow = 'hidden';
            fsIcon.className = 'fa-solid fa-compress';
            fsBtn.setAttribute('title', 'Sair da tela cheia');
            fsBtn.setAttribute('aria-label', 'Sair da tela cheia');
            // Dispara resize do canvas
            window.dispatchEvent(new Event('resize'));
        }
    }

    function exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        } else {
            // Fallback CSS
            monitor.classList.remove('snake-fullscreen');
            document.body.style.overflow = '';
            fsIcon.className = 'fa-solid fa-expand';
            fsBtn.setAttribute('title', 'Tela cheia');
            fsBtn.setAttribute('aria-label', 'Tela cheia');
            window.dispatchEvent(new Event('resize'));
        }
    }

    fsBtn.addEventListener('click', () => {
        const isFs = document.fullscreenElement ||
                     document.webkitFullscreenElement ||
                     document.mozFullScreenElement ||
                     document.msFullscreenElement ||
                     monitor.classList.contains('snake-fullscreen');

        if (isFs) {
            exitFullscreen();
        } else {
            enterFullscreen();
        }
    });

    // Atualiza ícone e canvas ao entrar/sair via API nativa
    function onFsChange() {
        const isFs = document.fullscreenElement ||
                     document.webkitFullscreenElement ||
                     document.mozFullScreenElement ||
                     document.msFullscreenElement;

        if (isFs) {
            fsIcon.className = 'fa-solid fa-compress';
            fsBtn.setAttribute('title', 'Sair da tela cheia');
            fsBtn.setAttribute('aria-label', 'Sair da tela cheia');
        } else {
            fsIcon.className = 'fa-solid fa-expand';
            fsBtn.setAttribute('title', 'Tela cheia');
            fsBtn.setAttribute('aria-label', 'Tela cheia');
            monitor.classList.remove('snake-fullscreen');
            document.body.style.overflow = '';
        }
        // Força o canvas a recalcular tamanho
        setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
    }

    document.addEventListener('fullscreenchange',       onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    document.addEventListener('mozfullscreenchange',    onFsChange);
    document.addEventListener('MSFullscreenChange',     onFsChange);

    // Sai do fullscreen CSS com ESC
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && monitor.classList.contains('snake-fullscreen')) {
            exitFullscreen();
        }
    });

    // Cursor
    fsBtn.addEventListener('mouseenter', () => cur && cur.classList.add('big'));
    fsBtn.addEventListener('mouseleave', () => cur && cur.classList.remove('big'));
})();

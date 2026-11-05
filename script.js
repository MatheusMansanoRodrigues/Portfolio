(() => {
'use strict';

/* ================================================================
   CONFIG
   ================================================================ */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile      = () => window.innerWidth < 768;
const isFinePtr     = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

/* ================================================================
   CURSOR DO USUÁRIO — estilo Figma
   ================================================================ */
const userCursorEl = document.getElementById('cursor');
const cursorLabel  = document.getElementById('cursor-label');
let ux = window.innerWidth / 2, uy = window.innerHeight / 2;
let tx = ux, ty = uy;

if (isFinePtr && !reducedMotion) {
    document.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });

    const tickCursor = () => {
        ux += (tx - ux) * 0.22;
        uy += (ty - uy) * 0.22;
        userCursorEl.style.transform = `translate(${ux}px,${uy}px) translate(-50%,-50%)`;
        requestAnimationFrame(tickCursor);
    };
    tickCursor();

    document.querySelectorAll('a,button,[role=button]').forEach(el => {
        el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
        el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });

    // label do cursor nos cards
    document.querySelectorAll('.work-card').forEach(card => {
        const name = card.querySelector('.work-name');
        card.addEventListener('mouseenter', () => {
            if (!name) return;
            cursorLabel.textContent = name.textContent.toUpperCase();
            userCursorEl.classList.add('has-label');
        });
        card.addEventListener('mouseleave', () => userCursorEl.classList.remove('has-label'));
    });
}

/* ================================================================
   CANVAS
   ================================================================ */
const canvas = document.getElementById('bg-canvas');
const ctx    = canvas.getContext('2d');
let W, H;

const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
resize();
window.addEventListener('resize', resize, { passive: true });

/* ================================================================
   AGENTES — cursores colaborativos
   ================================================================ */
const AGENT_COLORS = [
    { name: 'Ana',     hex: '#3b82f6', r: 59,  g: 130, b: 246 },
    { name: 'Carlos',  hex: '#a855f7', r: 168, g: 85,  b: 247 },
    { name: 'Julia',   hex: '#22c55e', r: 34,  g: 197, b: 94  },
    { name: 'Dev',     hex: '#f59e0b', r: 245, g: 158, b: 11  },
];

// Fases do agente
const PHASE = { IDLE: 0, MOVING: 1, SELECTING: 2, DRAWING: 3, WAITING: 4 };

class Agent {
    constructor(color, index) {
        this.color  = color;
        this.index  = index;
        this.x      = Math.random() * W;
        this.y      = Math.random() * H;
        this.tx     = this.x; // target x
        this.ty     = this.y; // target y
        this.phase  = PHASE.IDLE;
        this.timer  = 60 + Math.random() * 120;
        this.speed  = 14 + Math.random() * 8;

        // seleção sendo desenhada
        this.selX   = 0; this.selY  = 0;
        this.selW   = 0; this.selH  = 0;
        this.selProgress = 0; // 0→1

        // bloco já construído
        this.builtBlocks = [];

        // label flutuante
        this.labelAlpha = 0;
        this.labelText  = '';

        // elemento alvo
        this.targetEl   = null;
        this.targetRect = null;

        // trail do cursor
        this.trail = [];
    }

    // Vai até um elemento da página
    aimAtElement(el) {
        const r = el.getBoundingClientRect();
        this.targetEl   = el;
        this.targetRect = r;
        this.tx = r.left + r.width  * (.15 + Math.random() * .7);
        this.ty = r.top  + r.height * (.15 + Math.random() * .7);
        this.phase = PHASE.MOVING;
        this.labelText = this.color.name;
    }

    update(agents) {
        this.timer--;

        // trail
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 12) this.trail.shift();

        switch (this.phase) {

            case PHASE.IDLE:
                if (this.timer <= 0) {
                    // Só elementos ainda não construídos e dentro da viewport atual
                    // Evita containers genéricos (about-right, about-grid) — só elementos com conteúdo real
                    const targets = Array.from(document.querySelectorAll(
                        '.hero-badge, .hero-word, .hero-role, .hero-actions, .work-card, .about-left, .code-card, .stat-card, .contact-title, .section-head'
                    )).filter(el => {
                        if (el.classList.contains('agent-built')) return false;
                        const r = el.getBoundingClientRect();
                        // visível na tela + tamanho mínimo real
                        return r.top >= -40 && r.bottom <= window.innerHeight + 40
                            && r.width > 40 && r.height > 20;
                    });
                    if (targets.length) {
                        this.aimAtElement(targets[Math.floor(Math.random() * targets.length)]);
                    }
                    this.timer = 30 + Math.random() * 40;
                }
                break;

            case PHASE.MOVING: {
                const dx = this.tx - this.x;
                const dy = this.ty - this.y;
                const d  = Math.hypot(dx, dy);
                if (d < 3) {
                    this.x = this.tx; this.y = this.ty;
                    this.phase = PHASE.SELECTING;
                    this.selProgress = 0;
                    // Recalcula o rect agora (pode ter scrollado)
                    if (this.targetEl) {
                        const r = this.targetEl.getBoundingClientRect();
                        // Se o elemento saiu da tela, abandona
                        if (r.top < -60 || r.bottom > window.innerHeight + 60) {
                            this.phase = PHASE.IDLE;
                            this.timer = 10;
                            this.targetEl = null;
                            break;
                        }
                        this.targetRect = r;
                        this.selX = r.left   - 4;
                        this.selY = r.top    - 4;
                        this.selW = r.width  + 8;
                        this.selH = r.height + 8;
                    }
                    this.labelAlpha = 1;
                } else {
                    this.x += (dx / d) * Math.min(this.speed, d);
                    this.y += (dy / d) * Math.min(this.speed, d);
                    // Atualiza target se scrollou
                    if (this.targetEl) {
                        const r = this.targetEl.getBoundingClientRect();
                        this.tx = r.left + r.width  * (.15 + Math.random() * .001);
                        this.ty = r.top  + r.height * (.15 + Math.random() * .001);
                    }
                }
                break;
            }

            case PHASE.SELECTING:
                this.selProgress = Math.min(1, this.selProgress + 0.12);
                if (this.selProgress >= 1) {
                    this.phase = PHASE.DRAWING;
                    this.timer = 20;
                    // Dispara a revelação do elemento alvo
                    if (this.targetEl && !this.targetEl.classList.contains('agent-built')) {
                        this.targetEl.classList.add('agent-built');
                        this.targetEl.classList.add('revealed');
                    }
                }
                break;

            case PHASE.DRAWING:
                if (this.timer <= 0) {
                    this.phase = PHASE.WAITING;
                    this.timer = 40 + Math.random() * 40;
                    this.labelAlpha = 0;
                }
                break;

            case PHASE.WAITING:
                this.labelAlpha *= 0.95;
                if (this.timer <= 0) {
                    this.phase = PHASE.IDLE;
                    this.timer = 15 + Math.random() * 25;
                    this.targetEl = null;
                }
                break;
        }
    }

    draw() {
        const { r, g, b } = this.color;        const alpha = this.phase === PHASE.IDLE ? 0.4 : 0.95;

        // trail
        this.trail.forEach((pt, i) => {
            const a = (i / this.trail.length) * 0.25 * alpha;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
            ctx.fill();
        });

        // seleção sendo desenhada
        if ((this.phase === PHASE.SELECTING || this.phase === PHASE.DRAWING) && this.targetEl) {
            // Atualiza posição em tempo real (scroll move o elemento)
            const rect = this.targetEl.getBoundingClientRect();
            this.selX = rect.left   - 4;
            this.selY = rect.top    - 4;
            this.selW = rect.width  + 8;
            this.selH = rect.height + 8;

            const p  = this.selProgress;
            const sx = this.selX, sy = this.selY;
            const sw = this.selW * p, sh = this.selH * p;

            ctx.save();
            ctx.strokeStyle = `rgba(${r},${g},${b},${0.7 * p})`;
            ctx.fillStyle   = `rgba(${r},${g},${b},${0.06 * p})`;
            ctx.lineWidth   = 1.5;
            ctx.setLineDash([4, 3]);

            ctx.fillRect(sx, sy, sw, sh);
            ctx.strokeRect(sx, sy, sw, sh);
            ctx.setLineDash([]);

            // Cantos de seleção
            if (p > 0.5) {
                const cs = 8;
                const pa = (p - .5) * 2;
                ctx.lineWidth = 2;
                ctx.strokeStyle = `rgba(${r},${g},${b},${pa})`;
                drawCorner(ctx, sx,      sy,      cs,  1,  1);
                drawCorner(ctx, sx + sw, sy,      cs, -1,  1);
                drawCorner(ctx, sx,      sy + sh, cs,  1, -1);
                drawCorner(ctx, sx + sw, sy + sh, cs, -1, -1);

                // Label de dimensão
                if (p > 0.8) {
                    ctx.fillStyle = `rgba(${r},${g},${b},${(p - .8) * 5})`;
                    ctx.font = 'bold 9px Inter, sans-serif';
                    ctx.fillText(
                        `${Math.round(this.selW)} × ${Math.round(this.selH)}`,
                        sx + 4, sy - 6
                    );
                }
            }
            ctx.restore();
        }

        // Cursor arrow
        drawArrow(ctx, this.x, this.y, r, g, b, alpha);

        // Label do agente
        if (this.labelAlpha > 0.02) {
            ctx.save();
            ctx.fillStyle   = `rgba(${r},${g},${b},${this.labelAlpha})`;
            ctx.font        = 'bold 10px Inter, sans-serif';
            ctx.fillText(this.labelText, this.x + 14, this.y + 22);
            // fundo da label
            const tw = ctx.measureText(this.labelText).width;
            ctx.fillStyle = `rgba(${r},${g},${b},${this.labelAlpha * 0.15})`;
            ctx.fillRect(this.x + 11, this.y + 12, tw + 6, 13);
            ctx.restore();
        }
    }
}

function drawCorner(ctx, x, y, size, dx, dy) {
    ctx.beginPath();
    ctx.moveTo(x + dx * size, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + dy * size);
    ctx.stroke();
}

function drawArrow(ctx, x, y, r, g, b, alpha) {
    ctx.save();
    ctx.fillStyle   = `rgba(${r},${g},${b},${alpha})`;
    ctx.strokeStyle = `rgba(0,0,0,${alpha * 0.6})`;
    ctx.lineWidth   = 1;
    // seta tipo cursor do SO
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
    ctx.restore();
}

/* ================================================================
   PARTÍCULAS BG
   ================================================================ */
class BgParticle {
    constructor() { this.reset(true); }
    reset(cold) {
        this.x  = Math.random() * W;
        this.y  = cold ? Math.random() * H : (Math.random() > .5 ? -4 : H + 4);
        this.vx = (Math.random() - .5) * .12;
        this.vy = (Math.random() - .5) * .12;
        this.r  = Math.random() * 1.2 + .4;
        this.a  = Math.random() * .08 + .02;
    }
    update() {
        this.x += this.vx; this.y += this.vy;
        if (this.x < -6 || this.x > W + 6 || this.y < -6 || this.y > H + 6) this.reset(false);
    }
}

const PART_COUNT = isMobile() ? 20 : 50;
const particles  = Array.from({ length: PART_COUNT }, () => new BgParticle());

/* ================================================================
   AGENTES INIT
   ================================================================ */
const NUM_AGENTS = isMobile() ? 2 : 4;
const agents = AGENT_COLORS.slice(0, NUM_AGENTS).map((c, i) => new Agent(c, i));

// Escalonar os agentes para não agirem todos ao mesmo tempo
agents.forEach((a, i) => { a.timer = 5 + i * 20; });

/* ================================================================
   LOOP PRINCIPAL
   ================================================================ */
const loop = () => {
    ctx.clearRect(0, 0, W, H);

    // Fundo partículas
    particles.forEach(p => {
        p.update();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59,130,246,${p.a})`;
        ctx.fill();
    });

    // Conexões
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const d  = Math.hypot(dx, dy);
            if (d < 100) {
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.strokeStyle = `rgba(59,130,246,${(1 - d / 100) * 0.035})`;
                ctx.lineWidth   = 0.6;
                ctx.stroke();
            }
        }
    }

    // Agentes
    if (!reducedMotion) {
        agents.forEach(a => {
            a.update(agents);
            a.draw();
        });
    }

    requestAnimationFrame(loop);
};
loop();

/* ================================================================
   BUILD INICIAL — agentes constroem o hero sequencialmente
   ================================================================ */
if (!reducedMotion) {
    // Nav aparece rápido
    setTimeout(() => {
        const nav = document.querySelector('.nav-inner');
        if (nav) nav.classList.add('build-done');
    }, 200);

    // Hero: cada agente vai até um elemento em sequência
    const heroTargets = [
        '.hero-badge',
        '.hero-word:first-child',
        '.hero-word.hero-word--dim',
        '.hero-role',
        '.hero-actions',
    ];

    heroTargets.forEach((sel, i) => {
        const el = document.querySelector(sel);
        if (!el) return;
        const agent = agents[i % agents.length];
        setTimeout(() => {
            if (!el.classList.contains('agent-built')) {
                agent.aimAtElement(el);
            }
        }, 200 + i * 180);
    });

} else {
    // Sem animação: tudo visível de imediato
    document.querySelectorAll('.nav-inner').forEach(el => el.classList.add('build-done'));
    document.querySelectorAll('[data-reveal]').forEach(el => {
        el.classList.add('revealed');
        el.classList.add('agent-built');
    });
}

/* ================================================================
   SCROLL REVEAL + DECONSTRUCT — agentes constroem e desconstroem
   ================================================================ */
const revealEls = document.querySelectorAll('[data-reveal]');

revealEls.forEach(el => {
    const delay = el.dataset.delay ? parseInt(el.dataset.delay, 10) : 0;
    el.style.transitionDelay = delay + 'ms';
});

// Agenda um agente para construir o elemento
function agentBuild(el) {
    if (reducedMotion || isMobile()) {
        el.classList.add('revealed');
        el.classList.add('agent-built');
        return;
    }
    const free = agents.find(a => a.phase === PHASE.IDLE || a.phase === PHASE.WAITING);
    if (free) {
        setTimeout(() => {
            // Verifica se ainda não foi construído por outro agente entretempos
            if (!el.classList.contains('agent-built')) {
                free.aimAtElement(el);
            }
        }, parseInt(el.dataset.delay || 0, 10));
    } else {
        // Sem agente livre: revela direto
        el.classList.add('revealed');
        el.classList.add('agent-built');
    }
}

// Destrói o elemento — some e reseta para poder ser reconstruído
function agentDestroy(el) {
    el.classList.remove('revealed');
    el.classList.remove('agent-built');
    el.classList.remove('agent-build-in');
    // Pequeno delay para a transição CSS sair suave
    el.style.transitionDelay = '0ms';
}

const revealIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            // Entrou na viewport — reconstrói se ainda não estiver construído
            if (!e.target.classList.contains('agent-built')) {
                agentBuild(e.target);
            }
        } else {
            // Saiu da viewport — descreconstrói para recriar ao voltar
            const r = e.target.getBoundingClientRect();
            // Só "destrói" se saiu pelo topo (usuário scrollou para baixo e voltou)
            // boundingRect.bottom < 0 significa que saiu pelo topo
            if (r.bottom < 0) {
                agentDestroy(e.target);
                // Restaura o delay original para a próxima reconstrução
                const delay = e.target.dataset.delay ? parseInt(e.target.dataset.delay, 10) : 0;
                e.target.style.transitionDelay = delay + 'ms';
            }
        }
    });
}, {
    threshold: 0.05,
    rootMargin: '0px 0px -10px 0px'
});

revealEls.forEach(el => revealIO.observe(el));

// Quando agente termina de "construir", revela o elemento CSS
const checkBuilt = setInterval(() => {
    document.querySelectorAll('.agent-built:not(.revealed)').forEach(el => {
        el.classList.add('revealed');
    });
}, 100);

/* ================================================================
   NAVBAR
   ================================================================ */
const navInner = document.querySelector('.nav-inner');
const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
const allSects = document.querySelectorAll('section[id]');

window.addEventListener('scroll', () => {
    navInner.classList.toggle('nav-scrolled', window.scrollY > 60);
}, { passive: true });

const sectionIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (!e.isIntersecting) return;
        navLinks.forEach(a =>
            a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id)
        );
    });
}, { threshold: .3 });
allSects.forEach(s => sectionIO.observe(s));

/* ================================================================
   MOBILE MENU
   ================================================================ */
const burger  = document.getElementById('nav-burger');
const mobMenu = document.getElementById('mob-menu');

const openMob = () => {
    burger.classList.add('open');
    burger.setAttribute('aria-expanded', 'true');
    mobMenu.style.display = 'flex';
    requestAnimationFrame(() => mobMenu.classList.add('open'));
    mobMenu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
};

const closeMob = () => {
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    mobMenu.classList.remove('open');
    mobMenu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setTimeout(() => { mobMenu.style.display = ''; }, 320);
};

burger.addEventListener('click', () =>
    mobMenu.classList.contains('open') ? closeMob() : openMob()
);
mobMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMob));

/* ================================================================
   SMOOTH SCROLL
   ================================================================ */
const navEl = document.getElementById('nav');
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        const offset = navEl.getBoundingClientRect().height + 20;
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
    });
});

/* ================================================================
   TILT 3D
   ================================================================ */
if (isFinePtr && !reducedMotion) {
    document.querySelectorAll('.work-card, .code-card, .stat-card').forEach(card => {
        const max = card.classList.contains('stat-card') ? 8 : 4;
        card.addEventListener('mousemove', e => {
            const r  = card.getBoundingClientRect();
            const nx = (e.clientX - r.left) / r.width  - .5;
            const ny = (e.clientY - r.top)  / r.height - .5;
            const ty = card.classList.contains('work-card') ? -6 : -3;
            card.style.transform = `translateY(${ty}px) rotateX(${ny * -max}deg) rotateY(${nx * max}deg)`;
        });
        card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
}

/* ================================================================
   DATA-SIZE label nos cards
   ================================================================ */
const setCardSizes = () => {
    document.querySelectorAll('.work-card').forEach(card => {
        const r = card.getBoundingClientRect();
        card.dataset.size = `${Math.round(r.width)} × ${Math.round(r.height)}`;
    });
};
setCardSizes();
window.addEventListener('resize', setCardSizes, { passive: true });

})();

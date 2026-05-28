/* ═══════════════════════════════════════════════════
   MATHEUS.DEV — SCRIPT PRINCIPAL
═══════════════════════════════════════════════════ */

/* ── LOADER ── */
(function () {
    const loader = document.getElementById('loader');
    const pct    = document.getElementById('loader-pct');
    let progress = 0;

    const tick = setInterval(() => {
        progress += Math.random() * 18;
        if (progress >= 100) {
            progress = 100;
            clearInterval(tick);
            pct.textContent = 100;

            setTimeout(() => {
                loader.classList.add('done');
                document.body.style.overflow = '';
                // dispara contadores de stat
                document.querySelectorAll('.stat-num[data-target]').forEach(el => {
                    animCount(el, parseInt(el.dataset.target), 1200);
                });
            }, 400);
        } else {
            pct.textContent = Math.floor(progress);
        }
    }, 80);

    document.body.style.overflow = 'hidden';
})();

/* ── ANIMCOUNT ── */
function animCount(el, target, duration) {
    let start;
    function step(ts) {
        if (!start) start = ts;
        const p = Math.min((ts - start) / duration, 1);
        el.textContent = Math.floor(p * target);
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = target;
    }
    requestAnimationFrame(step);
}

/* ── CUSTOM CURSOR ── */
const dot  = document.getElementById('cursor-dot');
const ring = document.getElementById('cursor-ring');
let ringX = 0, ringY = 0;
let curX = 0, curY = 0;

document.addEventListener('mousemove', e => {
    curX = e.clientX; curY = e.clientY;
    dot.style.left = curX + 'px';
    dot.style.top  = curY + 'px';
});

// Ring lags behind with lerp
;(function lerpRing() {
    ringX += (curX - ringX) * 0.12;
    ringY += (curY - ringY) * 0.12;
    ring.style.left = ringX + 'px';
    ring.style.top  = ringY + 'px';
    requestAnimationFrame(lerpRing);
})();

const hoverEls = 'button, a, .proj-item, .spill, .about-link, .modal-x, .nav-cta, .nav-link, .footer-logo, .send-btn, .btn-outline, .btn-accent';
document.querySelectorAll(hoverEls).forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('hover'));
    el.addEventListener('mouseleave', () => ring.classList.remove('hover'));
});

document.addEventListener('mousedown', () => ring.classList.add('click'));
document.addEventListener('mouseup',   () => ring.classList.remove('click'));

/* ── NAV SCROLL ── */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* ── MOBILE NAV ── */
(function () {
    const toggle = document.getElementById('nav-toggle');
    const mobile = document.getElementById('nav-mobile');
    if (!toggle || !mobile) return;

    function closeMenu() {
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        mobile.classList.remove('open');
        mobile.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    toggle.addEventListener('click', () => {
        const isOpen = mobile.classList.toggle('open');
        toggle.classList.toggle('open', isOpen);
        toggle.setAttribute('aria-expanded', String(isOpen));
        mobile.setAttribute('aria-hidden', String(!isOpen));
        document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    mobile.querySelectorAll('.nav-mobile-link').forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 900) closeMenu();
    });
})();

/* ═══════════════════════════════════════════════════
   HERO CANVAS — PARTICLE FIELD
   WebGL-like effect with Canvas 2D, no deps
═══════════════════════════════════════════════════ */
(function () {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W, H, mx = -999, my = -999;
    const particles = [];
    const COLS = ['255,77,0', '240,235,225', '136,136,136', '255,140,66'];
    const COUNT = 120;

    function resize() {
        W = canvas.width  = canvas.offsetWidth;
        H = canvas.height = canvas.offsetHeight;
    }

    class Particle {
        constructor() { this.reset(true); }
        reset(init) {
            this.x  = Math.random() * W;
            this.y  = init ? Math.random() * H : H + 10;
            this.ox = this.x;
            this.oy = this.y;
            this.vx = (Math.random() - 0.5) * 0.3;
            this.vy = -Math.random() * 0.4 - 0.1;
            this.size = Math.random() * 2.5 + 0.5;
            this.opacity = Math.random() * 0.6 + 0.1;
            this.color = COLS[Math.floor(Math.random() * COLS.length)];
            this.life = Math.random() * 0.005 + 0.001;
            this.age  = 0;
            this.maxAge = 200 + Math.random() * 300;
            this.connected = false;
        }
        update() {
            // Mouse repulsion
            const dx = this.x - mx;
            const dy = this.y - my;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120) {
                const force = (120 - dist) / 120;
                this.x += dx / dist * force * 2;
                this.y += dy / dist * force * 2;
            } else {
                this.x += (this.ox - this.x) * 0.02;
                this.y += (this.oy - this.y) * 0.02;
            }

            this.ox += this.vx;
            this.oy += this.vy;
            this.age++;

            if (this.age > this.maxAge || this.oy < -20) this.reset(false);
        }
        draw() {
            const alpha = this.opacity * Math.min(1, this.age / 30) * Math.min(1, (this.maxAge - this.age) / 30);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.color},${alpha})`;
            ctx.fill();
        }
    }

    function init() {
        resize();
        particles.length = 0;
        for (let i = 0; i < COUNT; i++) particles.push(new Particle());
    }

    let t = 0;
    function loop() {
        requestAnimationFrame(loop);
        t++;
        ctx.clearRect(0, 0, W, H);

        // Background gradient
        const grad = ctx.createRadialGradient(W * 0.6, H * 0.3, 0, W * 0.6, H * 0.3, W * 0.8);
        grad.addColorStop(0, 'rgba(255,77,0,0.04)');
        grad.addColorStop(1, 'rgba(10,10,10,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Connect nearby particles with lines
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const d  = Math.sqrt(dx * dx + dy * dy);
                if (d < 90) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(240,235,225,${0.06 * (1 - d / 90)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }

        particles.forEach(p => { p.update(); p.draw(); });

        // Scanline effect subtle
        if (t % 2 === 0) {
            const y = (t * 2) % H;
            ctx.fillStyle = 'rgba(255,77,0,0.015)';
            ctx.fillRect(0, y, W, 1);
        }
    }

    window.addEventListener('resize', () => { resize(); });
    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

    init();
    loop();
})();

/* ═══════════════════════════════════════════════════
   PROJECTS — MODAL
═══════════════════════════════════════════════════ */
const projects = [
    {
        title: 'Esfera 3D',
        img: 'assets/esfera_3d.webp',
        challenge: 'Processar coordenadas de rastreamento de mãos em tempo real no navegador sem causar gargalos na renderização 3D de alta contagem de polígonos.',
        solution: 'Processamento assíncrono via MediaPipe Hands com transferência direta dos tensores 3D para cena Three.js. Shaders de profundidade personalizados e suavização exponencial dupla nas coordenadas para eliminar tremores.',
        tags: ['JavaScript', 'Three.js', 'MediaPipe', 'WebGL', 'Canvas API'],
        url: 'https://matheusmansanorodrigues.github.io/esfera_3d/',
        git: 'https://github.com/matheusmansanorodrigues/esfera_3d'
    },
    {
        title: 'Ótica Horizonte',
        img: 'assets/otica_horizonte_h.webp',
        challenge: 'Criar agendamento e catálogos visuais com excelente performance sob conexões móveis limitadas, representando uma ótica real.',
        solution: 'Landing page estática modular sem frameworks para máximo controle de carregamento. Lazy loading agressivo de imagens e compressão em WebP. Score perfeito no Lighthouse de SEO e Acessibilidade.',
        tags: ['HTML5', 'CSS3', 'JavaScript', 'WebP', 'SEO'],
        url: 'https://matheusmansanorodrigues.github.io/otica_horizonte/',
        git: 'https://github.com/matheusmansanorodrigues/otica_horizonte'
    },
    {
        title: 'Gestor de Tarefas',
        img: 'assets/minhas_tarefas_h.webp',
        challenge: 'Gerenciar estados complexos de persistência e filtros em tempo real de forma extremamente leve, sem depender de servidores ou bibliotecas.',
        solution: 'Motor de tarefas assíncrono em Vanilla JS sob modelo MVC, LocalStorage para leitura e gravação instantânea. Delegação de eventos inteligente e debounce linear nas filtragens.',
        tags: ['JavaScript', 'MVC', 'LocalStorage', 'HTML5', 'CSS3'],
        url: 'https://matheusmansanorodrigues.github.io/Projeto-Tarefa/',
        git: 'https://github.com/matheusmansanorodrigues/Projeto-Tarefa'
    },
    {
        title: 'Tomo do Mestre',
        img: 'assets/tomo_mestre.webp',
        challenge: 'Estruturar um motor flexível que pudesse injetar, validar e renderizar múltiplos esquemas de RPG medievais sem requisições síncronas de servidor.',
        solution: 'Carregamento assíncrono modularizado de objetos RPG em JSON. Interface injeta dados em tempo real com transições suaves baseadas em variáveis CSS e design medieval refinado.',
        tags: ['JavaScript', 'JSON', 'CSS Variables', 'Async/Await'],
        url: 'https://matheusmansanorodrigues.github.io/Guia_RPG/',
        git: 'https://github.com/matheusmansanorodrigues/Guia_RPG'
    },
    {
        title: 'Nexus',
        img: 'assets/nexus.png',
        challenge: 'Projetar um portal ERP que combinasse dados operacionais complexos com uma estética premium, micro-interações fluídas e temas visuais totalmente dinâmicos.',
        solution: 'Dashboard administrativo com glassmorphism, motor de temas em tempo real e UX pensada para gestão diária. Módulos de BI, financeiro, vendas, estoque e CRM integrados em uma interface moderna e responsiva.',
        tags: ['JavaScript', 'CSS', 'Dashboard', 'ERP', 'Glassmorphism', 'UX'],
        url: 'https://matheusmansanorodrigues.github.io/NexusERP/',
        git: 'https://github.com/matheusmansanorodrigues/NexusERP'
    }
];

const projModalBg = document.getElementById('proj-modal-bg');
const closeProj   = document.getElementById('close-proj');

function openProjModal(idx) {
    const p = projects[idx];
    document.getElementById('pm-img').src = p.img;
    document.getElementById('pm-title').textContent = p.title;
    document.getElementById('pm-challenge').textContent = p.challenge;
    document.getElementById('pm-solution').textContent = p.solution;

    const tagsEl = document.getElementById('pm-tags');
    tagsEl.innerHTML = p.tags.map(t => `<span>${t}</span>`).join('');

    document.getElementById('pm-live').href = p.url;
    document.getElementById('pm-git').href  = p.git;

    projModalBg.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (closeProj) closeProj.focus();
}

function closeProjModal() {
    projModalBg.classList.remove('open');
    document.body.style.overflow = '';
}

document.querySelectorAll('.proj-item').forEach(item => {
    item.addEventListener('click', e => {
        if (e.target.closest('.proj-link')) return; // let link open normally
        openProjModal(parseInt(item.dataset.idx));
    });
});

closeProj && closeProj.addEventListener('click', closeProjModal);
projModalBg && projModalBg.addEventListener('click', e => {
    if (e.target === projModalBg) closeProjModal();
});

/* ═══════════════════════════════════════════════════
   CV MODAL
═══════════════════════════════════════════════════ */
const cvModalBg = document.getElementById('cv-modal-bg');
const closeCv   = document.getElementById('close-cv');
const openCvBtn = document.getElementById('open-cv');

function openCvModal()  { cvModalBg.classList.add('open'); document.body.style.overflow = 'hidden'; if (closeCv) closeCv.focus(); }
function closeCvModal() { cvModalBg.classList.remove('open'); document.body.style.overflow = ''; }

openCvBtn && openCvBtn.addEventListener('click', openCvModal);
closeCv   && closeCv.addEventListener('click', closeCvModal);
cvModalBg && cvModalBg.addEventListener('click', e => { if (e.target === cvModalBg) closeCvModal(); });

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeProjModal(); closeCvModal(); }
});

/* ═══════════════════════════════════════════════════
   CONTACT FORM → WhatsApp
═══════════════════════════════════════════════════ */
const WPP = '5543988080637';

document.getElementById('contact-form') && document.getElementById('contact-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const name    = document.getElementById('f-name').value.trim();
    const email   = document.getElementById('f-email').value.trim();
    const msg     = document.getElementById('f-msg').value.trim();
    const company = document.getElementById('f-company').value.trim();
    const type    = document.getElementById('f-type').value || 'Não especificado';

    if (!name || !email || !msg) {
        ['f-name','f-email','f-msg'].forEach(id => {
            const el = document.getElementById(id);
            if (!el.value.trim()) el.style.borderColor = '#ef4444';
        });
        return;
    }

    const text = [
        `*Olá Matheus! Vim pelo portfólio* 👋`,
        ``,
        `*Nome:* ${name}`,
        company ? `*Empresa:* ${company}` : null,
        `*E-mail:* ${email}`,
        `*Tipo:* ${type}`,
        ``,
        `*Mensagem:*`,
        msg
    ].filter(l => l !== null).join('\n');

    const url = `https://wa.me/${WPP}?text=${encodeURIComponent(text)}`;

    setTimeout(() => {
        window.open(url, '_blank');
        this.style.display = 'none';
        const success = document.getElementById('form-success');
        success.style.display = 'flex';
        success.style.animation = 'fadeUp .6s var(--ease) forwards';
    }, 300);

    const btn = this.querySelector('.send-btn');
    const txt = btn.querySelector('.send-text');
    txt.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';
    btn.disabled = true;
});

/* Remove error border on input */
['f-name','f-email','f-msg'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => el.style.borderColor = '');
});

/* ═══════════════════════════════════════════════════
   3D CARD MOUSE TILT
═══════════════════════════════════════════════════ */
const aboutCard = document.getElementById('about-card');
if (aboutCard) {
    aboutCard.addEventListener('mousemove', e => {
        const r = aboutCard.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width  / 2) / (r.width  / 2);
        const y = (e.clientY - r.top  - r.height / 2) / (r.height / 2);
        aboutCard.querySelector('.about-card').style.transform =
            `rotateY(${x * 12}deg) rotateX(${-y * 8}deg) scale(1.02)`;
    });
    aboutCard.addEventListener('mouseleave', () => {
        aboutCard.querySelector('.about-card').style.transform = '';
    });
}

/* ═══════════════════════════════════════════════════
   SCROLL REVEAL
═══════════════════════════════════════════════════ */
const revealObs = new IntersectionObserver(entries => {
    entries.forEach((e, i) => {
        if (e.isIntersecting) {
            // stagger siblings
            const siblings = e.target.parentElement.querySelectorAll('.reveal, .tl-item');
            let delay = 0;
            siblings.forEach(sib => {
                if (sib === e.target) {
                    sib.style.transitionDelay = delay + 'ms';
                }
                delay += 80;
            });
            e.target.classList.add('in');
            revealObs.unobserve(e.target);
        }
    });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal, .tl-item').forEach(el => revealObs.observe(el));

/* ═══════════════════════════════════════════════════
   NAV ACTIVE SECTION
═══════════════════════════════════════════════════ */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

const sectionObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const id = entry.target.id;
            navLinks.forEach(link => {
                const href = link.getAttribute('href').slice(1);
                link.style.color = href === id ? 'var(--cream)' : '';
            });
        }
    });
}, { threshold: 0.4 });

sections.forEach(s => sectionObs.observe(s));

/* ═══════════════════════════════════════════════════
   FOOTER EASTER EGG
═══════════════════════════════════════════════════ */
const footerLogo = document.getElementById('footer-logo');
if (footerLogo) {
    const COLORS = ['#FF4D00','#FF8C42','#22C55E','#06B6D4','#A855F7','#F5D020'];
    let locked = false;

    footerLogo.addEventListener('click', () => {
        if (locked) return;
        locked = true;

        const r = footerLogo.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top  + r.height / 2;

        for (let i = 0; i < 40; i++) {
            const el = document.createElement('div');
            const angle = (Math.PI * 2 / 40) * i;
            const dist  = 80 + Math.random() * 120;
            el.style.cssText = `
                position:fixed;left:${cx}px;top:${cy}px;
                width:${5 + Math.random() * 7}px;height:${5 + Math.random() * 7}px;
                border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
                background:${COLORS[Math.floor(Math.random() * COLORS.length)]};
                pointer-events:none;z-index:99999;
                transform:translate(-50%,-50%);
                animation:confettiFly ${0.7 + Math.random() * 0.6}s cubic-bezier(0.16,1,0.3,1) forwards;
                --tx:${Math.cos(angle) * dist}px;--ty:${Math.sin(angle) * dist - 60}px;
                --rot:${Math.random() * 720}deg;
            `;
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 1500);
        }

        // text glitch
        footerLogo.style.animation = 'none';
        footerLogo.style.filter = 'hue-rotate(90deg)';
        setTimeout(() => { footerLogo.style.filter = ''; locked = false; }, 700);
    });
}

// Inject confetti keyframe
const style = document.createElement('style');
style.textContent = `
    @keyframes confettiFly {
        to {
            transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) rotate(var(--rot)) scale(0);
            opacity: 0;
        }
    }
    @keyframes fadeUp {
        from { opacity:0; transform:translateY(20px); }
        to   { opacity:1; transform:translateY(0); }
    }
`;
document.head.appendChild(style);

/* ═══════════════════════════════════════════════════
   EMAIL COPY
═══════════════════════════════════════════════════ */
const copyEmailBtn = document.getElementById('copy-email');
if (copyEmailBtn) {
    copyEmailBtn.addEventListener('click', e => {
        e.preventDefault();
        navigator.clipboard.writeText('matheusmansano1@gmail.com').then(() => {
            const orig = copyEmailBtn.innerHTML;
            copyEmailBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Copiado!';
            copyEmailBtn.style.color = '#22C55E';
            copyEmailBtn.style.borderColor = '#22C55E';
            setTimeout(() => {
                copyEmailBtn.innerHTML = orig;
                copyEmailBtn.style.color = '';
                copyEmailBtn.style.borderColor = '';
            }, 2000);
        });
    });
}

/* ═══════════════════════════════════════════════════
   MAGNETIC EFFECT ON NAV-CTA
═══════════════════════════════════════════════════ */
const navCta = document.querySelector('.nav-cta');
if (navCta) {
    navCta.addEventListener('mousemove', e => {
        const r = navCta.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width  / 2) * 0.3;
        const y = (e.clientY - r.top  - r.height / 2) * 0.3;
        navCta.style.transform = `translate(${x}px, ${y}px) scale(1.04)`;
    });
    navCta.addEventListener('mouseleave', () => {
        navCta.style.transform = '';
    });
}

/* ═══════════════════════════════════════════════════
   PROJECT ITEMS — STAGGER REVEAL
═══════════════════════════════════════════════════ */
const projItems = document.querySelectorAll('.proj-item');
const projObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const items = document.querySelectorAll('.proj-item');
            items.forEach((item, i) => {
                item.style.opacity = '0';
                item.style.transform = 'translateX(-20px)';
                item.style.transition = `opacity .6s var(--ease) ${i * 100}ms, transform .6s var(--ease) ${i * 100}ms`;
                setTimeout(() => {
                    item.style.opacity = '1';
                    item.style.transform = 'translateX(0)';
                }, 50);
            });
            projObs.disconnect();
        }
    });
}, { threshold: 0.1 });

if (projItems[0]) projObs.observe(projItems[0]);

/* ═══════════════════════════════════════════════════
   PROJECT FLOAT PREVIEW — follows cursor on hover
═══════════════════════════════════════════════════ */
(function () {
    if (!window.matchMedia('(pointer: fine) and (min-width: 1025px)').matches) return;

    const float = document.createElement('div');
    float.className = 'proj-float';
    float.setAttribute('aria-hidden', 'true');
    float.innerHTML = '<img src="" alt="">';
    document.body.appendChild(float);

    const img = float.querySelector('img');
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let active = false;
    let rafId = null;

    const OFFSET_X = 36;
    const LERP = 0.14;

    function getSize() {
        const r = float.getBoundingClientRect();
        return { w: r.width || 480, h: r.height || 320 };
    }

    function setPos(x, y) {
        float.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }

    function clampPos(x, y) {
        const { w, h } = getSize();
        const pad = 16;
        return {
            x: Math.max(pad, Math.min(x, window.innerWidth - w - pad)),
            y: Math.max(pad, Math.min(y, window.innerHeight - h - pad)),
        };
    }

    function aim(e) {
        const { h } = getSize();
        const p = clampPos(e.clientX + OFFSET_X, e.clientY - h * 0.45);
        targetX = p.x;
        targetY = p.y;
    }

    function tick() {
        currentX += (targetX - currentX) * LERP;
        currentY += (targetY - currentY) * LERP;
        setPos(currentX, currentY);
        if (active) rafId = requestAnimationFrame(tick);
    }

    function show(item, e) {
        const src = item.querySelector('.proj-preview img')?.getAttribute('src');
        if (!src) return;

        img.src = src;
        img.alt = item.querySelector('.proj-info h3')?.textContent || '';
        active = true;
        float.classList.add('active');

        aim(e);
        currentX = targetX;
        currentY = targetY;
        setPos(currentX, currentY);

        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(tick);
    }

    function hide() {
        active = false;
        float.classList.remove('active');
        cancelAnimationFrame(rafId);
    }

    document.querySelectorAll('.proj-item').forEach(item => {
        item.addEventListener('mouseenter', e => show(item, e));
        item.addEventListener('mousemove', aim);
        item.addEventListener('mouseleave', hide);
    });
})();

/* ═══════════════════════════════════════════════════
   SMOOTH PARALLAX — handled in patch below
═══════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════
   CURSOR HIDE ON LEAVE
═══════════════════════════════════════════════════ */
document.addEventListener('mouseleave', () => {
    dot.style.opacity = '0';
    ring.style.opacity = '0';
});
document.addEventListener('mouseenter', () => {
    dot.style.opacity = '1';
    ring.style.opacity = '1';
});

/* ── SMOOTH PARALLAX — desativa em mobile para evitar overflow ── */
// (overrides original)
(function patchParallax() {
    const heroContent = document.querySelector('.hero-content');
    if (!heroContent) return;
    window.addEventListener('scroll', () => {
        if (window.innerWidth < 768) {
            heroContent.style.transform = '';
            heroContent.style.opacity  = '';
            return;
        }
        const scrolled = window.scrollY;
        heroContent.style.transform = `translateY(${scrolled * 0.25}px)`;
        heroContent.style.opacity   = 1 - scrolled / (window.innerHeight * 0.8);
    }, { passive: true });
})();

/* ── TOUCH TILT for about-card ── */
(function touchTilt() {
    const wrap = document.getElementById('about-card');
    if (!wrap) return;
    wrap.addEventListener('touchmove', e => {
        const touch = e.touches[0];
        const r = wrap.getBoundingClientRect();
        const x = (touch.clientX - r.left - r.width  / 2) / (r.width  / 2);
        const y = (touch.clientY - r.top  - r.height / 2) / (r.height / 2);
        wrap.querySelector('.about-card').style.transform =
            `rotateY(${x * 8}deg) rotateX(${-y * 6}deg) scale(1.01)`;
    }, { passive: true });
    wrap.addEventListener('touchend', () => {
        wrap.querySelector('.about-card').style.transform = '';
    });
})();

/* ── PREVENT iOS ZOOM on double-tap buttons ── */
document.querySelectorAll('button, a').forEach(el => {
    el.addEventListener('touchend', e => { e.preventDefault(); el.click(); }, { passive: false });
});
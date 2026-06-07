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
const dot = document.getElementById('cursor-dot');

document.addEventListener('mousemove', e => {
    dot.style.left = e.clientX + 'px';
    dot.style.top = e.clientY + 'px';
});

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
        toggle.setAttribute('aria-label', 'Abrir menu');
        mobile.classList.remove('open');
        mobile.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    toggle.addEventListener('click', () => {
        const isOpen = mobile.classList.toggle('open');
        toggle.classList.toggle('open', isOpen);
        toggle.setAttribute('aria-expanded', String(isOpen));
        toggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
        mobile.setAttribute('aria-hidden', String(!isOpen));
        document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    mobile.querySelectorAll('.nav-mobile-link').forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    mobile.querySelector('[data-open-cv]')?.addEventListener('click', () => {
        closeMenu();
        openCvModal();
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
        title: 'Wever',
        video: 'https://pub-91486f16a8e141ee830953618836f634.r2.dev/imgs/portfa_wever.mp4',
        challenge: 'Criar uma presença digital com impacto visual forte, navegação fluida e apresentação clara da marca, mantendo a experiência elegante em desktop e mobile.',
        solution: 'Interface responsiva com foco em direção visual, ritmo de animações e hierarquia de conteúdo. O resultado prioriza uma primeira impressão marcante e uma navegação simples até a ação principal.',
        tags: ['UI Design', 'Front-end', 'Responsivo', 'Brand Experience'],
        url: 'https://wever.work',
        git: ''
    },
    {
        title: 'Esfera 3D',
        img: 'https://pub-91486f16a8e141ee830953618836f634.r2.dev/imgs/esfera_3d.webp',
        challenge: 'Processar coordenadas de rastreamento de mãos em tempo real no navegador sem causar gargalos na renderização 3D de alta contagem de polígonos.',
        solution: 'Processamento assíncrono via MediaPipe Hands com transferência direta dos tensores 3D para cena Three.js. Shaders de profundidade personalizados e suavização exponencial dupla nas coordenadas para eliminar tremores.',
        tags: ['JavaScript', 'Three.js', 'MediaPipe', 'WebGL', 'Canvas API'],
        url: 'https://matheusmansanorodrigues.github.io/esfera_3d/',
        git: 'https://github.com/matheusmansanorodrigues/esfera_3d'
    },
    {
        title: 'Ótica Horizonte',
        img: 'https://pub-91486f16a8e141ee830953618836f634.r2.dev/imgs/otica_horizonte_h.webp',
        challenge: 'Criar agendamento e catálogos visuais com excelente performance sob conexões móveis limitadas, representando uma ótica real.',
        solution: 'Landing page estática modular sem frameworks para máximo controle de carregamento. Lazy loading agressivo de imagens e compressão em WebP. Score perfeito no Lighthouse de SEO e Acessibilidade.',
        tags: ['HTML5', 'CSS3', 'JavaScript', 'WebP', 'SEO'],
        url: 'https://matheusmansanorodrigues.github.io/otica_horizonte/',
        git: 'https://github.com/matheusmansanorodrigues/otica_horizonte'
    },
    {
        title: 'Gestor de Tarefas',
        img: 'https://pub-91486f16a8e141ee830953618836f634.r2.dev/imgs/minhas_tarefas_h.webp',
        challenge: 'Gerenciar estados complexos de persistência e filtros em tempo real de forma extremamente leve, sem depender de servidores ou bibliotecas.',
        solution: 'Motor de tarefas assíncrono em Vanilla JS sob modelo MVC, LocalStorage para leitura e gravação instantânea. Delegação de eventos inteligente e debounce linear nas filtragens.',
        tags: ['JavaScript', 'MVC', 'LocalStorage', 'HTML5', 'CSS3'],
        url: 'https://matheusmansanorodrigues.github.io/Projeto-Tarefa/',
        git: 'https://github.com/matheusmansanorodrigues/Projeto-Tarefa'
    },
    {
        title: 'Tomo do Mestre',
        img: 'https://pub-91486f16a8e141ee830953618836f634.r2.dev/imgs/tomo_mestre.webp',
        challenge: 'Estruturar um motor flexível que pudesse injetar, validar e renderizar múltiplos esquemas de RPG medievais sem requisições síncronas de servidor.',
        solution: 'Carregamento assíncrono modularizado de objetos RPG em JSON. Interface injeta dados em tempo real com transições suaves baseadas em variáveis CSS e design medieval refinado.',
        tags: ['JavaScript', 'JSON', 'CSS Variables', 'Async/Await'],
        url: 'https://matheusmansanorodrigues.github.io/Guia_RPG/',
        git: 'https://github.com/matheusmansanorodrigues/Guia_RPG'
    },
    {
        title: 'Nexus',
        img: 'https://pub-91486f16a8e141ee830953618836f634.r2.dev/imgs/nexus.png',
        challenge: 'Projetar um portal ERP que combinasse dados operacionais complexos com uma estética premium, micro-interações fluídas e temas visuais totalmente dinâmicos.',
        solution: 'Dashboard administrativo com glassmorphism, motor de temas em tempo real e UX pensada para gestão diária. Módulos de BI, financeiro, vendas, estoque e CRM integrados em uma interface moderna e responsiva.',
        tags: ['JavaScript', 'CSS', 'Dashboard', 'ERP', 'Glassmorphism', 'UX'],
        url: 'https://matheusmansanorodrigues.github.io/NexusERP/',
        git: 'https://github.com/matheusmansanorodrigues/NexusERP'
    }
];

const projModalBg = document.getElementById('proj-modal-bg');
const closeProj   = document.getElementById('close-proj');

function formatPlayerTime(seconds) {
    if (!Number.isFinite(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}

function mountProjectPlayer(mediaEl, project) {
    mediaEl.innerHTML = `
        <div class="project-player is-paused">
            <video class="project-player-video" src="${project.video}" muted loop playsinline preload="metadata"></video>
            <button class="project-player-hit" type="button" aria-label="Reproduzir video do projeto">
                <span><i class="fa-solid fa-play"></i></span>
            </button>
            <div class="project-player-controls">
                <button class="player-toggle" type="button" aria-label="Reproduzir ou pausar">
                    <i class="fa-solid fa-play"></i>
                </button>
                <div class="player-progress">
                    <div class="player-progress-fill"></div>
                    <input type="range" min="0" max="100" value="0" aria-label="Progresso do video">
                </div>
                <span class="player-time">00:00</span>
                <button class="player-mute" type="button" aria-label="Ativar ou desativar som">
                    <i class="fa-solid fa-volume-xmark"></i>
                </button>
                <button class="player-fullscreen" type="button" aria-label="Maximizar video">
                    <i class="fa-solid fa-expand"></i>
                </button>
            </div>
        </div>
    `;

    const player = mediaEl.querySelector('.project-player');
    const video = mediaEl.querySelector('.project-player-video');
    const hit = mediaEl.querySelector('.project-player-hit');
    const toggle = mediaEl.querySelector('.player-toggle');
    const mute = mediaEl.querySelector('.player-mute');
    const fullscreen = mediaEl.querySelector('.player-fullscreen');
    const progress = mediaEl.querySelector('.player-progress input');
    const progressFill = mediaEl.querySelector('.player-progress-fill');
    const time = mediaEl.querySelector('.player-time');

    function setPlaying(isPlaying) {
        player.classList.toggle('is-playing', isPlaying);
        player.classList.toggle('is-paused', !isPlaying);
        toggle.innerHTML = `<i class="fa-solid fa-${isPlaying ? 'pause' : 'play'}"></i>`;
    }

    function togglePlay() {
        if (video.paused) {
            video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
        } else {
            video.pause();
            setPlaying(false);
        }
    }

    function setMuted(isMuted) {
        video.muted = isMuted;
        mute.innerHTML = `<i class="fa-solid fa-volume-${video.muted ? 'xmark' : 'high'}"></i>`;
    }

    function toggleMute() {
        setMuted(!video.muted);
    }

    function toggleFullscreen() {
        if (document.fullscreenElement) {
            document.exitFullscreen();
            return;
        }

        if (player.requestFullscreen) {
            player.requestFullscreen();
        } else if (video.webkitEnterFullscreen) {
            video.webkitEnterFullscreen();
        }
    }

    function seekBy(seconds) {
        if (!video.duration) return;
        video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
        updateProgress();
    }

    function setVolumeBy(delta) {
        video.volume = Math.max(0, Math.min(1, video.volume + delta));
        if (video.volume > 0) setMuted(false);
    }

    function seekToPercent(percent) {
        if (!video.duration) return;
        video.currentTime = video.duration * percent;
        updateProgress();
    }

    function isTypingTarget(target) {
        if (!target) return false;
        const tag = target.tagName;
        const textInputTypes = ['email', 'number', 'password', 'search', 'tel', 'text', 'url'];

        return target.isContentEditable ||
            tag === 'TEXTAREA' ||
            tag === 'SELECT' ||
            (tag === 'INPUT' && textInputTypes.includes(target.type));
    }

    function handleKeyboardShortcuts(e) {
        if (!projModalBg.classList.contains('open') || !document.body.contains(player) || isTypingTarget(e.target)) return;

        const key = e.key.toLowerCase();

        if (key >= '0' && key <= '9') {
            e.preventDefault();
            seekToPercent(Number(key) / 10);
            return;
        }

        switch (key) {
            case ' ':
            case 'k':
                e.preventDefault();
                togglePlay();
                break;
            case 'm':
                e.preventDefault();
                toggleMute();
                break;
            case 'f':
                e.preventDefault();
                toggleFullscreen();
                break;
            case 'arrowleft':
                e.preventDefault();
                seekBy(-5);
                break;
            case 'arrowright':
                e.preventDefault();
                seekBy(5);
                break;
            case 'j':
                e.preventDefault();
                seekBy(-10);
                break;
            case 'l':
                e.preventDefault();
                seekBy(10);
                break;
            case 'arrowup':
                e.preventDefault();
                setVolumeBy(0.05);
                break;
            case 'arrowdown':
                e.preventDefault();
                setVolumeBy(-0.05);
                break;
            case 'home':
                e.preventDefault();
                seekToPercent(0);
                break;
            case 'end':
                e.preventDefault();
                seekToPercent(1);
                break;
        }
    }

    function updateProgress() {
        const pct = video.duration ? (video.currentTime / video.duration) * 100 : 0;
        progress.value = pct;
        progressFill.style.width = `${pct}%`;
        time.textContent = formatPlayerTime(video.currentTime);
    }

    hit.addEventListener('click', togglePlay);
    toggle.addEventListener('click', togglePlay);
    video.addEventListener('click', togglePlay);
    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('loadedmetadata', updateProgress);
    video.addEventListener('play', () => setPlaying(true));
    video.addEventListener('pause', () => setPlaying(false));

    progress.addEventListener('input', () => {
        if (!video.duration) return;
        video.currentTime = (Number(progress.value) / 100) * video.duration;
        updateProgress();
    });

    mute.addEventListener('click', toggleMute);
    fullscreen.addEventListener('click', toggleFullscreen);
    document.addEventListener('keydown', handleKeyboardShortcuts);

    document.addEventListener('fullscreenchange', () => {
        const isFullscreen = document.fullscreenElement === player;
        document.body.classList.toggle('video-fullscreen', isFullscreen);

        if (dot) {
            (isFullscreen ? player : document.body).appendChild(dot);
        }

        fullscreen.innerHTML = `<i class="fa-solid fa-${isFullscreen ? 'compress' : 'expand'}"></i>`;
    });
}

function openProjModal(idx) {
    const p = projects[idx];
    const mediaEl = document.getElementById('pm-media');

    if (p.video) {
        mountProjectPlayer(mediaEl, p);
    } else {
        mediaEl.innerHTML = `<img id="pm-img" src="${p.img}" alt="${p.title}">`;
    }

    document.getElementById('pm-title').textContent = p.title;
    document.getElementById('pm-challenge').textContent = p.challenge;
    document.getElementById('pm-solution').textContent = p.solution;

    const tagsEl = document.getElementById('pm-tags');
    tagsEl.innerHTML = p.tags.map(t => `<span>${t}</span>`).join('');

    document.getElementById('pm-live').href = p.url;
    const gitBtn = document.getElementById('pm-git');
    gitBtn.href = p.git || '#';
    gitBtn.style.display = p.git ? '' : 'none';

    projModalBg.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (closeProj) closeProj.focus();
}

function closeProjModal() {
    projModalBg.classList.remove('open');
    document.body.style.overflow = '';
    document.getElementById('pm-media').innerHTML = '';
}

document.querySelectorAll('.project-card').forEach(item => {
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
function printCurriculo() {
    window.open('curriculo.html?v=20260607-5&print=1', '_blank', 'noopener,noreferrer');
}

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
   PROJECTS — 3D CAROUSEL
═══════════════════════════════════════════════════ */
(function () {
    const carousel = document.getElementById('projects-carousel');
    if (!carousel) return;

    const cards = [...carousel.querySelectorAll('.project-card')];
    const stage = carousel.querySelector('.carousel-stage');
    const prev = carousel.querySelector('[data-carousel-prev]');
    const next = carousel.querySelector('[data-carousel-next]');
    const dotsWrap = carousel.querySelector('.carousel-dots');
    let active = 0;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchDeltaX = 0;
    let isHorizontalSwipe = false;
    let suppressClick = false;

    carousel.tabIndex = 0;

    cards.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot';
        dot.type = 'button';
        dot.setAttribute('aria-label', `Ir para projeto ${i + 1}`);
        dot.addEventListener('click', () => goTo(i));
        dotsWrap.appendChild(dot);
    });

    const dots = [...dotsWrap.querySelectorAll('.carousel-dot')];

    function shortestOffset(index) {
        const total = cards.length;
        let offset = index - active;
        if (offset > total / 2) offset -= total;
        if (offset < -total / 2) offset += total;
        return offset;
    }

    function updateVideos() {
        cards.forEach((card, i) => {
            const video = card.querySelector('video');
            if (!video) return;

            if (i === active) {
                video.play().catch(() => {});
            } else {
                video.pause();
            }
        });
    }

    function render() {
        const isMobile = window.innerWidth <= 640;

        cards.forEach((card, i) => {
            const offset = shortestOffset(i);
            const abs = Math.abs(offset);
            const direction = Math.sign(offset);
            const visible = abs <= (isMobile ? 1 : 2);

            card.classList.toggle('is-active', offset === 0);
            card.style.zIndex = String(20 - abs);
            card.style.opacity = visible ? String(1 - abs * 0.24) : '0';
            card.style.pointerEvents = visible ? 'auto' : 'none';
            card.style.filter = abs > 0 ? `blur(${abs * 0.2}px)` : '';

            const x = offset * (isMobile ? 34 : 58);
            const rotate = direction * (isMobile ? -12 : -26);
            const z = abs * (isMobile ? -80 : -160);
            const scale = 1 - abs * (isMobile ? 0.06 : 0.09);
            card.style.transform = `translateX(calc(-50% + ${x}%)) translateZ(${z}px) rotateY(${rotate}deg) scale(${scale})`;
        });

        dots.forEach((dot, i) => dot.classList.toggle('is-active', i === active));
        updateVideos();
    }

    function goTo(index) {
        active = (index + cards.length) % cards.length;
        render();
    }

    function startSwipe(e) {
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchDeltaX = 0;
        isHorizontalSwipe = false;
    }

    function moveSwipe(e) {
        if (!touchStartX) return;

        const touch = e.touches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;
        touchDeltaX = deltaX;

        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
            isHorizontalSwipe = true;
            e.preventDefault();
        }
    }

    function endSwipe() {
        if (!touchStartX) return;

        if (isHorizontalSwipe && Math.abs(touchDeltaX) > 45) {
            suppressClick = true;
            goTo(active + (touchDeltaX < 0 ? 1 : -1));
            setTimeout(() => { suppressClick = false; }, 350);
        }

        touchStartX = 0;
        touchStartY = 0;
        touchDeltaX = 0;
        isHorizontalSwipe = false;
    }

    prev && prev.addEventListener('click', () => goTo(active - 1));
    next && next.addEventListener('click', () => goTo(active + 1));

    carousel.addEventListener('click', e => {
        if (!suppressClick) return;
        e.preventDefault();
        e.stopPropagation();
    }, true);

    if (stage) {
        stage.addEventListener('touchstart', startSwipe, { passive: true });
        stage.addEventListener('touchmove', moveSwipe, { passive: false });
        stage.addEventListener('touchend', endSwipe);
        stage.addEventListener('touchcancel', endSwipe);
    }

    carousel.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft') goTo(active - 1);
        if (e.key === 'ArrowRight') goTo(active + 1);
    });

    cards.forEach((card, i) => {
        card.addEventListener('mouseenter', () => {
            if (i !== active) goTo(i);
        });
    });

    window.addEventListener('resize', render, { passive: true });
    render();
})();

/* ═══════════════════════════════════════════════════
   SMOOTH PARALLAX — handled in patch below
═══════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════
   CURSOR HIDE ON LEAVE
═══════════════════════════════════════════════════ */
document.addEventListener('mouseleave', () => {
    dot.style.opacity = '0';
});
document.addEventListener('mouseenter', () => {
    dot.style.opacity = '1';
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
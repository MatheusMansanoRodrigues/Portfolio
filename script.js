$(function () {

    // =========================
    // DADOS
    // =========================
    const PROFILE = {
        name: "Matheus Mansano",
        fullName: "Matheus Mansano Rodrigues",
        role: "Full Stack · PHP/MySQL · Web",
        email: "matheusmansano1@gmail.com",
        github: "https://github.com/akiramath",
        linkedin: "https://www.linkedin.com/in/matheus-mansano-rodrigues-b04054253/",
        whatsapp: "https://api.whatsapp.com/send/?phone=5543988080637&text=Ol%C3%A1%21+Vi+seu+portf%C3%B3lio+e+queria+conversar+sobre+um+projeto.&type=phone_number&app_absent=0",
        location: "Brasil",
        availability: "disponível",
        years: "2+",
        totalProjects: 6,
        about:
            "Olá a todos, obrigado por me permitirem me apresentar. Sou desenvolvedor full stack com cerca de 2 anos de experiência, " +
            "atuando principalmente no desenvolvimento de sistemas ERP e aplicações web. Trabalho no dia a dia com PHP, jQuery, MySQL, SQL Server e integrações via APIs. " +
            "Gosto de transformar requisitos em soluções objetivas, priorizando código claro, componentes reutilizáveis, segurança essencial (autenticação, validação e controle de requisições quando necessário) e bancos de dados bem modelados. " +
            "Quando o projeto pede, aplico animações e recursos 3D de forma leve, sempre com foco em performance e experiência do usuário."
    };

    const STACK = {
        "Frontend": ["HTML", "CSS", "JavaScript", "jQuery", "Three.js"],
        "Backend": ["PHP", "APIs REST"],
        "Banco de Dados": ["MySQL", "SQL Server"],
        "DevOps & Ferramentas": ["Git", "GitHub", "Docker"]
    };

    const PROJECTS = [
        {
            title: "Esfera 3D Interativa",
            what: "Cena 3D imersiva com rotação, gestos e navegação em tempo real usando Three.js.",
            impact: "Demonstra domínio de WebGL e interatividade avançada no navegador.",
            stack: ["HTML", "CSS", "JavaScript", "Three.js"],
            tags: ["frontend", "3D", "webgl"],
            demo: "https://akiramath.github.io/esfera_3d/",
            repo: "https://github.com/akiramath/esfera_3d"
        },
        {
            title: "Ótica Horizonte",
            what: "Landing page moderna com dark/light mode, galeria de produtos, depoimentos e CTA via WhatsApp.",
            impact: "Fortaleceu a presença digital da marca e aumentou conversões de leads.",
            stack: ["HTML", "CSS", "JavaScript"],
            tags: ["landing page", "responsive", "ui/ux"],
            demo: "https://akiramath.github.io/otica_horizonte/",
            repo: "https://github.com/akiramath/otica_horizonte"
        },
        {
            title: "Gerenciador de Tarefas",
            what: "App de tarefas com CRUD completo, filtros, dark mode e interface minimalista.",
            impact: "Foco em produtividade pessoal com UX rápida e intuitiva.",
            stack: ["HTML", "CSS", "JavaScript"],
            tags: ["app", "responsive", "produtividade"],
            demo: "https://akiramath.github.io/Projeto-Tarefa/",
            repo: "https://github.com/akiramath/Projeto-Tarefa"
        }
    ];

    // Mapeamento de imagens: [principal, mini] por projeto (coloque em /assets)
    const PROJECT_IMAGES = [
        "assets/esfera/esfera_3d.webp", 
        "assets/otica/otica_horizonte_h.webp", 
        "assets/minhas_tarefas/minhas_tarefas_h.webp"
    ];

    // =========================
    // POPULA HERO / SOBRE / CONTATO
    // =========================
    document.title = `${PROFILE.name} | Full Stack`;

    $("#availabilityTop").text(PROFILE.availability);
    $("#heroSubtitle").text(PROFILE.role);

    $("#heroContact").html(`${PROFILE.location}<br><br>${PROFILE.email}`);

    $("#aboutText").text(PROFILE.about);

    $("#yearsPill").text(PROFILE.years);
    $("#projectsPill").text(String(PROFILE.totalProjects));

    $("#githubPill").attr("href", PROFILE.github);
    $("#linkedinPill").attr("href", PROFILE.linkedin);
    $("#whatsappPill").attr("href", PROFILE.whatsapp);

    $("#moreOnGithub").attr("href", PROFILE.github);

    $("#emailText").text(PROFILE.email);
    $("#emailCard").attr("href", `mailto:${PROFILE.email}`);
    $("#wppCard").attr("href", PROFILE.whatsapp);
    $("#liCard").attr("href", PROFILE.linkedin);
    $("#ghCard").attr("href", PROFILE.github);

    $("#year").text(new Date().getFullYear());

    // =========================
    // MÚSICA DE FUNDO – som ambiente, loop infinito, pause/play
    // =========================
    (function () {
        const audio = document.getElementById("bgMusic");
        const $btn = $("#btnMusic");
        if (!audio || !$btn.length) return;

        audio.volume = 0.2;  // volume baixo para som ambiente
        let started = false;

        function playMusic() {
            audio.play().catch(() => {});
            started = true;
            $btn.addClass("is-playing").attr("aria-label", "Pausar música");
        }

        function pauseMusic() {
            audio.pause();
            $btn.removeClass("is-playing").attr("aria-label", "Reproduzir música");
        }

        function toggleMusic() {
            if (!started) {
                playMusic();
            } else if (audio.paused) {
                playMusic();
            } else {
                pauseMusic();
            }
        }

        $btn.on("click", toggleMusic);

        // Tenta autoplay ao carregar (navegadores podem bloquear)
        audio.play().then(() => {
            started = true;
            $btn.addClass("is-playing").attr("aria-label", "Pausar música");
        }).catch(() => {});

        // Se autoplay bloqueado, inicia na primeira interação do usuário
        const startOnInteraction = function () {
            if (!started) playMusic();
            document.removeEventListener("click", startOnInteraction);
            document.removeEventListener("touchstart", startOnInteraction);
            document.removeEventListener("keydown", startOnInteraction);
        };
        document.addEventListener("click", startOnInteraction, { once: true });
        document.addEventListener("touchstart", startOnInteraction, { once: true });
        document.addEventListener("keydown", startOnInteraction, { once: true });
    })();

    // Envolve palavras dos títulos em spans para animação escalonada
    (function () {
        $("h2.scroll-reveal").each(function () {
            const $h = $(this);
            const text = $h.text();
            const words = text.split(/\s+/);
            const html = words.map((w, i) =>
                `<span class="word" style="transition-delay: ${i * 50}ms">${escapeHtml(w)}</span>`
            ).join(" ");
            $h.html(html);
        });
    })();

    // =========================
    // STACK (cards)
    // =========================
    const $stackGrid = $("#stackGrid");
    let stackIndex = 0;
    Object.entries(STACK).forEach(([area, items]) => {
        const delay = stackIndex * 60;
        stackIndex++;
        const $card = $(`
        <div class="stackCard">
          <h3>${escapeHtml(area)}</h3>
          <div class="stackList"></div>
        </div>
      `);
        const $list = $card.find(".stackList");
        items.forEach(s => $list.append(`<span class="stackTag">${escapeHtml(s)}</span>`));
        $card.addClass("scroll-reveal").attr("data-delay", delay);
        $stackGrid.append($card);
    });

    // =========================
    // PROJETOS – Timeline
    // =========================
    const $timeline = $("#timelineProjects");
    const years = ["2026", "2026", "2023"];

    PROJECTS.forEach((p, i) => {
        const imgs = PROJECT_IMAGES[i];
        const img = Array.isArray(imgs) ? (imgs[0] || "") : (imgs || "");
        const tagsHtml = (p.tags || []).map(t => `<span>${escapeHtml(t)}</span>`).join("");
        const stackText = (p.stack || []).join(" · ");
        const year = years[i] || String(new Date().getFullYear());
        const side = i % 2 === 0 ? "left" : "right";

        const $item = $(`
        <article class="timeline-item scroll-reveal" data-side="${side}" data-delay="${i * 80}">
          <div class="timeline-node"></div>
          <div class="timeline-card">
            <div class="timeline-card-img">
              <img src="${escapeAttr(img)}" alt="${escapeAttr(p.title)}" />
            </div>
            <div class="timeline-card-body">
              <span class="timeline-year">${escapeHtml(year)}</span>
              <h3 class="timeline-card-title">${escapeHtml(p.title)}</h3>
              <p class="timeline-card-desc">${escapeHtml(p.what)}</p>
              <div class="timeline-card-stack">${escapeHtml(stackText)}</div>
              <div class="timeline-card-tags">${tagsHtml}</div>
              <div class="timeline-card-links">
                <a href="${escapeAttr(p.demo)}" target="_blank" rel="noopener">Demo</a>
                <a href="${escapeAttr(p.repo)}" target="_blank" rel="noopener">Código</a>
              </div>
            </div>
          </div>
        </article>
      `);

        $timeline.append($item);
    });

    // =========================
    // HERO: partículas no título (canvas) - versão leve
    // =========================
    const canvas = document.getElementById("heroCanvas");
    const ctx = canvas.getContext("2d", { alpha: true });

    const particleState = {
        particles: [],
        mouse: { x: -9999, y: -9999, active: false },
        rafId: null,
        resizeTimer: null
    };

    const pcfg = {
        text: "PORTFÓLIO",
        // text: "MATHEUS MANSANO",

        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',

        gap: 6,            // mais denso (mais bonito) – se pesar, aumente pra 6
        radius: 105,       // área de repulsão maior
        strength: 3.4,     // força maior
        returnForce: 0.06,
        friction: 0.86,
        size: 1.5,
        maxDpr: 1.75,

        // agora o foco é ficar grande
        maxFont: 210,      // maior
        minFont: 90,       // mínimo bem alto
        paddingX: 18       // menos respiro lateral para caber maior
    };


    function adaptiveGap(w) {
        if (w < 420) return 9;
        if (w < 700) return 7;
        if (w < 980) return 6;
        return 6;
    }

    function resizeCanvas() {
        const cssW = canvas.clientWidth;
        const cssH = canvas.clientHeight;
        const dpr = Math.max(1, Math.min(pcfg.maxDpr, window.devicePixelRatio || 1));
        canvas.width = Math.floor(cssW * dpr);
        canvas.height = Math.floor(cssH * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function buildParticles() {
        particleState.particles = [];

        const w = canvas.clientWidth;
        const h = canvas.clientHeight;

        // mobile: ajustes para o título caber
        const minFont = w < 380 ? 48 : (w < 480 ? 58 : (w < 600 ? 72 : pcfg.minFont));
        const pad = w < 480 ? 24 : (w < 600 ? 20 : pcfg.paddingX);
        pcfg.gap = (w < 380) ? 8 : (w < 520 ? 7 : (w < 900 ? 6 : 5));

        const off = document.createElement("canvas");
        off.width = w;
        off.height = h;
        const octx = off.getContext("2d");

        octx.clearRect(0, 0, w, h);
        octx.fillStyle = "#fff";
        octx.textAlign = "center";
        octx.textBaseline = "middle";

        const maxWidthAllowed = w - (pad * 2);

        // auto-fit: aumenta bastante e só reduz se estourar
        const maxForWidth = w < 600 ? w * 0.32 : w * 0.26;
        let fontSize = Math.round(Math.min(pcfg.maxFont, maxForWidth));
        fontSize = Math.max(fontSize, minFont);

        function textWidth(fs) {
            octx.font = `900 ${fs}px ${pcfg.fontFamily}`;
            return octx.measureText(pcfg.text).width;
        }

        while (fontSize > minFont && textWidth(fontSize) > maxWidthAllowed) {
            fontSize -= 2;
        }

        octx.font = `900 ${fontSize}px ${pcfg.fontFamily}`;
        octx.fillText(pcfg.text, w / 2, h / 2);

        const img = octx.getImageData(0, 0, w, h).data;

        for (let y = 0; y < h; y += pcfg.gap) {
            for (let x = 0; x < w; x += pcfg.gap) {
                const a = img[(y * w + x) * 4 + 3];
                if (a > 24) particleState.particles.push({ x, y, vx: 0, vy: 0, ox: x, oy: y });
            }
        }

        // fallback performance
        if (particleState.particles.length > 16000) {
            pcfg.gap += 2;
            buildParticles();
        }
    }



    function tick() {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "rgba(245,245,245,0.9)";

        const m = particleState.mouse;
        const r = pcfg.radius;

        for (const p of particleState.particles) {
            const dx = p.x - m.x;
            const dy = p.y - m.y;
            const dist = Math.hypot(dx, dy);

            if (m.active && dist < r) {
                const t = 1 - (dist / r);
                const force = pcfg.strength * (t * t);
                const nx = dx / (dist || 1);
                const ny = dy / (dist || 1);
                p.vx += nx * force;
                p.vy += ny * force;
            }

            p.vx += (p.ox - p.x) * pcfg.returnForce;
            p.vy += (p.oy - p.y) * pcfg.returnForce;

            p.vx *= pcfg.friction;
            p.vy *= pcfg.friction;

            p.x += p.vx;
            p.y += p.vy;

            ctx.beginPath();
            ctx.arc(p.x, p.y, pcfg.size, 0, Math.PI * 2);
            ctx.fill();
        }

        particleState.rafId = requestAnimationFrame(tick);
    }

    function setMouseFromEvent(e) {
        const rect = canvas.getBoundingClientRect();
        particleState.mouse.x = e.clientX - rect.left;
        particleState.mouse.y = e.clientY - rect.top;
        particleState.mouse.active = true;
    }

    $("#heroCanvas").on("mousemove", function (e) {
        setMouseFromEvent(e.originalEvent);
    }).on("mouseenter", function () {
        particleState.mouse.active = true;
    }).on("mouseleave", function () {
        particleState.mouse.active = false;
        particleState.mouse.x = -9999; particleState.mouse.y = -9999;
    });

    $("#heroCanvas").on("touchstart touchmove", function (e) {
        const t = e.originalEvent.touches && e.originalEvent.touches[0];
        if (t) setMouseFromEvent(t);
    }).on("touchend touchcancel", function () {
        particleState.mouse.active = false;
        particleState.mouse.x = -9999; particleState.mouse.y = -9999;
    });

    $(window).on("resize", function () {
        clearTimeout(particleState.resizeTimer);
        particleState.resizeTimer = setTimeout(function () {
            resizeCanvas();
            buildParticles();
        }, 120);
    });

    // init canvas
    resizeCanvas();
    buildParticles();
    tick();

    // =========================
    // helpers
    // =========================
    function escapeHtml(s) {
        return String(s ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }
    function escapeAttr(s) { return escapeHtml(s); }

    // ===============================
    // SCROLL REVEAL – entra/sai revertendo (como voltar no tempo)
    // ===============================
    (function () {
        const $targets = $(".scroll-reveal");
        const rootMargin = "0px 0px -80px 0px"; // trigger um pouco antes de entrar

        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                const $el = $(e.target);
                const delay = parseInt($el.data("delay") || "0", 10);
                if (e.isIntersecting) {
                    $el.css("transition-delay", delay + "ms");
                    $el.addClass("in-view");
                } else {
                    $el.removeClass("in-view");
                    $el.css("transition-delay", "0ms");
                }
            });
        }, { threshold: [0, 0.05, 0.1, 0.2, 0.3], rootMargin });

        $targets.each(function () {
            io.observe(this);
        });
    })();

    // header: muda cor ao chegar na seção sobre (is-over-ink)
    (function () {
        const $header = $("header");
        const $sobre = $("#sobre");

        function checkHeaderOverSobre() {
            if (!$sobre.length) return;
            const rect = $sobre[0].getBoundingClientRect();
            const headerH = $header.outerHeight() || 90;
            const isOver = rect.top <= headerH;
            $header.toggleClass("is-over-ink", isOver);
        }

        $(window).on("scroll", checkHeaderOverSobre);
        checkHeaderOverSobre();
    })();

    // ===============================
    // MENU HAMBURGER (mobile) - jQuery
    // ===============================
    (function () {
        const $btn = $("#btnHamb");
        const $menu = $("#mobileMenu");
        const $overlay = $("#menuOverlay");
        const $close = $("#btnCloseMobile");

        function openMenu() {
            $("body").addClass("menu-open");
            $btn.attr("aria-expanded", "true");

            $overlay.prop("hidden", false).addClass("is-open");
            $menu.prop("hidden", false).addClass("is-open");
        }

        function closeMenu() {
            $("body").removeClass("menu-open");
            $btn.attr("aria-expanded", "false");

            $overlay.removeClass("is-open");
            $menu.removeClass("is-open");

            // espera transição pra esconder
            setTimeout(() => {
                $overlay.prop("hidden", true);
                $menu.prop("hidden", true);
            }, 220);
        }

        $btn.on("click", function () {
            const expanded = $btn.attr("aria-expanded") === "true";
            expanded ? closeMenu() : openMenu();
        });

        $close.on("click", closeMenu);
        $overlay.on("click", closeMenu);

        // fecha ao clicar em qualquer link do menu
        $menu.on("click", "a", function () {
            closeMenu();
        });

        // ESC fecha
        $(document).on("keydown", function (e) {
            if (e.key === "Escape") {
                const expanded = $btn.attr("aria-expanded") === "true";
                if (expanded) closeMenu();
            }
        });

        // se redimensionar e sair do mobile, fecha
        $(window).on("resize", function () {
            if (window.innerWidth > 900) {
                const expanded = $btn.attr("aria-expanded") === "true";
                if (expanded) closeMenu();
            }
        });

        // scroll suave (pra ficar homogêneo)
        $('a[href^="#"]').on("click", function (e) {
            const href = $(this).attr("href");
            if (!href || href === "#") return;

            const $target = $(href);
            if (!$target.length) return;

            e.preventDefault();
            const top = $target.offset().top - 86; // compensa header
            $("html, body").stop(true).animate({ scrollTop: top }, 520);
        });
    })();
});

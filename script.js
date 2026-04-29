$(function () {
    const I18N_DATA = {
        en: {
            nav_home: "Home",
            nav_about: "About",
            nav_stack: "Stack",
            nav_trajectory: "Journey",
            nav_projects: "Projects",
            menu_navigation: "Navigation",
            menu_close: "Close",
            menu_social: "Social",
            menu_contact: "Contact",
            hero_cta: "LET'S TALK",
            stat_years: "Years of Experience",
            stat_projects: "Completed Projects",
            stat_commitment: "Commitment",
            about_desc: "I prefer delivering the essentials well-done than fluff without a base.",
            about_quote: "Organized code, well-modeled database and a product the team can evolve without fear.",
            about_hi: "Hi, I'm Matheus.",
            stack_desc: "What I use daily to turn ideas into reality.",
            exp_desc: "Experience in web products and internal systems.",
            projects_desc: "Some public works — click to open.",
            footer_lead: "Let's talk?",
            footer_made_by: "Design and code by"
        },
        pt: {
            nav_home: "Início",
            nav_about: "Sobre",
            nav_stack: "Stack",
            nav_trajectory: "Trajetória",
            nav_projects: "Projetos",
            menu_navigation: "Navegação",
            menu_close: "Fechar",
            menu_social: "Social",
            menu_contact: "Contato",
            hero_cta: "VAMOS CONVERSAR",
            stat_years: "Anos de Experiência",
            stat_projects: "Projetos Concluídos",
            stat_commitment: "Comprometimento",
            about_desc: "Prefiro entregar o essencial bem feito do que recheio sem base.",
            about_quote: "Código organizado, banco bem modelado e produto que o time consegue evoluir sem medo.",
            about_hi: "Oi, sou o Matheus.",
            stack_desc: "O que uso no dia a dia para tirar ideias do papel.",
            exp_desc: "Experiência em produtos web e sistemas internos.",
            projects_desc: "Alguns trabalhos públicos — clique para abrir.",
            footer_lead: "Vamos conversar?",
            footer_made_by: "Design e código por"
        }
    };

    const PROFILE = {
        en: {
            name: "Matheus Mansano",
            fullName: "Matheus Mansano Rodrigues",
            role: "Full Stack · PHP/MySQL · Web",
            email: "matheusmansano1@gmail.com",
            github: "https://github.com/matheusmansanorodrigues",
            linkedin: "https://www.linkedin.com/in/matheusrrodrigues/",
            whatsapp: "https://api.whatsapp.com/send/?phone=5543988080637&text=Hello!+I+saw+your+portfolio+and+wanted+to+talk+about+a+project.",
            location: "Brazil",
            years: "2+",
            totalProjects: 6,
            about:
                "Hello everyone, thank you for allowing me to introduce myself. I am a full stack developer with about 2 years of experience, " +
                "working mainly in the development of ERP systems and web applications. I work daily with PHP, jQuery, MySQL, SQL Server and integrations via APIs. " +
                "I like to transform requirements into objective solutions, prioritizing clear code, reusable components, essential security (authentication, validation and request control when necessary) and well-modeled databases. " +
                "When the project calls for it, I apply animations and 3D resources lightly, always focusing on performance and user experience."
        },
        pt: {
            name: "Matheus Mansano",
            fullName: "Matheus Mansano Rodrigues",
            role: "Full Stack · PHP/MySQL · Web",
            email: "matheusmansano1@gmail.com",
            github: "https://github.com/matheusmansanorodrigues",
            linkedin: "https://www.linkedin.com/in/matheusrrodrigues/",
            whatsapp: "https://api.whatsapp.com/send/?phone=5543988080637&text=Ol%C3%A1%21+Vi+seu+portf%C3%B3lio+e+queria+conversar+sobre+um+projeto.",
            location: "Brasil",
            years: "2+",
            totalProjects: 6,
            about:
                "Olá a todos, obrigado por me permitirem me apresentar. Sou desenvolvedor full stack com cerca de 2 anos de experiência, " +
                "atuando principalmente no desenvolvimento de sistemas ERP e aplicações web. Trabalho no dia a dia com PHP, jQuery, MySQL, SQL Server e integrações via APIs. " +
                "Gosto de transformar requisitos em soluções objetivas, priorizando código claro, componentes reutilizáveis, segurança essencial (autenticação, validação e controle de requisições quando necessário) e bancos de dados bem modelados. " +
                "Quando o projeto pede, aplico animações e recursos 3D de forma leve, sempre com foco em performance e experiência do usuário."
        }
    };

    const STACK = {
        en: {
            "Frontend": ["HTML", "CSS", "JavaScript", "jQuery", "Three.js"],
            "Backend": ["PHP", "REST APIs"],
            "Database": ["MySQL", "SQL Server"],
            "Tools": ["Git", "GitHub", "Docker"]
        },
        pt: {
            "Frontend": ["HTML", "CSS", "JavaScript", "jQuery", "Three.js"],
            "Backend": ["PHP", "APIs REST"],
            "Banco de Dados": ["MySQL", "SQL Server"],
            "Ferramentas": ["Git", "GitHub", "Docker"]
        }
    };

    const PROJECTS = [
        {
            title: "Esfera 3D",
            stack: ["HTML", "CSS", "JavaScript", "Three.js"],
            demo: "https://matheusmansanorodrigues.github.io/esfera_3d/",
        },
        {
            title: "Ótica Horizonte",
            stack: ["HTML", "CSS", "JavaScript", "UI/UX"],
            demo: "https://matheusmansanorodrigues.github.io/otica_horizonte/",
        },
        {
            title: "Gestor de Tarefas",
            stack: ["HTML", "CSS", "JavaScript"],
            demo: "https://matheusmansanorodrigues.github.io/Projeto-Tarefa/",
        },
        {
            title: "O Tomo do Mestre",
            stack: ["HTML", "CSS", "JavaScript"],
            demo: "https://matheusmansanorodrigues.github.io/Guia_RPG/",
        }
    ];

    const PROJECT_IMAGES = [
        "assets/esfera_3d.webp",
        "assets/otica_horizonte_h.webp",
        "assets/minhas_tarefas_h.webp",
        "assets/tomo_mestre.webp"
    ];

    const EXPERIENCES = {
        en: [
            {
                company: "Full Stack Developer",
                role: "MSE Engenharia",
                date: "Nov 2023 - Present"
            },
            {
                company: "Full Stack Developer",
                role: "Freelancer / Self-employed",
                date: "Present"
            }
        ],
        pt: [
            {
                company: "Desenvolvedor Full Stack",
                role: "MSE Engenharia",
                date: "Nov 2023 - Presente"
            },
            {
                company: "Desenvolvedor Full Stack",
                role: "Freelancer / Autônomo",
                date: "Presente"
            }
        ]
    };

    let currentLang = localStorage.getItem("portfolio_lang") || "en";

    function updateLanguage() {
        const lang = currentLang;
        const profile = PROFILE[lang];
        const i18n = I18N_DATA[lang];

        // Update static elements with data-i18n
        $("[data-i18n]").each(function () {
            const key = $(this).data("i18n");
            if (i18n[key]) {
                $(this).text(i18n[key]);
            }
        });

        // Update specific text nodes and attributes
        document.title = `Portfolio — ${profile.name}`;
        $("html").attr("lang", lang === "en" ? "en" : "pt-BR");

        // Accessibility and Titles
        $(".brand").attr("aria-label", lang === "en" ? "Home" : "Início");
        $("#sideEmail").attr("title", lang === "en" ? "Send email" : "Enviar e-mail");
        $("#btnHamb").attr("aria-label", lang === "en" ? "Open menu" : "Abrir menu");
        $("#menuClose").attr("aria-label", lang === "en" ? "Close menu" : "Fechar menu");
        $(".hero-massive").attr("aria-label", lang === "en" ? "Full Stack Developer" : "Desenvolvedor Full Stack");

        $("#navGithub").attr("href", profile.github);
        $("#navLinkedin").attr("href", profile.linkedin);
        $("#navWhatsapp").attr("href", profile.whatsapp);
        $("#navEmail").text(profile.email).attr("href", `mailto:${profile.email}`);
        $("#footerEmail").text(profile.email).attr("href", `mailto:${profile.email}`);
        $("#sideEmail").text(profile.email).attr("href", `mailto:${profile.email}`);
        $("#footerYear").text(new Date().getFullYear());

        $("#hireMeBtn").attr("href", profile.whatsapp);
        $("#heroGithub").attr("href", profile.github);
        $("#heroProjectCount").text(profile.totalProjects + "+");
        $("#heroYears").text(profile.years);
        $("#heroNameHighlight").text(profile.fullName);

        // Hero Lead Text (Special case)
        if (lang === "en") {
            $("#heroLead").html(`Hi! I'm <strong id="heroNameHighlight">${profile.fullName}</strong> — a creative Full Stack Developer with ${profile.years} of experience building high-performance, scalable and responsive web solutions.`);
        } else {
            $("#heroLead").html(`Olá! Eu sou <strong id="heroNameHighlight">${profile.fullName}</strong> — um Desenvolvedor Full Stack criativo com ${profile.years} de experiência construindo soluções web de alta performance, escaláveis e responsivas.`);
        }

        // About Sentences
        const $aboutContainer = $("#aboutTextContainer");
        $aboutContainer.empty();
        const sentencas = profile.about.split(/(?<=[.!?])\s+/).filter((s) => s.trim());
        sentencas.forEach((s, i) => {
            $aboutContainer.append(`<p class="slide-up in-view" style="transition-delay: ${i * 90}ms">${s}</p>`);
        });

        // Stack
        const $stackContainer = $("#stackContainer");
        $stackContainer.empty();
        Object.entries(STACK[lang]).forEach(([categoria, items]) => {
            $stackContainer.append(`
                <div class="stack-group slide-up in-view">
                    <h3 class="stack-label mono">${categoria}</h3>
                    <div class="stack-pills">
                        ${items.map((item) => `<span class="stack-pill">${item}</span>`).join("")}
                    </div>
                </div>
            `);
        });

        // Experiences
        const $expContainer = $("#experienceContainer");
        $expContainer.empty();
        EXPERIENCES[lang].forEach((exp, i) => {
            $expContainer.append(`
                <div class="timeline-item slide-up in-view" style="transition-delay: ${i * 120}ms">
                    <div class="timeline-dot" aria-hidden="true"></div>
                    <p class="timeline-company">${exp.company}</p>
                    <p class="timeline-role">${exp.role}</p>
                    <p class="timeline-date">${exp.date}</p>
                </div>
            `);
        });

        // Projects
        const $projContainer = $("#projectsContainer");
        $projContainer.empty();
        const arrowSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>`;
        PROJECTS.forEach((proj, i) => {
            const num = String(i + 1).padStart(2, "0");
            const imgUrl = PROJECT_IMAGES[i] || "";
            const tags = proj.stack.map((t) => `<span>${t}</span>`).join("");
            $projContainer.append(`
                <article class="project-card slide-up in-view" style="transition-delay: ${i * 90}ms">
                    <a class="project-card-link" href="${proj.demo}" target="_blank" rel="noopener noreferrer">
                        <div class="project-card-media">
                            <img src="${imgUrl}" alt="" loading="lazy" onerror="var p=this.parentElement;this.remove();p.classList.add('is-empty');" />
                        </div>
                        <div class="project-card-body">
                            <span class="project-card-num mono">/${num}</span>
                            <h3 class="project-card-title">
                                <span>${proj.title}</span>
                                ${arrowSvg}
                            </h3>
                            <div class="project-card-tags">${tags}</div>
                        </div>
                    </a>
                </article>
            `);
        });

        // Update active button state
        $(".lang-btn").removeClass("is-active");
        $(`.lang-btn[data-lang="${lang}"]`).addClass("is-active");
    }

    // Language Switcher Event
    $(".lang-btn").on("click", function () {
        const newLang = $(this).data("lang");
        if (newLang !== currentLang) {
            currentLang = newLang;
            localStorage.setItem("portfolio_lang", currentLang);
            updateLanguage();
        }
    });

    // Initial Render
    updateLanguage();

    // Navigation and UI interactions
    const $btn = $("#btnHamb");
    const $overlay = $("#menuOverlay");
    const $close = $("#menuClose");

    function setMenuOpen(open) {
        if (open) {
            $btn.addClass("is-active").attr("aria-expanded", "true");
            $overlay.addClass("is-open").attr("aria-hidden", "false");
            $("body").addClass("menu-open");
        } else {
            $btn.removeClass("is-active").attr("aria-expanded", "false");
            $overlay.removeClass("is-open").attr("aria-hidden", "true");
            $("body").removeClass("menu-open");
        }
    }

    function toggleMenu() {
        setMenuOpen(!$overlay.hasClass("is-open"));
    }

    $btn.on("click", toggleMenu);
    $close.on("click", () => setMenuOpen(false));

    $overlay.on("click", function (e) {
        if (e.target === this) setMenuOpen(false);
    });

    $(document).on("keydown", function (e) {
        if (e.key === "Escape" && $overlay.hasClass("is-open")) setMenuOpen(false);
    });

    $(".panel-link").on("click", () => setMenuOpen(false));

    function headerOffsetPx() {
        const h = document.querySelector(".site-header");
        return (h ? h.offsetHeight : 68) + 3;
    }

    function updateScrollProgress() {
        const $w = $(window);
        const st = $w.scrollTop();
        const dh = $(document).height() - $w.height();
        const pct = dh > 0 ? Math.min(100, Math.max(0, (st / dh) * 100)) : 0;
        $("#scrollProgressFill").css("width", pct + "%");
        $("#scrollProgress").attr("aria-valuenow", Math.round(pct));
    }
    $(window).on("scroll resize", updateScrollProgress);
    updateScrollProgress();

    $('a[href^="#"]').on("click", function (e) {
        const href = $(this).attr("href");
        if (!href || href === "#") return;
        const $target = $(href);
        if (!$target.length) return;
        e.preventDefault();
        const top = $target.offset().top - headerOffsetPx();
        $("html, body").stop(true).animate({ scrollTop: top }, 550);
    });

    const revealEls = document.querySelectorAll(".slide-up");
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) entry.target.classList.add("in-view");
                else entry.target.classList.remove("in-view");
            });
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    revealEls.forEach((el) => observer.observe(el));
});

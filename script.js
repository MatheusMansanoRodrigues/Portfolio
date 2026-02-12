const PROFILE = {
    name: "Matheus Mansano Rodrigues",
    role: "Full Stack · PHP/MySQL · Web",
    email: "matheusmansano1@gmail.com",
    github: "https://github.com/akiramath",
    linkedin: "https://www.linkedin.com/in/matheus-mansano-rodrigues-b04054253/",
    whatsapp: "https://api.whatsapp.com/send/?phone=5543988080637&text=Ol%C3%A1%21+Vi+seu+portf%C3%B3lio+e+queria+conversar+sobre+um+projeto.&type=phone_number&app_absent=0",
    location: "Brasil",
    availability: "disponível",
    years: "2+",
    totalProjects: 3,
    about:  " #####    #####   ######   ######   #######           ##   ##   ######  ##   ## \n" +
            "##   ##  ### ###   ##  ##   ##  ##   ##   #           ### ###     ##    ### ### \n" +
            "##       ##   ##   ##  ##   ##  ##   ##               #######     ##    ####### \n" +
            " #####   ##   ##   #####    #####    ####             ## # ##     ##    ## # ## \n" +
            "     ##  ##   ##   ##  ##   ## ##    ##               ##   ##     ##    ##   ## \n" +
            "##   ##  ### ###   ##  ##   ## ##    ##   #           ##   ##     ##    ##   ## \n" +
            " #####    #####   ######   #### ##  #######           ### ###   ######  ### ### \n" +
            "\n\n\n" + 
            "Olá a todos, obrigado por me permitirem me apresentar. Sou desenvolvedor full stack com cerca de 2 anos de experiência, " + 
            "atuando principalmente no desenvolvimento de sistemas ERP e aplicações web. Trabalho no dia a dia com PHP, jQuery, MySQL, SQL Server e integrações via APIs." +  
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

// ====== Helpers ======
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

function esc(s) {
    return String(s)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), 2200);
}

function nowClock() {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
}

// ====== UI init ======
$("#pName").textContent = PROFILE.name;
$("#pRole").textContent = PROFILE.role;
$("#emailText").textContent = PROFILE.email;
$("#availabilityPill").textContent = `status: ${PROFILE.availability}`;
$("#statYears").textContent = PROFILE.years;
$("#statProjects").textContent = String(PROFILE.totalProjects);
$("#hostPill").textContent = `dev@${PROFILE.name.toLowerCase().replace(/\s+/g, "") || "portfolio"}`;
$("#clock").textContent = nowClock();
setInterval(() => $("#clock").textContent = nowClock(), 10000);

// ====== Terminal engine ======
const screen = $("#screen");
const input = $("#cmd");
const ps1 = $("#ps1");

const history = [];
let hIndex = -1;

const themes = ["dark", "amber", "matrix", "cyberpunk", "ice", "blood", "paper", "solar"];
function setTheme(t) {
    document.body.setAttribute("data-theme", t);
    localStorage.setItem("termTheme", t);
    toast(`tema: ${t}`);
}
const savedTheme = localStorage.getItem("termTheme");
if (savedTheme && themes.includes(savedTheme)) setTheme(savedTheme);

function print(prompt, html) {
    const div = document.createElement("div");
    div.className = "line";
    div.innerHTML = `
        <div class="prompt">${esc(prompt)}</div>
        <div class="out">${html}</div>
      `;
    screen.appendChild(div);
    screen.scrollTop = screen.scrollHeight;
}

function printOut(html) {
    const div = document.createElement("div");
    div.className = "line";
    div.innerHTML = `<div class="prompt"></div><div class="out">${html}</div>`;
    screen.appendChild(div);
    screen.scrollTop = screen.scrollHeight;
}

function banner() {
    const b =
        `<span class="ok">✓</span> Bem-vindo(a), <span class="hot">${esc(PROFILE.name)}</span>.\n` +
        `Digite <span class="linkish" data-cmd="help">help</span> para comandos.\n` +
        `<span class="dim">Dica:</span> <span class="linkish" data-cmd="projects">projects</span> e depois <span class="linkish" data-cmd="open 1">open 1</span>.`;
    printOut(b.replaceAll("\n", "<br>"));
}

function help() {
    const html =
        `<span class="ok">╭─ Comandos ───────────────────────────────╮</span><br><br>` +
        `  <span class="linkish" data-cmd="help">help</span>            <span class="dim">mostra esta ajuda</span><br>` +
        `  <span class="linkish" data-cmd="about">about</span>           <span class="dim">resumo profissional</span><br>` +
        `  <span class="linkish" data-cmd="stack">stack</span>           <span class="dim">lista skills & stack</span><br>` +
        `  <span class="linkish" data-cmd="projects">projects</span>        <span class="dim">lista projetos</span><br>` +
        `  <span style="color:var(--cyan)">open &lt;id&gt;</span>       <span class="dim">detalhes do projeto (ex: open 2)</span><br>` +
        `  <span class="linkish" data-cmd="links">links</span>           <span class="dim">github / linkedin / whatsapp</span><br>` +
        `  <span class="linkish" data-cmd="copy email">copy email</span>      <span class="dim">copia e-mail</span><br>` +
        `  <span class="linkish" data-cmd="theme">theme</span>           <span class="dim">alterna tema</span><br>` +
        `  <span class="linkish" data-cmd="clear">clear</span>           <span class="dim">limpa a tela</span><br><br>` +
        `  <span class="dim">atalhos: ↑ / ↓ histórico · Tab autocomplete</span><br><br>` +
        `<span class="ok">╰──────────────────────────────────────────╯</span>`;
    printOut(html);
}

function about() {
    const txt = PROFILE.about
        + `\n\nLocal: ${PROFILE.location}`
        + `\nDisponibilidade: ${PROFILE.availability}`;
    printOut(esc(txt).replaceAll("\n", "<br>"));
}

function stack() {
    let html = `<span class="ok">╭─ Skills & Stack ─────────────────────────╮</span><br><br>`;
    for (const [k, arr] of Object.entries(STACK)) {
        html += `  <span class="warn">▸ ${esc(k)}</span><br>`;
        html += `    ${arr.map(s => `<span class="dim">⬥</span> <span style="color:var(--cyan)">${esc(s)}</span>`).join("  ")}<br><br>`;
    }
    html += `<span class="ok">╰──────────────────────────────────────────╯</span>`;
    printOut(html);
}

function projects() {
    if (!PROJECTS.length) {
        printOut(`<span class="warn">Nenhum projeto cadastrado.</span>`);
        return;
    }
    let html = `<span class="ok">╭─ Projetos ───────────────────────────────╮</span><br>`;
    html += `<span class="dim">  use </span><span class="linkish" data-cmd="open 1">open &lt;id&gt;</span><span class="dim"> para detalhes</span><br><br>`;
    PROJECTS.forEach((p, i) => {
        html += `  <span class="warn">[${i + 1}]</span> <span class="ok">${esc(p.title)}</span><br>`;
        html += `      <span class="dim">${esc(p.what)}</span><br>`;
        html += `      <span class="dim">stack:</span> <span style="color:var(--cyan)">${esc(p.stack.join(" · "))}</span><br>`;
        if (i < PROJECTS.length - 1) html += `<br>`;
    });
    html += `<br>  <span class="dim">▸</span> <a class="linkish" href="${esc(PROFILE.github)}" target="_blank" rel="noreferrer">ver mais projetos no GitHub</a><br><br>`;
    html += `<span class="ok">╰──────────────────────────────────────────╯</span>`;
    printOut(html);
}

function openProject(id) {
    const i = Number(id) - 1;
    const p = PROJECTS[i];
    if (!p) {
        printOut(`<span class="warn">Projeto não encontrado. Use <span class="linkish" data-cmd="projects">projects</span>.</span>`);
        return;
    }
    const html =
        `<span class="ok">╭─ Projeto [${i + 1}] ──────────────────────────────╮</span><br><br>` +
        `  <span class="ok">⚡ ${esc(p.title)}</span><br><br>` +
        `  <span class="dim">○ Descrição:</span>  ${esc(p.what)}<br>` +
        `  <span class="dim">○ Impacto:</span>    ${esc(p.impact)}<br>` +
        `  <span class="dim">○ Stack:</span>      <span style="color:var(--cyan)">${esc(p.stack.join(" · "))}</span><br>` +
        `  <span class="dim">○ Tags:</span>       <span style="color:var(--pink)">${esc(p.tags.join(" · "))}</span><br><br>` +
        `  <span class="dim">○ Links:</span>      <a class="linkish" href="${esc(p.demo)}" target="_blank" rel="noreferrer">▸ demo</a>  ·  <a class="linkish" href="${esc(p.repo)}" target="_blank" rel="noreferrer">▸ código</a><br><br>` +
        `<span class="ok">╰──────────────────────────────────────────╯</span>`;
    printOut(html);
}

function links() {
    const html =
        `<span class="ok">╭─ Links ──────────────────────────────────╮</span><br><br>` +
        `  <span class="dim">▸ github:</span>    <a class="linkish" href="${esc(PROFILE.github)}" target="_blank" rel="noreferrer">github.com/akiramath</a><br>` +
        `  <span class="dim">▸ linkedin:</span>  <a class="linkish" href="${esc(PROFILE.linkedin)}" target="_blank" rel="noreferrer">linkedin.com/in/matheus-mansano</a><br>` +
        `  <span class="dim">▸ whatsapp:</span>  <a class="linkish" href="${esc(PROFILE.whatsapp)}" target="_blank" rel="noreferrer">enviar mensagem</a><br><br>` +
        `<span class="ok">╰──────────────────────────────────────────╯</span>`;
    printOut(html);
}

async function copyEmail() {
    try {
        await navigator.clipboard.writeText(PROFILE.email);
        printOut(`<span class="ok">E-mail copiado:</span> <span class="dim">${esc(PROFILE.email)}</span>`);
        toast("Copiado!");
    } catch {
        printOut(`<span class="warn">Não consegui copiar automaticamente.</span> <span class="dim">E-mail: ${esc(PROFILE.email)}</span>`);
    }
}

function clear() {
    screen.innerHTML = "";
    banner();
}

function theme(arg) {
    const cur = document.body.getAttribute("data-theme") || themes[0];

    // theme <nome>
    if (arg) {
        const wanted = String(arg).toLowerCase();
        if (themes.includes(wanted)) {
            setTheme(wanted);
            printOut(`<span class="ok">Tema aplicado:</span> <span class="dim">${esc(wanted)}</span>`);
        } else {
            printOut(
                `<span class="warn">Tema inválido:</span> <span class="dim">${esc(wanted)}</span><br>` +
                `<span class="dim">Disponíveis:</span> ${themes.map(t => `<span class="linkish" data-cmd="theme ${esc(t)}">${esc(t)}</span>`).join(" · ")}`
            );
        }
        return;
    }

    // theme (sem args) -> cicla na lista
    const idx = themes.indexOf(cur);
    const next = themes[(idx >= 0 ? idx + 1 : 1) % themes.length];

    setTheme(next);
    printOut(`<span class="ok">Tema alternado:</span> <span class="dim">${esc(next)}</span>`);
}

const COMMANDS = {
    help,
    about,
    stack,
    projects,
    links,
    contact: links,
    clear,
    theme,
};

function run(raw) {
    const cmdline = (raw || "").trim();
    if (!cmdline) return;

    history.push(cmdline);
    hIndex = history.length;

    const prompt = ps1.textContent;
    print(prompt, esc(cmdline));

    const [cmd, ...args] = cmdline.split(/\s+/);
    const c = cmd.toLowerCase();

    if (c === "open") {
        return openProject(args[0]);
    }
    if (c === "copy" && (args[0] || "").toLowerCase() === "email") {
        return copyEmail();
    }
    if (c in COMMANDS) {
        return COMMANDS[c](args[0]);
    }

    const msg =
        `Comando não reconhecido: ${cmdline}
        Digite 'help' para ver os comandos.`;
    printOut(`<span class="warn">${esc(msg).replaceAll("\n", "<br>")}</span>`);
}

// ====== Autocomplete (Tab) ======
function autocomplete() {
    const v = input.value.trimStart();
    const parts = v.split(/\s+/);
    const first = (parts[0] || "").toLowerCase();

    // completa primeiro token
    if (parts.length <= 1) {
        const pool = Object.keys(COMMANDS).concat(["open", "copy", "copy email", "projects", "about", "stack", "links", "clear", "theme", "help"]);
        const matches = pool.filter(x => x.startsWith(first));
        if (matches.length === 1) {
            input.value = matches[0] + " ";
        } else if (matches.length > 1) {
            printOut(`<span class="dim">Sugestões:</span> ${matches.map(m => `<span class="linkish" data-cmd="${esc(m)}">${esc(m)}</span>`).join(" · ")}`);
        }
        return;
    }

    // completa tema
    if (first === "theme" && parts.length === 2) {
        const a = (parts[1] || "").toLowerCase();
        const matches = themes.filter(t => t.startsWith(a));
        if (matches.length === 1) {
            input.value = `theme ${matches[0]}`;
        }
    }
}

// ====== Bindings ======
input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        const v = input.value;
        input.value = "";
        run(v);
    } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (history.length) {
            hIndex = Math.max(0, hIndex - 1);
            input.value = history[hIndex] || "";
            setTimeout(() => input.setSelectionRange(input.value.length, input.value.length), 0);
        }
    } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (history.length) {
            hIndex = Math.min(history.length, hIndex + 1);
            input.value = history[hIndex] || "";
        }
    } else if (e.key === "Tab") {
        e.preventDefault();
        autocomplete();
    }
});

// clique em comandos “linkish”
screen.addEventListener("click", (e) => {
    const t = e.target;
    if (t && t.classList && t.classList.contains("linkish") && t.dataset.cmd) {
        run(t.dataset.cmd);
        input.focus();
    }
});

// Botões top
$("#btnHelp").addEventListener("click", () => run("help"));
$("#btnProjects").addEventListener("click", () => run("projects"));
$("#btnTheme").addEventListener("click", () => run("theme"));
$("#btnClear").addEventListener("click", () => run("clear"));

// Sidebar: email clicável (copia)
$("#emailItem").addEventListener("click", () => {
    run("copy email");
    input.focus();
});

// Sidebar: chips executam comandos
$$(".chip[data-cmd]").forEach(chip => {
    chip.addEventListener("click", () => {
        run(chip.dataset.cmd);
        input.focus();
    });
});

// ====== Audio Player ======
const bgMusic = $("#bgMusic");
const btnAudio = $("#btnAudio");
let audioPlaying = false;

function toggleAudio() {
    if (audioPlaying) {
        bgMusic.pause();
        btnAudio.classList.remove("playing");
        audioPlaying = false;
    } else {
        bgMusic.play().then(() => {
            btnAudio.classList.add("playing");
            audioPlaying = true;
        }).catch(() => {
            toast("Clique novamente para tocar a música");
        });
    }
}

btnAudio.addEventListener("click", toggleAudio);

// Tenta autoplay ao carregar a página
function tryAutoplay() {
    bgMusic.play().then(() => {
        btnAudio.classList.add("playing");
        audioPlaying = true;
    }).catch(() => {
        // Navegadores bloqueiam autoplay — toca no primeiro clique/tecla do usuário
        const startOnInteraction = () => {
            if (!audioPlaying) {
                bgMusic.play().then(() => {
                    btnAudio.classList.add("playing");
                    audioPlaying = true;
                }).catch(() => {});
            }
            document.removeEventListener("click", startOnInteraction);
            document.removeEventListener("keydown", startOnInteraction);
        };
        document.addEventListener("click", startOnInteraction, { once: false });
        document.addEventListener("keydown", startOnInteraction, { once: false });
    });
}

// Inicialização
banner();
setTimeout(() => { input.focus(); }, 250);
tryAutoplay();
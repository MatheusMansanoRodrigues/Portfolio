(() => {
    const orbit = document.getElementById("orbit");
    const toggle = document.getElementById("mode-toggle");
    const stage = document.getElementById("index");
    const site = document.querySelector(".site");
    const figmaCursor = document.getElementById("figma-cursor");
    const threeHost = document.getElementById("three-scene");
    const projectModal = document.getElementById("project-modal");
    const projectModalMedia = document.getElementById("project-modal-media");
    const projectModalTitle = document.getElementById("project-modal-title");
    const projectModalDescription = document.getElementById("project-modal-description");
    const projectModalLink = document.getElementById("project-modal-link");
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let isIntro = true;
    let isTransitioning = false;
    let stripOffset = window.innerWidth * 0.96;
    let currentVelocity = 0;
    let targetDirection = 1;
    let speedBoost = 0;
    let previousFrame = performance.now();
    let cursorX = -40;
    let cursorY = -40;
    let cursorTargetX = -40;
    let cursorTargetY = -40;
    let pointerX = 0;
    let pointerY = 0;
    let threeEffect = null;
    let hoverPaused = false;
    let isProjectModalOpen = false;
    let lastFocusedProject = null;

    const originals = [...orbit.querySelectorAll(".project")];
    originals.forEach((project, index) => {
        project.style.setProperty("--track", index);

        const clone = project.cloneNode(true);
        clone.classList.add("project-clone");
        clone.style.setProperty("--track", index + originals.length);
        clone.setAttribute("aria-hidden", "true");
        clone.tabIndex = -1;
        orbit.appendChild(clone);
    });
    const projects = [...orbit.querySelectorAll(".project")];

    // Start with spinning orbit
    orbit.classList.add("spinning");

    const createThreeEffect = () => {
        if (reducedMotion || !window.THREE || !threeHost) return null;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 30);
        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: Math.min(devicePixelRatio, 2) <= 1.5,
            powerPreference: "high-performance"
        });
        const group = new THREE.Group();
        const stripGroup = new THREE.Group();
        const materials = [];

        camera.position.z = 6.2;
        renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        renderer.setSize(innerWidth, innerHeight);
        renderer.setClearColor(0x000000, 0);
        threeHost.appendChild(renderer.domElement);
        scene.add(group);
        scene.add(stripGroup);

        const knotMaterial = new THREE.MeshBasicMaterial({
            color: 0x2563eb,
            wireframe: true,
            transparent: true,
            opacity: 0.24
        });
        const knot = new THREE.Mesh(
            new THREE.TorusKnotGeometry(1.42, 0.38, 180, 18, 2, 3),
            knotMaterial
        );
        knot.rotation.x = Math.PI * 0.5;
        group.add(knot);
        materials.push(knotMaterial);

        const haloMaterial = new THREE.MeshBasicMaterial({
            color: 0x0a0a0a,
            transparent: true,
            opacity: 0.16
        });
        const halo = new THREE.Mesh(
            new THREE.TorusGeometry(2.05, 0.008, 6, 180),
            haloMaterial
        );
        halo.rotation.x = Math.PI * 0.68;
        halo.rotation.y = Math.PI * 0.12;
        group.add(halo);
        materials.push(haloMaterial);

        const particleCount = innerWidth < 700 ? 520 : 1100;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const blue = new THREE.Color(0x2563eb);
        const black = new THREE.Color(0x0a0a0a);

        for (let index = 0; index < particleCount; index++) {
            const progress = index / particleCount;
            const angle = progress * Math.PI * 24;
            const radius = 1.8 + Math.sin(index * 1.73) * 0.65 + Math.random() * 0.35;
            const vertical = (progress - 0.5) * 4.6;
            const offset = index * 3;
            const color = index % 5 === 0 ? black : blue;

            positions[offset] = Math.cos(angle) * radius;
            positions[offset + 1] = vertical + Math.sin(angle * 0.5) * 0.34;
            positions[offset + 2] = Math.sin(angle) * radius;
            colors[offset] = color.r;
            colors[offset + 1] = color.g;
            colors[offset + 2] = color.b;
        }

        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

        const particleMaterial = new THREE.PointsMaterial({
            size: innerWidth < 700 ? 0.026 : 0.018,
            vertexColors: true,
            transparent: true,
            opacity: 0.5,
            sizeAttenuation: true
        });
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        particles.rotation.z = Math.PI * 0.5;
        group.add(particles);
        materials.push(particleMaterial);

        const gridGeometry = new THREE.PlaneGeometry(14, 3.6, 42, 10);
        const gridBasePositions = Float32Array.from(gridGeometry.attributes.position.array);
        const gridMaterial = new THREE.MeshBasicMaterial({
            color: 0x2563eb,
            wireframe: true,
            transparent: true,
            opacity: 0,
            depthWrite: false
        });
        const grid = new THREE.Mesh(gridGeometry, gridMaterial);
        grid.position.z = -1.4;
        stripGroup.add(grid);

        const streakCount = innerWidth < 700 ? 50 : 110;
        const streakPositions = new Float32Array(streakCount * 6);
        for (let index = 0; index < streakCount; index++) {
            const offset = index * 6;
            const x = (Math.random() - 0.5) * 15;
            const y = (Math.random() - 0.5) * 4.4;
            const z = -0.8 - Math.random() * 2.8;
            const length = 0.08 + Math.random() * 0.32;
            streakPositions.set([x, y, z, x + length, y, z], offset);
        }
        const streakGeometry = new THREE.BufferGeometry();
        streakGeometry.setAttribute("position", new THREE.BufferAttribute(streakPositions, 3));
        const streakMaterial = new THREE.LineBasicMaterial({
            color: 0x0a0a0a,
            transparent: true,
            opacity: 0
        });
        const streaks = new THREE.LineSegments(streakGeometry, streakMaterial);
        stripGroup.add(streaks);

        const projectIntroCards = () => {
            group.updateMatrixWorld(true);
            knot.updateMatrixWorld(true);

            projects.slice(0, originals.length).forEach((project, index) => {
                const t = (index / originals.length) * Math.PI * 2 + performance.now() * 0.00034;
                const majorRadius = 1.42;
                const minorRadius = 0.38;
                const p = 2;
                const q = 3;
                const point = new THREE.Vector3(
                    (majorRadius + minorRadius * Math.cos(q * t)) * Math.cos(p * t),
                    (majorRadius + minorRadius * Math.cos(q * t)) * Math.sin(p * t),
                    minorRadius * Math.sin(q * t)
                );
                const nextT = t + 0.025;
                const nextPoint = new THREE.Vector3(
                    (majorRadius + minorRadius * Math.cos(q * nextT)) * Math.cos(p * nextT),
                    (majorRadius + minorRadius * Math.cos(q * nextT)) * Math.sin(p * nextT),
                    minorRadius * Math.sin(q * nextT)
                );

                point.applyMatrix4(knot.matrixWorld);
                nextPoint.applyMatrix4(knot.matrixWorld);
                const worldDepth = point.z;
                point.project(camera);
                nextPoint.project(camera);

                const x = point.x * innerWidth * 0.5;
                const y = -point.y * innerHeight * 0.5;
                const nextX = nextPoint.x * innerWidth * 0.5;
                const nextY = -nextPoint.y * innerHeight * 0.5;
                const depth = THREE.MathUtils.clamp(0.9 + worldDepth * 0.12, 0.76, 1.12);
                const rotation = Math.atan2(nextY - y, nextX - x) * 180 / Math.PI;

                project.style.setProperty("--intro-x", `${x.toFixed(2)}px`);
                project.style.setProperty("--intro-y", `${y.toFixed(2)}px`);
                project.style.setProperty("--intro-scale", depth.toFixed(3));
                project.style.setProperty("--intro-rotate", `${(rotation * 0.18).toFixed(2)}deg`);
                project.style.zIndex = String(Math.round(20 + worldDepth * 8));
            });
        };

        return {
            renderer,
            scene,
            camera,
            group,
            knot,
            halo,
            particles,
            stripGroup,
            grid,
            gridBasePositions,
            gridMaterial,
            streaks,
            streakMaterial,
            materials,
            transition: 0,
            transitionTarget: 0,
            resize() {
                camera.aspect = innerWidth / innerHeight;
                camera.updateProjectionMatrix();
                renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
                renderer.setSize(innerWidth, innerHeight);
            },
            exit() {
                this.transitionTarget = 1;
                threeHost.classList.add("is-exiting");
            },
            render(time, elapsed) {
                const easing = 1 - Math.exp(-elapsed / 300);
                this.transition += (this.transitionTarget - this.transition) * easing;

                const drift = time * 0.00018;
                this.group.rotation.y = drift + pointerX * 0.16;
                this.group.rotation.x += ((pointerY * -0.12) - this.group.rotation.x) * 0.035;
                this.knot.rotation.z = time * 0.00012;
                this.knot.rotation.y = time * 0.00009;
                this.halo.rotation.z = -time * 0.00016;
                this.particles.rotation.x = time * 0.000035;

                const scale = 1 + this.transition * 1.65;
                this.group.scale.setScalar(scale);
                this.group.position.z = this.transition * 0.9;
                this.materials.forEach((material) => {
                    material.opacity = material.userData.baseOpacity
                        ? material.userData.baseOpacity * (1 - this.transition)
                        : material.opacity;
                });

                this.gridMaterial.opacity = 0.09 * this.transition;
                this.streakMaterial.opacity = 0.22 * this.transition;
                this.stripGroup.rotation.x += ((pointerY * -0.035) - this.stripGroup.rotation.x) * 0.04;
                this.stripGroup.rotation.y += ((pointerX * 0.045) - this.stripGroup.rotation.y) * 0.04;
                this.streaks.position.x = -((time * 0.00022) % 0.9);

                const gridPositions = this.grid.geometry.attributes.position;
                for (let index = 0; index < gridPositions.count; index++) {
                    const offset = index * 3;
                    const x = this.gridBasePositions[offset];
                    const y = this.gridBasePositions[offset + 1];
                    gridPositions.setZ(
                        index,
                        Math.sin(x * 0.85 + time * 0.0012 + y * 1.2) * 0.13
                    );
                }
                gridPositions.needsUpdate = true;

                if (isIntro) {
                    projectIntroCards();
                }

                renderer.render(scene, camera);
            }
        };
    };

    threeEffect = createThreeEffect();
    if (threeEffect) {
        threeEffect.materials.forEach((material) => {
            material.userData.baseOpacity = material.opacity;
        });
    } else {
        document.body.classList.add("three-unavailable");
    }

    const stageCardsHorizontally = () => {
        const spacing = Math.min(innerWidth * 0.09, 112);

        originals.forEach((project, index) => {
            const x = (index - (originals.length - 1) / 2) * spacing;
            project.style.setProperty("--intro-x", `${x.toFixed(2)}px`);
            project.style.setProperty("--intro-y", "0px");
            project.style.setProperty("--intro-scale", "1");
            project.style.setProperty("--intro-rotate", "0deg");
            project.style.zIndex = String(20 - index);
            project.style.setProperty("--card-wave", "0px");
            project.style.setProperty("--card-tilt", "0deg");
            project.style.setProperty("--card-scale", "1");
        });
    };

    const openProjectModal = (project) => {
        if (!project || !projectModal || isIntro || isTransitioning) return;

        const sourceMedia = project.querySelector("img, video");
        const title = project.dataset.title
            || project.querySelector(".project-label")?.textContent?.split("—")[0]?.trim()
            || "Projeto";
        const description = project.dataset.description || "";
        const href = project.getAttribute("href") || "#";
        const sameProject = lastFocusedProject
            && lastFocusedProject.dataset.title === project.dataset.title
            && lastFocusedProject.getAttribute("href") === href;

        if (isProjectModalOpen && sameProject) {
            hoverPaused = true;
            currentVelocity = 0;
            speedBoost = 0;
            document.body.classList.add("cards-paused", "project-modal-open");
            return;
        }

        projectModalMedia.replaceChildren();
        if (sourceMedia) {
            const media = sourceMedia.cloneNode(true);
            media.removeAttribute("id");
            if (media.tagName === "VIDEO") {
                media.muted = true;
                media.loop = true;
                media.autoplay = true;
                media.playsInline = true;
                media.controls = true;
            }
            projectModalMedia.appendChild(media);
            if (media.tagName === "VIDEO") {
                media.play().catch(() => {});
            }
        }

        projectModalTitle.textContent = title;
        projectModalDescription.textContent = description;
        projectModalLink.href = href;

        lastFocusedProject = project;
        isProjectModalOpen = true;
        hoverPaused = true;
        currentVelocity = 0;
        speedBoost = 0;
        document.body.classList.add("cards-paused", "project-modal-open");
        projectModal.setAttribute("aria-hidden", "false");
        requestAnimationFrame(() => projectModal.classList.add("is-open"));
    };

    const closeProjectModal = () => {
        if (!isProjectModalOpen || !projectModal) return;

        isProjectModalOpen = false;
        projectModal.classList.remove("is-open");
        projectModal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("project-modal-open");

        const stillHovering = projects.some((item) => item.matches(":hover"));
        hoverPaused = stillHovering;
        document.body.classList.toggle("cards-paused", stillHovering);

        const modalVideo = projectModalMedia.querySelector("video");
        modalVideo?.pause();
        setTimeout(() => {
            if (!isProjectModalOpen) projectModalMedia.replaceChildren();
        }, 350);

        lastFocusedProject?.focus({ preventScroll: true });
    };

    const exitIntro = () => {
        if (!isIntro) return;
        isIntro = false;
        orbit.classList.remove("spinning");
        site.classList.remove("intro-mode");
        threeEffect?.exit();
        stageCardsHorizontally();

        if (reducedMotion) {
            document.body.classList.remove("orbiting");
            document.body.classList.add("scrolling");
            orbit.style.transform = `translate3d(${stripOffset}px, 0, 0)`;
            return;
        }

        isTransitioning = true;
        document.body.classList.add("transitioning");

        // Congela linha reta e só depois abre a faixa horizontal.
        requestAnimationFrame(() => {
            document.body.classList.remove("orbiting");
            document.body.classList.add("scrolling");
            orbit.style.transform = `translate3d(${stripOffset}px, 0, 0)`;
        });

        setTimeout(() => {
            isTransitioning = false;
            document.body.classList.remove("transitioning");
            document.body.classList.add("cards-active");
        }, 1100);
    };

    const setDirection = (direction) => {
        targetDirection = direction === 'up' ? -1 : 1;
    };

    window.addEventListener("wheel", (event) => {
        if (isIntro) {
            exitIntro();
        }

        if (hoverPaused) return;

        if (event.deltaY !== 0) {
            setDirection(event.deltaY > 0 ? 'down' : 'up');
            const delta = Math.abs(event.deltaY) * (event.deltaMode === 1 ? 16 : 1);
            speedBoost = Math.min(4, speedBoost + Math.min(delta / 90, 1.6));
        }
    }, { passive: true });

    toggle.addEventListener("click", () => {
        if (isIntro) {
            exitIntro();
        }
    });

    stage.addEventListener("click", (event) => {
        if (isIntro && !event.target.closest(".project")) {
            exitIntro();
        }
    });

    window.addEventListener("keydown", (event) => {
        if (isProjectModalOpen) {
            if (event.key === "Escape") closeProjectModal();
            return;
        }

        if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter") {
            if (isIntro) {
                exitIntro();
            }
            if (event.key !== "Enter") {
                setDirection(event.key === "ArrowDown" ? 'down' : 'up');
            }
            speedBoost = Math.max(speedBoost, 1);
        }
    });

    let touchStartY = 0;
    window.addEventListener("touchstart", (e) => {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener("touchmove", (e) => {
        if (isIntro) {
            exitIntro();
        }
        const touchY = e.touches[0].clientY;
        const delta = Math.abs(touchY - touchStartY);
        const direction = touchY > touchStartY ? 'up' : 'down';

        if (delta > 10) {
            if (!hoverPaused) {
                setDirection(direction);
                speedBoost = Math.min(3, speedBoost + delta / 45);
            }
            touchStartY = touchY;
        }
    }, { passive: true });

    window.addEventListener("mousemove", (event) => {
        cursorTargetX = event.clientX;
        cursorTargetY = event.clientY;
        pointerX = (event.clientX / innerWidth) * 2 - 1;
        pointerY = (event.clientY / innerHeight) * 2 - 1;
        figmaCursor.classList.add("visible");
        figmaCursor.classList.toggle(
            "interactive",
            Boolean(event.target.closest("a, button, .project"))
        );
    });

    document.documentElement.addEventListener("mouseleave", () => {
        figmaCursor.classList.remove("visible");
    });

    window.addEventListener("mousedown", () => figmaCursor.classList.add("pressed"));
    window.addEventListener("mouseup", () => figmaCursor.classList.remove("pressed"));
    window.addEventListener("resize", () => threeEffect?.resize());

    projects.forEach((project) => {
        project.addEventListener("mouseenter", () => {
            if (isIntro || isTransitioning) return;
            hoverPaused = true;
            currentVelocity = 0;
            speedBoost = 0;
            document.body.classList.add("cards-paused");
            openProjectModal(project);
        });

        project.addEventListener("mouseleave", () => {
            if (isProjectModalOpen) return;

            const stillHovering = projects.some((item) => item.matches(":hover"));
            hoverPaused = stillHovering;
            document.body.classList.toggle("cards-paused", stillHovering);
            if (!stillHovering) {
                currentVelocity = 0;
                speedBoost = 0;
            }
        });

        project.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (isIntro) exitIntro();
        });
    });

    projectModal?.querySelectorAll("[data-project-modal-close]").forEach((button) => {
        button.addEventListener("click", closeProjectModal);
    });

    const animateStrip = (time) => {
        const elapsed = Math.min(time - previousFrame, 50);
        previousFrame = time;

        if (!isIntro && !isTransitioning) {
            const loopDistance = window.innerWidth * (innerWidth <= 760 ? 4.32 : 1.92);
            const halfLoop = loopDistance / 2;
            const baseVelocity = reducedMotion || hoverPaused ? 0 : loopDistance / 15000;
            const targetVelocity = baseVelocity * (1 + speedBoost) * targetDirection;
            const easing = 1 - Math.exp(-elapsed / (hoverPaused ? 90 : 260));

            currentVelocity += (targetVelocity - currentVelocity) * easing;
            speedBoost *= Math.exp(-elapsed / (hoverPaused ? 120 : 420));
            stripOffset -= currentVelocity * elapsed;

            if (stripOffset < -halfLoop) stripOffset += loopDistance;
            if (stripOffset >= halfLoop) stripOffset -= loopDistance;

            orbit.style.transform = `translate3d(${stripOffset}px, 0, 0)`;
        }

        threeEffect?.render(time, elapsed);

        const cursorEasing = reducedMotion ? 1 : 1 - Math.exp(-elapsed / 28);
        cursorX += (cursorTargetX - cursorX) * cursorEasing;
        cursorY += (cursorTargetY - cursorY) * cursorEasing;
        figmaCursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;

        requestAnimationFrame(animateStrip);
    };

    requestAnimationFrame(animateStrip);
})();
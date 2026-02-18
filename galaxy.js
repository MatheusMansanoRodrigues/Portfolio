/**
 * Galáxia Three.js – fundo do hero
 * Import via CDN, tudo online
 */
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let galaxyInit = false;
function initGalaxy() {
  const container = document.getElementById("galaxyScene");
  if (!container || galaxyInit) return;

  const hero = container.closest(".hero");
  if (!hero) return;
  galaxyInit = true;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;";
  container.appendChild(renderer.domElement);

  // Textura circular branca
  const size = 128;
  const texCanvas = document.createElement("canvas");
  texCanvas.width = size;
  texCanvas.height = size;
  const tctx = texCanvas.getContext("2d");
  const cx = size / 2;
  const r = cx - 2;
  const grad = tctx.createRadialGradient(cx, cx, 0, cx, cx, r);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.4, "rgba(255,255,255,0.95)");
  grad.addColorStop(0.7, "rgba(255,255,255,0.7)");
  grad.addColorStop(1, "rgba(255,255,255,0.35)");
  tctx.beginPath();
  tctx.arc(cx, cx, r, 0, Math.PI * 2);
  tctx.fillStyle = grad;
  tctx.fill();
  const texture = new THREE.CanvasTexture(texCanvas);

  const isMobile = window.innerWidth <= 900;
  const spiralCount = isMobile ? 4000 : 25000;
  const fillCount = isMobile ? 3000 : 18000;
  const particleCount = spiralCount + fillCount;
  const positions = new Float32Array(particleCount * 3);
  const originals = new Float32Array(particleCount * 3);
  const vx = new Float32Array(particleCount);
  const vy = new Float32Array(particleCount);

  // Espiral galáctica (parte principal)
  const arms = 5;
  for (let i = 0; i < spiralCount; i++) {
    const arm = (i % arms) / arms;
    const angle = arm * Math.PI * 2 + Math.random() * 1.2;
    const radius = 0.03 + Math.pow(Math.random(), 0.9) * 0.97;
    const x = Math.cos(angle) * radius * (0.95 + Math.random() * 0.4);
    const y = Math.sin(angle) * radius * (0.95 + Math.random() * 0.4);
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = 0;
    originals[i * 3] = x;
    originals[i * 3 + 1] = y;
    originals[i * 3 + 2] = 0;
  }

  // Camada de preenchimento – estrelas uniformes para eliminar espaços pretos
  for (let i = spiralCount; i < particleCount; i++) {
    const x = (Math.random() - 0.5) * 2.2;
    const y = (Math.random() - 0.5) * 2.2;
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = 0;
    originals[i * 3] = x;
    originals[i * 3 + 1] = y;
    originals[i * 3 + 2] = 0;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    size: 0.18,
    color: 0xffffff,
    transparent: true,
    opacity: 0.9,
    sizeAttenuation: false,
    map: texture,
    depthWrite: false,
  });
  const points = new THREE.Points(geometry, material);
  scene.add(points);

  const mouse = { x: -9999, y: -9999, active: false };
  const radius = 0.28;
  const strength = 0.015;
  const returnForce = 0.045;
  const friction = 0.88;

  function resize() {
    const w = hero.clientWidth || window.innerWidth;
    const h = hero.clientHeight || window.innerHeight;
    if (w > 0 && h > 0) {
        renderer.setSize(w, h);
        const pixelRatio = w <= 900 ? Math.min(1.5, window.devicePixelRatio || 1) : Math.min(2.5, window.devicePixelRatio || 1);
        renderer.setPixelRatio(pixelRatio);
    }
  }

  function setMouse(e) {
    const rect = hero.getBoundingClientRect();
    const w = rect.width || 1;
    const h = rect.height || 1;
    mouse.x = ((e.clientX - rect.left) / w) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / h) * 2 + 1;
    mouse.active = true;
  }

  hero.addEventListener("mousemove", setMouse);
  hero.addEventListener("mouseenter", () => (mouse.active = true));
  hero.addEventListener("mouseleave", () => {
    mouse.active = false;
    mouse.x = mouse.y = -9999;
  });
  hero.addEventListener("touchstart", (e) => e.touches[0] && setMouse(e.touches[0]), { passive: true });
  hero.addEventListener("touchmove", (e) => e.touches[0] && setMouse(e.touches[0]), { passive: true });
  hero.addEventListener("touchend", () => {
    mouse.active = false;
    mouse.x = mouse.y = -9999;
  });

  function animate() {
    requestAnimationFrame(animate);
    const pos = geometry.attributes.position.array;

    for (let i = 0; i < particleCount; i++) {
      let vxi = vx[i];
      let vyi = vy[i];
      const x = pos[i * 3];
      const y = pos[i * 3 + 1];
      const ox = originals[i * 3];
      const oy = originals[i * 3 + 1];

      const dx = x - mouse.x;
      const dy = y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (mouse.active && dist < radius) {
        const t = 1 - dist / radius;
        const force = strength * (t * t);
        const nx = dx / (dist || 0.001);
        const ny = dy / (dist || 0.001);
        vxi += nx * force;
        vyi += ny * force;
      }

      vxi += (ox - x) * returnForce;
      vyi += (oy - y) * returnForce;
      vxi *= friction;
      vyi *= friction;

      pos[i * 3] = x + vxi;
      pos[i * 3 + 1] = y + vyi;
      vx[i] = vxi;
      vy[i] = vyi;
    }
    geometry.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
  }

  resize();
  setTimeout(resize, 100);
  window.addEventListener("resize", resize);
  animate();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGalaxy);
} else {
  initGalaxy();
}
window.addEventListener("load", () => setTimeout(initGalaxy, 50));

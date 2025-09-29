// Utility: throttle
const throttle = (fn, wait = 16) => {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= wait) {
      last = now;
      fn(...args);
    }
  };
};

// ===== Theme handling =====
const themeKey = "bp-theme";
const body = document.body;
const prefersDarkMedia = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
const prefersDark = prefersDarkMedia ? prefersDarkMedia.matches : true;

const setDocumentTheme = (mode) => {
  const themeClass = mode === "light" ? "theme-light" : "theme-dark";
  body.classList.remove("theme-light", "theme-dark");
  body.classList.add(themeClass);
  document.documentElement.style.colorScheme = mode === "light" ? "light" : "dark";
};

const storedTheme = localStorage.getItem(themeKey);
const initialTheme = storedTheme || (prefersDark ? "dark" : "light");
setDocumentTheme(initialTheme);

const themeToggleBtn = document.getElementById("themeToggle");
if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", () => {
    const next = body.classList.contains("theme-light") ? "dark" : "light";
    localStorage.setItem(themeKey, next);
    setDocumentTheme(next);
    syncParticlePalette();
  });
}

if (prefersDarkMedia?.addEventListener) {
  prefersDarkMedia.addEventListener("change", (event) => {
    if (!storedTheme) {
      const mode = event.matches ? "dark" : "light";
      setDocumentTheme(mode);
      syncParticlePalette();
    }
  });
}

// ===== Year =====
const yearEl = document.getElementById("year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

// ===== Smooth scrolling for anchor links =====
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (event) => {
    const id = anchor.getAttribute("href");
    if (id.length > 1) {
      const target = document.querySelector(id);
      if (target) {
        event.preventDefault();
        const offset = window.innerWidth < 600 ? 60 : 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }
  });
});

// ===== Scroll reveal =====
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("reveal");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.18, rootMargin: "0px 0px -40px 0px" });

document.querySelectorAll("[data-animate]").forEach((el) => revealObserver.observe(el));

// ===== Counter animation =====
const metricCounters = document.querySelectorAll(".count");
const animateCount = (el) => {
  const target = Number(el.dataset.count || 0);
  const start = performance.now();
  const duration = 1400;

  const step = (now) => {
    const progress = Math.min(1, (now - start) / duration);
    const eased = progress < 0.5
      ? 2 * progress * progress
      : -1 + (4 - 2 * progress) * progress;
    el.textContent = Math.round(target * eased);
    if (progress < 1) requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
};

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      animateCount(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.6 });

metricCounters.forEach((el) => counterObserver.observe(el));

// ===== Tilt hover =====
const setupTilt = (el) => {
  const update = throttle((event) => {
    const rect = el.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateY = ((x - centerX) / centerX) * 6;
    const rotateX = ((centerY - y) / centerY) * 6;
    el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  }, 16);

  el.addEventListener("mousemove", update);
  el.addEventListener("mouseleave", () => {
    el.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
  });
};

document.querySelectorAll(".card-tilt").forEach(setupTilt);

// ===== Particles background =====
const canvas = document.getElementById("bg-canvas");
const ctx = canvas?.getContext("2d");
let particlePalette = { fill: "rgba(110, 231, 255, 0.08)", stroke: "rgba(155, 140, 255, 0.12)" };

const syncParticlePalette = () => {
  const isLight = body.classList.contains("theme-light");
  particlePalette = isLight
    ? { fill: "rgba(94, 96, 255, 0.08)", stroke: "rgba(0, 197, 255, 0.1)" }
    : { fill: "rgba(110, 231, 255, 0.08)", stroke: "rgba(155, 140, 255, 0.12)" };
};

let width;
let height;
let dpr;
let points = [];

const resizeCanvas = () => {
  if (!canvas || !ctx) return;
  dpr = window.devicePixelRatio || 1;
  width = canvas.width = window.innerWidth * dpr;
  height = canvas.height = window.innerHeight * dpr;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;

  const count = Math.floor((window.innerWidth * window.innerHeight) / 12000);
  points = Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.16 * dpr,
    vy: (Math.random() - 0.5) * 0.16 * dpr,
  }));
};

const drawParticles = () => {
  if (!canvas || !ctx) return;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = particlePalette.fill;
  ctx.strokeStyle = particlePalette.stroke;

  points.forEach((point) => {
    point.x += point.vx;
    point.y += point.vy;

    if (point.x < 0 || point.x > width) point.vx *= -1;
    if (point.y < 0 || point.y > height) point.vy *= -1;

    ctx.beginPath();
    ctx.arc(point.x, point.y, 1.2 * dpr, 0, Math.PI * 2);
    ctx.fill();
  });

  const maxDistance = 140 * dpr;
  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      const dx = points[i].x - points[j].x;
      const dy = points[i].y - points[j].y;
      const distSq = dx * dx + dy * dy;
      if (distSq < maxDistance * maxDistance) {
        ctx.globalAlpha = 1 - distSq / (maxDistance * maxDistance);
        ctx.beginPath();
        ctx.moveTo(points[i].x, points[i].y);
        ctx.lineTo(points[j].x, points[j].y);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  }

  requestAnimationFrame(drawParticles);
};

if (canvas && ctx) {
  syncParticlePalette();
  resizeCanvas();
  drawParticles();
  window.addEventListener("resize", throttle(resizeCanvas, 150));
}

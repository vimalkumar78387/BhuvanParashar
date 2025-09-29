// ---- Utility: throttle ----
const throttle = (fn, wait = 16) => {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= wait) { last = now; fn(...args); }
  };
};

// ---- Theme toggle (dark default) ----
const themeKey = "theme-pref";
const applyTheme = t => document.body.className = t === "light" ? "theme-light" : "theme-dark";
applyTheme(localStorage.getItem(themeKey) || "dark");
document.getElementById("themeToggle").addEventListener("click", () => {
  const next = document.body.classList.contains("theme-light") ? "dark" : "light";
  localStorage.setItem(themeKey, next);
  applyTheme(next);
});

// ---- Year ----
document.getElementById("year").textContent = new Date().getFullYear();

// ---- Smooth anchor offset for sticky header ----
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener("click", e => {
    const id = a.getAttribute("href");
    if (id.length > 1) {
      e.preventDefault();
      const el = document.querySelector(id);
      const y = el.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  });
});

// ---- Scroll reveal ----
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("reveal"); });
}, { threshold: 0.14 });
document.querySelectorAll("[data-animate]").forEach(el => io.observe(el));

// ---- Counter animation ----
const countEls = document.querySelectorAll(".count");
const animateCount = el => {
  const end = Number(el.dataset.count || 0);
  const startTime = performance.now();
  const dur = 1200;
  const tick = now => {
    const p = Math.min(1, (now - startTime) / dur);
    el.textContent = Math.round(end * (0.2 + 0.8 * p));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};
const io2 = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { animateCount(e.target); io2.unobserve(e.target);} });
});
countEls.forEach(el => io2.observe(el));

// ---- Tilt hover for cards/videos ----
const tilt = (el) => {
  const r = el.getBoundingClientRect();
  const cx = r.width / 2, cy = r.height / 2;
  const onMove = throttle((e) => {
    const x = (e.clientX - r.left) - cx;
    const y = (e.clientY - r.top) - cy;
    el.style.transform = `perspective(900px) rotateX(${(-y/cy)*6}deg) rotateY(${(x/cx)*6}deg)`;
  }, 16);
  el.addEventListener("mousemove", onMove);
  el.addEventListener("mouseleave", () => el.style.transform = "perspective(900px) rotateX(0) rotateY(0)");
};
document.querySelectorAll(".card-tilt").forEach(tilt);

// ---- Minimal particles background ----
const canvas = document.getElementById("bg-canvas");
const ctx = canvas.getContext("2d");
let w, h, dpr, pts;
function resize() {
  dpr = window.devicePixelRatio || 1;
  w = canvas.width = innerWidth * dpr;
  h = canvas.height = innerHeight * dpr;
  canvas.style.width = innerWidth + "px";
  canvas.style.height = innerHeight + "px";
  // points
  const count = Math.floor((innerWidth * innerHeight) / 12000);
  pts = Array.from({length: count}, () => ({
    x: Math.random()*w, y: Math.random()*h,
    vx: (Math.random()-.5)*.15*dpr, vy: (Math.random()-.5)*.15*dpr
  }));
}
function draw() {
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle = "rgba(125, 210, 255, .08)";
  ctx.strokeStyle = "rgba(155, 140, 255, .1)";
  pts.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    if (p.x<0||p.x>w) p.vx*=-1; if (p.y<0||p.y>h) p.vy*=-1;
    ctx.beginPath(); ctx.arc(p.x, p.y, 1.2*dpr, 0, Math.PI*2); ctx.fill();
  });
  // lines
  for (let i=0;i<pts.length;i++){
    for (let j=i+1;j<pts.length;j++){
      const dx = pts[i].x-pts[j].x, dy = pts[i].y-pts[j].y;
      const dist2 = dx*dx + dy*dy, max = 120*dpr;
      if (dist2 < max*max){
        ctx.globalAlpha = 1 - dist2/(max*max);
        ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  }
  requestAnimationFrame(draw);
}
window.addEventListener("resize", resize);
resize(); draw();

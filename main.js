/* ============================================================
   CEIMAM — Main JS
   Scroll reveal + Mobile nav toggle + Active link
   ============================================================ */

// ── Scroll-reveal via IntersectionObserver ─────────────────
(function () {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
})();

// ── Mobile nav toggle ──────────────────────────────────────
(function () {
  const toggle = document.querySelector('.nav__toggle');
  const links  = document.querySelector('.nav__links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    links.classList.toggle('open');
    const isOpen = links.classList.contains('open');
    toggle.setAttribute('aria-expanded', isOpen);
  });

  // Close on link click
  links.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => links.classList.remove('open'));
  });
})();

// ── Hero canvas — CEIMAM Partículas (orbital, fiel ao design) ─
(function () {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, raf;

  // Mulberry32 PRNG — idêntico ao design original
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let tv = Math.imul(a ^ (a >>> 15), 1 | a);
      tv = tv + Math.imul(tv ^ (tv >>> 7), 61 | tv) ^ tv;
      return ((tv ^ (tv >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Parâmetros exatos do design (TWEAK_DEFAULTS + ParticulasScene)
  const COUNT    = 650;
  const SEED     = 53;
  const DURATION = 12;   // segundos por ciclo
  // Espaço SVG original: 1920×1080
  const SVG_W = 1920, SVG_H = 1080;
  const CLEAR_R  = 260;  // zona livre ao redor do logo

  let particles = [];
  let startTime = null;

  function init() {
    const rnd = mulberry32(SEED);
    particles = [];
    for (let i = 0; i < COUNT; i++) {
      particles.push({
        startAngle: rnd() * Math.PI * 2,
        startR:     CLEAR_R + rnd() * 700,
        speed:      0.04 + rnd() * 0.14,
        phase:      rnd() * Math.PI * 2,
        curl:       rnd() * 0.6 - 0.3,
        size:       0.8 + rnd() * 1.8,
        life:       rnd(),
        accent:     rnd() < 0.06,
      });
    }
  }

  function resize() {
    // Fallback para mobile onde offsetWidth pode ser 0 antes do layout
    const w = canvas.offsetWidth  || canvas.parentElement.offsetWidth  || window.innerWidth;
    const h = canvas.offsetHeight || canvas.parentElement.offsetHeight || window.innerHeight;
    W = canvas.width  = w;
    H = canvas.height = h;
  }

  function draw(timestamp) {
    if (!startTime) startTime = timestamp;
    const t = (timestamp - startTime) / 1000; // segundos

    // Se as dimensões ainda forem 0 (mobile lento), tenta resize de novo
    if (!W || !H) { resize(); raf = requestAnimationFrame(draw); return; }

    // Escala proporcional (preserveAspectRatio xMidYMid meet)
    const scale = Math.min(W / SVG_W, H / SVG_H);
    const cx = W / 2;
    const cy = H / 2;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    const tNorm = (t % DURATION) / DURATION;

    for (const p of particles) {
      // Ciclo de vida: aparece, orbita, some
      const life = (tNorm + p.life) % 1;
      let op;
      if      (life < 0.15) op = life / 0.15;
      else if (life > 0.75) op = 1 - (life - 0.75) / 0.25;
      else                  op = 1;
      op *= 0.6 * (p.accent ? 1.2 : 0.9);
      if (op <= 0.005) continue;

      // Posição orbital (igual ao SVG original, escalado)
      const a = p.startAngle
               + life * Math.PI * 2 * p.speed * 4
               + Math.sin(t * 0.3 + p.phase) * p.curl;
      const r = (p.startR + Math.sin(life * Math.PI) * 80) * scale;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;

      ctx.beginPath();
      ctx.arc(x, y, Math.max(1.2, p.size), 0, Math.PI * 2); // tamanho fixo em px, não escalado
      ctx.fillStyle = p.accent
        ? `rgba(230,57,70,${Math.min(1, op).toFixed(3)})`
        : `rgba(255,255,255,${Math.min(1, op).toFixed(3)})`;
      ctx.fill();
    }

    // Logo breathing — mesma fórmula do LogoOverlay do design
    const logo = document.querySelector('.hero__logo');
    if (logo) {
      const breath = 1 + Math.sin(t * 0.5) * 0.012;
      logo.style.transform = `scale(${breath})`;
    }

    raf = requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => {
    cancelAnimationFrame(raf);
    resize();
    raf = requestAnimationFrame(draw);
  });

  resize();
  init();
  raf = requestAnimationFrame(draw);
})();

// ── Nav transparente no topo → sólido ao rolar ─────────────
(function () {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  function update() {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }
  window.addEventListener('scroll', update, { passive: true });
  update();
})();

// ── Active nav link ────────────────────────────────────────
(function () {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__link').forEach((a) => {
    const href = a.getAttribute('href');
    if (href === current || (current === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
})();

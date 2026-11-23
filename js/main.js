/* ─────────────────────────────────────────────
   Stars Canvas  (tajmirul.site inspiration)
───────────────────────────────────────────── */
(function initStars() {
  const canvas = document.getElementById('starsCanvas');
  const ctx    = canvas.getContext('2d');
  let   stars  = [];
  const COUNT  = 420;
  const REPEL_RADIUS = 110;
  const REPEL_FORCE  = 3.5;
  const FRICTION     = 0.95;

  let mouseX = -9999, mouseY = -9999;
  window.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });
  window.addEventListener('mouseleave', () => { mouseX = -9999; mouseY = -9999; });

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function make() {
    stars = [];
    for (let i = 0; i < COUNT; i++) {
      const r = Math.random();
      stars.push({
        x:      Math.random() * canvas.width,
        y:      Math.random() * canvas.height,
        radius: r < 0.6 ? Math.random() * 0.8 + 0.2
               : r < 0.9 ? Math.random() * 1.2 + 0.8
               :            Math.random() * 1.8 + 1.2,
        opacity:      Math.random(),
        twinkleSpeed: Math.random() * 0.018 + 0.004,
        twinkleDir:   Math.random() > 0.5 ? 1 : -1,
        driftY:       Math.random() * 0.6 + 0.3,
        driftX:       (Math.random() - 0.5) * 0.04,
        vx: 0,
        vy: 0,
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    stars.forEach(s => {
      /* twinkle */
      s.opacity += s.twinkleSpeed * s.twinkleDir;
      if (s.opacity >= 1)    { s.opacity = 1;    s.twinkleDir = -1; }
      if (s.opacity <= 0.04) { s.opacity = 0.04; s.twinkleDir =  1; }

      /* mouse repulsion */
      const dx   = s.x - mouseX;
      const dy   = s.y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < REPEL_RADIUS && dist > 0) {
        const strength = (REPEL_RADIUS - dist) / REPEL_RADIUS;
        s.vx += (dx / dist) * strength * REPEL_FORCE;
        s.vy += (dy / dist) * strength * REPEL_FORCE;
      }

      /* friction — velocity decays back to normal drift */
      s.vx *= FRICTION;
      s.vy *= FRICTION;

      /* drift + repulsion velocity */
      s.x += s.driftX + s.vx;
      s.y += s.driftY + s.vy;

      if (s.y > canvas.height) s.y = 0;
      if (s.x < 0)             s.x = canvas.width;
      if (s.x > canvas.width)  s.x = 0;

      /* draw */
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${s.opacity})`;
      ctx.fill();

      /* occasional glow on larger stars */
      if (s.radius > 1.5) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius * 2.5, 0, Math.PI * 2);
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.radius * 2.5);
        g.addColorStop(0, `rgba(147,197,253,${s.opacity * 0.3})`);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.fill();
      }
    });

    requestAnimationFrame(draw);
  }

  resize();
  make();
  draw();
  window.addEventListener('resize', () => { resize(); make(); });
})();


/* ─────────────────────────────────────────────
   Rocket Cursor
───────────────────────────────────────────── */
(function initCursor() {
  const rocket = document.getElementById('cursorDot');
  const glow   = document.getElementById('cursorRing');

  let mx = 0, my = 0;
  let ex = 0, ey = 0;   // exhaust glow position (lagged)
  const LERP = 0.10;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    /* rocket nose is at offset (-40, -10) set in CSS transform,
       so setting left/top to mouse pos puts the nose on the cursor */
    rocket.style.left = mx + 'px';
    rocket.style.top  = my + 'px';

    /* exhaust particles — spawn a small ember at the flame position */
    spawnEmber(mx, my);
  });

  /* click burst */
  document.addEventListener('mousedown', () => {
    rocket.classList.add('clicked');
    glow.classList.add('clicked');
  });
  document.addEventListener('mouseup', () => {
    rocket.classList.remove('clicked');
    glow.classList.remove('clicked');
  });

  /* exhaust glow follows rocket flame (nose - 40px diag offset) */
  function tick() {
    ex += (mx - ex) * LERP;
    ey += (my - ey) * LERP;
    /* flame is lower-right of nose: ~20px right, ~20px down in -45-deg rocket */
    glow.style.left = (ex + 20) + 'px';
    glow.style.top  = (ey + 20) + 'px';
    requestAnimationFrame(tick);
  }
  tick();

  /* ── Ember / exhaust particle trail ── */
  function spawnEmber(x, y) {
    const e = document.createElement('div');
    e.style.cssText = `
      position:fixed;
      left:${x + 20 + (Math.random() * 10 - 5)}px;
      top:${y  + 20 + (Math.random() * 10 - 5)}px;
      width:${3 + Math.random() * 4}px;
      height:${3 + Math.random() * 4}px;
      border-radius:50%;
      background:${Math.random() > 0.5 ? '#f5a010' : '#ff6030'};
      pointer-events:none;
      z-index:9996;
      opacity:0.85;
      transition:opacity 0.5s ease, transform 0.5s ease;
    `;
    document.body.appendChild(e);
    requestAnimationFrame(() => {
      e.style.opacity   = '0';
      e.style.transform = `translate(${Math.random()*14-7}px, ${8 + Math.random()*12}px) scale(0.2)`;
    });
    setTimeout(() => e.remove(), 520);
  }

  /* grow glow on hover over clickable elements */
  document.querySelectorAll('a, button, .tag, .project-card, .skill-card, .contact-card')
    .forEach(el => {
      el.addEventListener('mouseenter', () => glow.classList.add('hovered'));
      el.addEventListener('mouseleave', () => glow.classList.remove('hovered'));
    });

  /* hide when leaving window */
  document.addEventListener('mouseleave', () => {
    rocket.style.opacity = '0';
    glow.style.opacity   = '0';
  });
  document.addEventListener('mouseenter', () => {
    rocket.style.opacity = '1';
    glow.style.opacity   = '1';
  });
})();


/* ─────────────────────────────────────────────
   Typing Animation  (hero role)
───────────────────────────────────────────── */
(function initTyping() {
  const el    = document.getElementById('typedText');
  const roles = [
    'Data Engineer',
    'BI Developer',
    'Data Analyst',
  ];

  let ri = 0, ci = 0, deleting = false;

  function tick() {
    const word = roles[ri];

    if (deleting) {
      el.textContent = word.slice(0, --ci);
    } else {
      el.textContent = word.slice(0, ++ci);
    }

    let delay = deleting ? 55 : 110;

    if (!deleting && ci === word.length) {
      delay = 2000;
      deleting = true;
    } else if (deleting && ci === 0) {
      deleting = false;
      ri = (ri + 1) % roles.length;
      delay = 400;
    }

    setTimeout(tick, delay);
  }

  tick();
})();


/* ─────────────────────────────────────────────
   Scroll Reveal  (abdullahw inspiration — cards
   slide up + fade in as they enter viewport)
───────────────────────────────────────────── */
(function initReveal() {
  const els = document.querySelectorAll('.reveal');

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry, idx) => {
      if (!entry.isIntersecting) return;
      /* stagger siblings */
      const siblings = [...entry.target.parentElement.querySelectorAll('.reveal:not(.visible)')];
      const delay    = siblings.indexOf(entry.target) * 80;
      setTimeout(() => entry.target.classList.add('visible'), delay);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => io.observe(el));
})();


/* ─────────────────────────────────────────────
   Animated Counters  (about stats)
───────────────────────────────────────────── */
(function initCounters() {
  const counters = document.querySelectorAll('.stat-number[data-target]');

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const target = parseInt(el.dataset.target, 10);
      let   current = 0;
      const step    = Math.ceil(target / 30);
      const id = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = current;
        if (current >= target) clearInterval(id);
      }, 40);
      io.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(c => io.observe(c));
})();


/* ─────────────────────────────────────────────
   Navbar — active link + shadow on scroll
───────────────────────────────────────────── */
(function initNavbar() {
  const navbar   = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', () => {
    /* shadow on scroll */
    navbar.style.boxShadow = window.scrollY > 10
      ? '0 4px 24px rgba(0,0,0,0.4)'
      : 'none';

    /* active section highlight */
    let current = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 120) current = s.id;
    });
    navLinks.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === `#${current}`);
    });
  });

  /* hamburger toggle */
  const hamburger = document.getElementById('hamburger');
  const linksList = document.querySelector('.nav-links');
  hamburger.addEventListener('click', () => linksList.classList.toggle('open'));
  linksList.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => linksList.classList.remove('open'));
  });
})();

/* ── Message Me popup ─────────────────────────── */
(() => {
  const ENDPOINT = 'https://formsubmit.co/ajax/neerajshah.work@gmail.com';

  const overlay = document.getElementById('msgOverlay');
  const openBtn = document.getElementById('openMsg');
  if (!overlay || !openBtn) return;
  const closeBtn = document.getElementById('closeMsg');
  const form     = document.getElementById('msgForm');
  const sent     = document.getElementById('msgSent');
  const errorEl  = document.getElementById('msgError');
  const submit   = form.querySelector('.msg-submit');
  let closeTimer;

  function open() {
    clearTimeout(closeTimer);
    form.reset();
    errorEl.textContent = '';
    form.hidden = false;
    sent.hidden = true;
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add('open'));
    document.body.style.overflow = 'hidden';
    form.querySelector('input').focus();
  }

  function close() {
    clearTimeout(closeTimer);
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => { overlay.hidden = true; }, 250);
    openBtn.focus();
  }

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !overlay.hidden) close();
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    errorEl.textContent = '';

    const data = Object.fromEntries(new FormData(form));
    if (data._honey) return;
    if (!form.checkValidity()) {
      const bad = form.querySelector(':invalid');
      const field = bad.closest('label').firstChild.textContent.trim();
      errorEl.textContent = `Please enter a valid ${field.toLowerCase()}.`;
      bad.focus();
      return;
    }

    submit.disabled = true;
    submit.textContent = 'Sending…';
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: 'New message from your portfolio',
          _template: 'table',
          _captcha: 'false',
          _replyto: data.email,
          Email: data.email,
          Mobile: data.mobile,
          Message: data.message,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || String(json.success) === 'false') throw new Error(json.message);

      form.hidden = true;
      sent.hidden = false;
      closeTimer = setTimeout(close, 2500);
    } catch {
      errorEl.textContent = 'Could not send right now. Please email me directly instead.';
    } finally {
      submit.disabled = false;
      submit.textContent = 'Send Message';
    }
  });
})();

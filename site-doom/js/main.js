/* ==========================================================================
   DOOM · dooom.online — interaction engine
   Vanilla JS. No frameworks. Pure willpower.
   ========================================================================== */
(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ========================================================================
     1. PRELOADER
     ====================================================================== */
  const preloader = $("#preloader");
  const preBar = $("#preloaderBar");
  const preStatus = $("#preloaderStatus");
  const STATUS_LINES = [
    "INITIALISING LATVERIAN GRID",
    "CALIBRATING FACEPLATE OPTICS",
    "SUMMONING DOOMBOT LEGION",
    "SEALING MYSTIC WARDS",
    "ALL HAIL DOOM",
  ];

  document.body.classList.add("is-loading");

  let pct = 0;
  let statusIdx = 0;
  const preTimer = setInterval(() => {
    pct = Math.min(100, pct + Math.random() * 16 + 6);
    if (preBar) preBar.style.width = pct + "%";
    const nextIdx = Math.min(STATUS_LINES.length - 1, Math.floor((pct / 100) * STATUS_LINES.length));
    if (nextIdx !== statusIdx && preStatus) {
      statusIdx = nextIdx;
      preStatus.textContent = STATUS_LINES[statusIdx];
    }
    if (pct >= 100) clearInterval(preTimer);
  }, 170);

  const dismissPreloader = () => {
    clearInterval(preTimer);
    if (preBar) preBar.style.width = "100%";
    if (preStatus) preStatus.textContent = STATUS_LINES[STATUS_LINES.length - 1];
    setTimeout(() => {
      preloader?.classList.add("is-done");
      document.body.classList.remove("is-loading");
      // Kick off reveals that are already in view
      revealInView();
      strikeLightning();
    }, 380);
  };

  window.addEventListener("load", () => setTimeout(dismissPreloader, 700));
  // Hard fallback so the page never gets stuck behind the loader
  setTimeout(dismissPreloader, 4200);

  /* ========================================================================
     2. CUSTOM CURSOR
     ====================================================================== */
  const cursor = $("#cursor");
  if (cursor && finePointer && !reduced) {
    const ring = $(".cursor__ring", cursor);
    const dot = $(".cursor__dot", cursor);
    let cx = innerWidth / 2, cy = innerHeight / 2;
    let rx = cx, ry = cy;

    addEventListener("mousemove", (e) => {
      cx = e.clientX; cy = e.clientY;
      if (dot) { dot.style.left = cx + "px"; dot.style.top = cy + "px"; }
    }, { passive: true });

    const loopCursor = () => {
      rx += (cx - rx) * 0.18;
      ry += (cy - ry) * 0.18;
      if (ring) { ring.style.left = rx + "px"; ring.style.top = ry + "px"; }
      requestAnimationFrame(loopCursor);
    };
    loopCursor();

    const hoverables = "a, button, input, .card, .realm, [data-tilt]";
    document.addEventListener("mouseover", (e) => {
      if (e.target.closest(hoverables)) cursor.classList.add("is-hover");
    });
    document.addEventListener("mouseout", (e) => {
      if (e.target.closest(hoverables)) cursor.classList.remove("is-hover");
    });
  }

  /* ========================================================================
     3. NAV — sticky state, mobile menu, active section
     ====================================================================== */
  const nav = $("#nav");
  const navLinks = $("#navLinks");
  const navToggle = $("#navToggle");

  navToggle?.addEventListener("click", () => {
    const open = navLinks.classList.toggle("is-open");
    navToggle.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
  });

  navLinks?.addEventListener("click", (e) => {
    if (e.target.tagName === "A") {
      navLinks.classList.remove("is-open");
      navToggle?.classList.remove("is-open");
      navToggle?.setAttribute("aria-expanded", "false");
    }
  });

  // Smooth anchor scroll with nav offset
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const offset = (nav?.offsetHeight || 72) + 14;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
    });
  });

  /* ========================================================================
     4. SCROLL — progress bar, nav stuck, to-top, timeline fill
     ====================================================================== */
  const scrollProgress = $("#scrollProgress");
  const toTop = $("#toTop");
  const timelineFill = $("#timelineFill");
  const timeline = $("#timeline");

  toTop?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  });

  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    if (scrollProgress) scrollProgress.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    nav?.classList.toggle("is-stuck", y > 24);
    toTop?.classList.toggle("is-on", y > 640);

    if (timeline && timelineFill) {
      const r = timeline.getBoundingClientRect();
      const start = innerHeight * 0.78;
      const prog = clamp((start - r.top) / (r.height || 1), 0, 1);
      timelineFill.style.height = prog * 100 + "%";
    }
  };

  let ticking = false;
  addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { onScroll(); ticking = false; });
  }, { passive: true });
  onScroll();

  /* ========================================================================
     5. REVEAL ON SCROLL
     ====================================================================== */
  const revealEls = $$("[data-reveal]");
  revealEls.forEach((el) => {
    const d = el.getAttribute("data-delay");
    if (d) el.style.setProperty("--d", d + "ms");
  });

  let revealObserver = null;
  if ("IntersectionObserver" in window && !reduced) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
          revealObserver.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  }

  function revealInView() {
    revealEls.forEach((el) => {
      if (revealObserver) {
        const r = el.getBoundingClientRect();
        if (r.top < innerHeight * 0.94 && r.bottom > 0) el.classList.add("is-in");
        else revealObserver.observe(el);
      } else {
        el.classList.add("is-in");
      }
    });
  }

  /* ========================================================================
     6. ANIMATED COUNTERS
     ====================================================================== */
  const counters = $$("[data-count]");
  const animateCount = (el) => {
    const target = parseFloat(el.getAttribute("data-count")) || 0;
    const decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    const suffix = el.getAttribute("data-suffix") || "";
    const dur = 1500;
    const t0 = performance.now();

    const step = (t) => {
      const p = clamp((t - t0) / dur, 0, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target.toFixed(decimals) + suffix;
    };
    if (reduced) { el.textContent = target.toFixed(decimals) + suffix; return; }
    requestAnimationFrame(step);
  };

  if ("IntersectionObserver" in window) {
    const cObs = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { animateCount(en.target); cObs.unobserve(en.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach((c) => cObs.observe(c));
  } else {
    counters.forEach(animateCount);
  }

  /* ========================================================================
     7. HERO MASK — mouse parallax + scroll drift
     ====================================================================== */
  const heroMask = $("#heroMask");
  const heroStage = $("#heroStage");

  if (heroMask && heroStage && finePointer && !reduced) {
    let tx = 0, ty = 0, mx = 0, my = 0;
    let rotY = 0, rotX = 0, mRotY = 0, mRotX = 0;

    heroStage.addEventListener("mousemove", (e) => {
      const r = heroStage.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      tx = nx * 46;
      ty = ny * 30;
      mRotY = nx * 16;
      mRotX = -ny * 12;
    });
    heroStage.addEventListener("mouseleave", () => {
      tx = 0; ty = 0; mRotY = 0; mRotX = 0;
    });

    const loopMask = () => {
      mx += (tx - mx) * 0.07;
      my += (ty - my) * 0.07;
      rotY += (mRotY - rotY) * 0.07;
      rotX += (mRotX - rotX) * 0.07;
      const scrollDrift = clamp(window.scrollY * 0.06, 0, 90);
      heroMask.style.transform =
        `translate(-50%, calc(-44% + ${my - scrollDrift}px)) translateX(${mx}px) ` +
        `perspective(900px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
      requestAnimationFrame(loopMask);
    };
    loopMask();
  }

  /* ========================================================================
     8. CARD TILT + spotlight
     ====================================================================== */
  if (finePointer && !reduced) {
    $$("[data-tilt]").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.style.setProperty("--mx", px * 100 + "%");
        el.style.setProperty("--my", py * 100 + "%");
        const rx = (0.5 - py) * 9;
        const ry = (px - 0.5) * 11;
        el.style.transform =
          `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-7px)`;
      });
      el.addEventListener("mouseleave", () => { el.style.transform = ""; });
    });
  }

  /* ========================================================================
     9. MAGNETIC BUTTONS
     ====================================================================== */
  if (finePointer && !reduced) {
    $$("[data-magnetic]").forEach((el) => {
      const strength = 0.32;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * strength;
        const y = (e.clientY - r.top - r.height / 2) * strength;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener("mouseleave", () => { el.style.transform = ""; });
    });
  }

  /* ========================================================================
     10. TEXT SCRAMBLE ON HOVER
     ====================================================================== */
  const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&@$*<>/\\";

  class Scramble {
    constructor(el) {
      this.el = el;
      this.original = el.textContent;
      this.frame = 0;
      this.queue = [];
      this.raf = null;
      this.el.addEventListener("mouseenter", () => this.run());
    }
    run() {
      if (reduced) return;
      const old = this.original;
      const len = Math.max(old.length, 6);
      this.queue = [];
      for (let i = 0; i < len; i++) {
        const from = old[i] || "";
        this.queue.push({
          from,
          to: old[i] || "",
          start: Math.floor(Math.random() * 8),
          end: Math.floor(Math.random() * 8) + 8,
        });
      }
      cancelAnimationFrame(this.raf);
      this.frame = 0;
      this.tick();
    }
    tick() {
      let out = "";
      let done = 0;
      for (const q of this.queue) {
        if (this.frame >= q.end) { done++; out += q.to; }
        else if (this.frame >= q.start) {
          if (!q.char || Math.random() < 0.3) q.char = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          out += `<span style="color:#00ff88">${q.char}</span>`;
        } else out += q.from;
      }
      this.el.innerHTML = out;
      if (done === this.queue.length) { this.el.textContent = this.original; return; }
      this.frame++;
      this.raf = requestAnimationFrame(() => this.tick());
    }
  }

  if (finePointer) {
    $$("[data-scramble-hover]").forEach((el) => {
      if (!el.querySelector) return;
      el.dataset.origText = el.textContent;
      new Scramble(el);
    });
  }

  /* ========================================================================
     11. COUNTDOWN — next decree (rolling 7-day cycle so it never expires)
     ====================================================================== */
  const cd = { d: $("#cdD"), h: $("#cdH"), m: $("#cdM"), s: $("#cdS") };
  if (cd.d) {
    const CYCLE = 7 * 24 * 60 * 60 * 1000;
    const anchor = Date.now() + CYCLE;
    const pad = (n) => String(n).padStart(2, "0");

    const tickDown = () => {
      let diff = anchor - Date.now();
      if (diff < 0) diff = 0;
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      cd.d.textContent = pad(d);
      cd.h.textContent = pad(h);
      cd.m.textContent = pad(m);
      cd.s.textContent = pad(s);
    };
    tickDown();
    setInterval(tickDown, 1000);
  }

  /* ========================================================================
     12. OATH FORM
     ====================================================================== */
  const oathForm = $("#oathForm");
  const oathName = $("#oathName");
  const oathNote = $("#oathNote");

  oathForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = (oathName.value || "").trim();
    oathNote.classList.remove("is-error");

    if (name.length < 2) {
      oathNote.textContent = "Doom does not acknowledge single-letter subjects. Try again.";
      oathNote.classList.add("is-error");
      oathName.focus();
      return;
    }

    const lines = [
      `VON DOOM acknowledges you, ${name}. You may serve.`,
      `The throne records ${name}. Latveria grows by one.`,
      `Sworn in. ${name} is now property of the Latverian State.`,
    ];
    const msg = lines[Math.floor(Math.random() * lines.length)];
    typeOut(oathNote, msg);
    oathName.value = "";
  });

  function typeOut(el, text) {
    if (reduced) { el.textContent = text; return; }
    el.textContent = "";
    let i = 0;
    const id = setInterval(() => {
      el.textContent = text.slice(0, ++i);
      if (i >= text.length) clearInterval(id);
    }, 26);
  }

  /* ========================================================================
     13. LIGHTNING FLASH — ambient drama for the hero
     ====================================================================== */
  const flash = $("#lightningFlash");
  function strikeLightning() {
    if (!flash || reduced) return;
    const x = 20 + Math.random() * 60;
    flash.style.setProperty("--lx", x + "%");
    flash.classList.add("is-striking");
    setTimeout(() => flash.classList.remove("is-striking"), 110);
    setTimeout(() => {
      flash.style.setProperty("--lx", (x + (Math.random() * 16 - 8)) + "%");
      flash.classList.add("is-striking");
      setTimeout(() => flash.classList.remove("is-striking"), 70);
    }, 190);
  }
  setInterval(() => { if (Math.random() < 0.55) strikeLightning(); }, 7000);

  /* ========================================================================
     14. HERO CANVAS FX — ember particles, energy web, cursor repulsion
     ====================================================================== */
  const canvas = $("#fx");
  if (canvas && !reduced) {
    const ctx = canvas.getContext("2d", { alpha: true });
    let W = 0, H = 0, dpr = 1;
    let particles = [];
    let mouse = { x: -9999, y: -9999 };
    let running = true;
    let rafId = null;

    const rand = (a, b) => a + Math.random() * (b - a);

    function resize() {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = rect.width; H = rect.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function makeParticle(spread = true) {
      const size = rand(0.7, 2.6);
      return {
        x: rand(0, W),
        y: spread ? rand(0, H) : H + rand(0, 60),
        vx: rand(-0.18, 0.18),
        vy: -rand(0.16, 0.72),
        size,
        life: 1,
        decay: rand(0.0012, 0.0042),
        hue: Math.random() < 0.16 ? 44 : 150, // gold sparks vs green embers
        wob: rand(0, Math.PI * 2),
        wobSpeed: rand(0.008, 0.03),
        alpha: rand(0.3, 0.9),
      };
    }

    function seed() {
      const count = Math.round(clamp((W * H) / 8200, 45, 150));
      particles = Array.from({ length: count }, () => makeParticle(true));
    }

    const ENERGY = [];
    function makeEnergy() {
      return {
        x1: rand(0, W), y1: rand(0, H),
        x2: rand(0, W), y2: rand(0, H),
        life: 1,
        decay: rand(0.006, 0.014),
        seed: Math.random() * 1000,
      };
    }
    for (let i = 0; i < 4; i++) ENERGY.push(makeEnergy());

    function draw() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);

      // --- energy web (faint) ---
      for (let i = ENERGY.length - 1; i >= 0; i--) {
        const e = ENERGY[i];
        e.life -= e.decay;
        if (e.life <= 0) { ENERGY[i] = makeEnergy(); continue; }

        ctx.beginPath();
        const segs = 7;
        ctx.moveTo(e.x1, e.y1);
        for (let s = 1; s <= segs; s++) {
          const t = s / segs;
          const nx = e.x1 + (e.x2 - e.x1) * t;
          const ny = e.y1 + (e.y2 - e.y1) * t;
          const jitter = Math.sin(t * 9 + e.seed + performance.now() * 0.004) * 16 * (1 - Math.abs(0.5 - t));
          ctx.lineTo(nx + jitter, ny + jitter * 0.5);
        }
        ctx.strokeStyle = `rgba(0,255,136,${0.05 * e.life})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // --- embers ---
      for (const p of particles) {
        p.wob += p.wobSpeed;
        p.x += p.vx + Math.sin(p.wob) * 0.32;
        p.y += p.vy;
        p.life -= p.decay;

        // cursor repulsion
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist2 = dx * dx + dy * dy;
        if (dist2 < 19000 && dist2 > 0.01) {
          const f = (19000 - dist2) / 19000;
          const dist = Math.sqrt(dist2);
          p.x += (dx / dist) * f * 2.6;
          p.y += (dy / dist) * f * 2.6;
        }

        if (p.life <= 0 || p.y < -20 || p.x < -30 || p.x > W + 30) {
          Object.assign(p, makeParticle(false));
          continue;
        }

        const a = p.alpha * clamp(p.life, 0, 1);
        // glow
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 5);
        g.addColorStop(0, `hsla(${p.hue},100%,62%,${a})`);
        g.addColorStop(1, `hsla(${p.hue},100%,50%,0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 5, 0, Math.PI * 2);
        ctx.fill();

        // core
        ctx.fillStyle = `hsla(${p.hue},100%,78%,${a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.62, 0, Math.PI * 2);
        ctx.fill();
      }

      rafId = requestAnimationFrame(draw);
    }

    const hero = $("#home");
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        const vis = entries[0].isIntersecting;
        if (vis && !running) { running = true; draw(); }
        else if (!vis) {
          running = false;
          cancelAnimationFrame(rafId);
        }
      }, { threshold: 0.02 }).observe(hero);
    }

    hero?.addEventListener("mousemove", (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    });
    hero?.addEventListener("mouseleave", () => { mouse.x = -9999; mouse.y = -9999; });

    let rT;
    addEventListener("resize", () => { clearTimeout(rT); rT = setTimeout(resize, 180); });

    resize();
    draw();
  }

  /* ========================================================================
     15. ACTIVE NAV LINK HIGHLIGHT
     ====================================================================== */
  const sections = $$("main section[id]");
  if ("IntersectionObserver" in window && sections.length) {
    const map = new Map();
    $$('.nav__links a[href^="#"]').forEach((a) => map.set(a.getAttribute("href").slice(1), a));

    const sObs = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        map.forEach((a) => a.classList.remove("is-active"));
        map.get(en.target.id)?.classList.add("is-active");
      });
    }, { threshold: 0.4, rootMargin: "-20% 0px -55% 0px" });
    sections.forEach((s) => sObs.observe(s));
  }
})();

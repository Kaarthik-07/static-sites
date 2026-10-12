/* ============================================================
   Pulse Studio — main.js
   Preloader, custom cursor, typewriter, nav, scroll reveal,
   counters, skill bars, parallax, form, live clock.
   Vanilla JS, no dependencies.
   ============================================================ */
(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- Preloader ---------- */
  const loader = document.getElementById("loader");
  const loaderCount = document.getElementById("loaderCount");
  const loaderBar = document.getElementById("loaderBar");

  document.body.classList.add("is-loading");

  const finishLoading = () => {
    loader.classList.add("is-done");
    document.body.classList.remove("is-loading");
    startTypewriter();
  };

  if (prefersReducedMotion) {
    loaderCount.textContent = "100";
    loaderBar.style.width = "100%";
    finishLoading();
  } else {
    let pct = 0;
    const step = () => {
      pct += Math.random() * 12 + 4;
      if (pct >= 100) {
        loaderCount.textContent = "100";
        loaderBar.style.width = "100%";
        setTimeout(finishLoading, 350);
        return;
      }
      loaderCount.textContent = String(Math.floor(pct));
      loaderBar.style.width = `${pct}%`;
      setTimeout(step, 90 + Math.random() * 110);
    };
    step();
  }

  /* ---------- Custom cursor ---------- */
  if (finePointer && !prefersReducedMotion) {
    const cursor = document.getElementById("cursor");
    const dot = document.getElementById("cursorDot");
    document.body.classList.add("has-custom-cursor");

    let mx = -100, my = -100;   // target
    let cx = -100, cy = -100;   // trailing ring

    window.addEventListener("mousemove", (e) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    });

    const loop = () => {
      cx += (mx - cx) * 0.16;
      cy += (my - cy) * 0.16;
      cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    };
    loop();

    const hoverables = document.querySelectorAll("a, button, [data-hover], input, textarea");
    hoverables.forEach((el) => {
      el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
    });
  }

  /* ---------- Typewriter ---------- */
  const tw = document.getElementById("typewriter");
  const TW_WORDS = ["experiences", "interfaces", "brands", "moments"];
  let twWord = 0;

  function startTypewriter() {
    if (!tw || prefersReducedMotion) return;

    const type = (text, done) => {
      let i = 0;
      const t = setInterval(() => {
        tw.textContent = text.slice(0, ++i);
        if (i === text.length) { clearInterval(t); setTimeout(done, 1900); }
      }, 75);
    };

    const erase = (done) => {
      const t = setInterval(() => {
        tw.textContent = tw.textContent.slice(0, -1);
        if (!tw.textContent.length) { clearInterval(t); done(); }
      }, 42);
    };

    const cycle = () => {
      twWord = (twWord + 1) % TW_WORDS.length;
      type(TW_WORDS[twWord], () => erase(cycle));
    };

    type(TW_WORDS[0], () => erase(cycle));
  }

  /* ---------- Navbar ---------- */
  const nav = document.getElementById("nav");
  const burger = document.getElementById("burger");
  const mobileMenu = document.getElementById("mobileMenu");

  window.addEventListener("scroll", () => {
    nav.classList.toggle("is-scrolled", window.scrollY > 30);
  }, { passive: true });

  burger.addEventListener("click", () => {
    const open = mobileMenu.classList.toggle("is-open");
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
  });

  mobileMenu.addEventListener("click", (e) => {
    if (e.target.tagName === "A") {
      mobileMenu.classList.remove("is-open");
      burger.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
    }
  });

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll("[data-reveal]");
  revealEls.forEach((el) => {
    if (el.dataset.delay) el.style.setProperty("--reveal-delay", `${el.dataset.delay}ms`);
  });

  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      }),
      { threshold: 0.15, rootMargin: "0px 0px -50px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Counters ---------- */
  const runCounter = (el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    const duration = 1500;
    const start = performance.now();

    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window) {
    const cio = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) { runCounter(entry.target); cio.unobserve(entry.target); }
      }),
      { threshold: 0.5 }
    );
    counters.forEach((el) => cio.observe(el));
  } else {
    counters.forEach(runCounter);
  }

  /* ---------- Skill bars ---------- */
  const skills = document.querySelectorAll("[data-skill]");

  const runSkill = (bar) => {
    const value = parseInt(bar.dataset.skill, 10);
    bar.style.width = `${value}%`;
    const label = bar.closest(".skill").querySelector("[data-skill-label]");
    if (!label) return;

    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / 1400, 1);
      label.textContent = `${Math.round(value * (1 - Math.pow(1 - p, 4)))}%`;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if ("IntersectionObserver" in window) {
    const sio = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) { runSkill(entry.target); sio.unobserve(entry.target); }
      }),
      { threshold: 0.6 }
    );
    skills.forEach((el) => sio.observe(el));
  } else {
    skills.forEach(runSkill);
  }

  /* ---------- Parallax (about media) ---------- */
  const parallaxEls = document.querySelectorAll("[data-parallax]");

  if (parallaxEls.length && !prefersReducedMotion) {
    let ticking = false;

    const update = () => {
      parallaxEls.forEach((el) => {
        const speed = parseFloat(el.dataset.parallax);
        const rect = el.getBoundingClientRect();
        const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * -speed;
        el.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
      });
      ticking = false;
    };

    window.addEventListener("scroll", () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* ---------- Contact form (client-side validation) ---------- */
  const form = document.getElementById("contactForm");
  const status = document.getElementById("formStatus");
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("cName");
    const email = document.getElementById("cEmail");
    const msg = document.getElementById("cMsg");
    let valid = true;

    [name, email, msg].forEach((f) => f.classList.remove("is-invalid"));

    if (!name.value.trim()) { name.classList.add("is-invalid"); valid = false; }
    if (!EMAIL_RE.test(email.value.trim())) { email.classList.add("is-invalid"); valid = false; }
    if (msg.value.trim().length < 10) { msg.classList.add("is-invalid"); valid = false; }

    if (!valid) {
      status.textContent = "Please fill in all fields with a valid email.";
      status.classList.add("is-error");
      return;
    }

    status.classList.remove("is-error");
    status.textContent = `Thanks ${name.value.trim()} — we'll reply within 24h ✦`;
    form.reset();
  });

  /* ---------- Live clock (footer) ---------- */
  const clock = document.getElementById("localTime");
  const tickClock = () => {
    const time = new Date().toLocaleTimeString("en-GB", { hour12: false });
    clock.textContent = `${time} LOCAL`;
  };
  tickClock();
  setInterval(tickClock, 1000);
})();

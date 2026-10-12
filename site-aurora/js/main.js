/* ============================================================
   Aurora — main.js
   Navbar, mobile menu, scroll reveal, counters, tilt, rotator,
   card spotlight, form validation, back-to-top.
   Vanilla JS, no dependencies.
   ============================================================ */
(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Navbar: solid background on scroll ---------- */
  const nav = document.getElementById("nav");
  const toTop = document.getElementById("toTop");

  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("is-scrolled", y > 24);
    toTop.classList.toggle("is-visible", y > 600);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  toTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  });

  /* ---------- Mobile menu ---------- */
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");

  navToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("is-open");
    navToggle.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
  });

  navLinks.addEventListener("click", (e) => {
    if (e.target.tagName === "A") {
      navLinks.classList.remove("is-open");
      navToggle.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });

  /* ---------- Scroll reveal (IntersectionObserver) ---------- */
  const revealEls = document.querySelectorAll("[data-reveal]");
  revealEls.forEach((el) => {
    const delay = el.dataset.delay;
    if (delay) el.style.setProperty("--reveal-delay", `${delay}ms`);
  });

  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Animated counters ---------- */
  const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

  const animateCounter = (el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const suffix = el.dataset.suffix || "";
    const duration = 1600;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const value = target * easeOutExpo(progress);
      el.textContent = value.toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window) {
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            cio.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((el) => cio.observe(el));
  } else {
    counters.forEach(animateCounter);
  }

  /* ---------- Hero word rotator ---------- */
  const rotator = document.getElementById("rotator");
  if (rotator && !prefersReducedMotion) {
    const words = ["minutes", "seconds", "one command", "a coffee break"];
    let i = 0;

    setInterval(() => {
      rotator.classList.add("is-swapping");
      setTimeout(() => {
        i = (i + 1) % words.length;
        rotator.textContent = words[i];
        rotator.classList.remove("is-swapping");
      }, 300);
    }, 2600);
  }

  /* ---------- 3D tilt on the terminal card ---------- */
  const tiltCard = document.getElementById("tiltCard");
  if (tiltCard && !prefersReducedMotion && window.matchMedia("(hover: hover)").matches) {
    const MAX_TILT = 7;

    tiltCard.addEventListener("mousemove", (e) => {
      const rect = tiltCard.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      tiltCard.style.transform =
        `perspective(900px) rotateY(${px * MAX_TILT}deg) rotateX(${-py * MAX_TILT}deg)`;
    });

    tiltCard.addEventListener("mouseleave", () => {
      tiltCard.style.transform = "perspective(900px) rotateY(0) rotateX(0)";
    });
  }

  /* ---------- Spotlight follows cursor on feature cards ---------- */
  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      card.style.setProperty("--my", `${e.clientY - rect.top}px`);
    });
  });

  /* ---------- CTA email validation ---------- */
  const form = document.getElementById("ctaForm");
  const email = document.getElementById("ctaEmail");
  const note = document.getElementById("ctaNote");
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = email.value.trim();

    if (!EMAIL_RE.test(value)) {
      email.classList.add("is-invalid");
      note.textContent = "Please enter a valid email address.";
      email.focus();
      return;
    }

    email.classList.remove("is-invalid");
    note.textContent = `🚀 You're on the list — check ${value} for your invite!`;
    form.reset();
  });

  email.addEventListener("input", () => email.classList.remove("is-invalid"));
})();

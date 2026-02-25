/**
 * main.js
 * ----------
 * Portfolio interactions:
 * - Theme (safe localStorage)
 * - Typing effect
 * - Scroll spy + navbar polish
 * - Reveal-on-scroll (IntersectionObserver) with stagger
 * - Count-up stats (About section)
 * - Skills progress-bar animation
 * - Projects filter (animated show/hide)
 * - Projects split-view modal
 * - Contact form validation (front-end only)
 * - Scroll-to-top button + scroll progress bar
 * - Subtle 3D tilt on hover for cards
 */

(() => {
  "use strict";

  // ---------- Helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const safeGet = (key) => {
    try { return localStorage.getItem(key); } catch { return null; }
  };

  const safeSet = (key, value) => {
    try { localStorage.setItem(key, value); } catch {}
  };

  // ---------- Theme ----------
  const htmlEl = document.documentElement;
  const themeToggle = $("#themeToggle");
  const themeIcon = $("#themeIcon");

  const setTheme = (theme) => {
    htmlEl.setAttribute("data-theme", theme);
    safeSet("theme", theme);

    // Update icon (if the toggle exists in the DOM)
    if (themeIcon) themeIcon.className = theme === "dark" ? "bi bi-sun" : "bi bi-moon";
  };

  // Initialize theme once, safely.
  (() => {
    const saved = safeGet("theme");
    setTheme(saved === "light" || saved === "dark" ? saved : "dark");
  })();

  themeToggle?.addEventListener("click", () => {
    const current = htmlEl.getAttribute("data-theme");
    setTheme(current === "dark" ? "light" : "dark");
  });

  // ---------- Typing effect (Hero) ----------
  const typeTarget = $("#typeTarget");
  const phrases = [
    "B.Tech Engineering Student",
    "Python Developer",
    "Full Stack Developer",
    "Data Analyst",
    "Open Source Enthusiast",
    "Java Developer",
  ];

  let pIndex = 0;
  let cIndex = 0;
  let deleting = false;

  const typeLoop = () => {
    if (!typeTarget) return;

    const current = phrases[pIndex];
    typeTarget.textContent = current.slice(0, cIndex);

    if (!deleting) {
      cIndex += 1;

      // Pause at the end of a word
      if (cIndex > current.length) {
        deleting = true;
        window.setTimeout(typeLoop, 1100);
        return;
      }
    } else {
      cIndex -= 1;

      // Move to next phrase when fully deleted
      if (cIndex === 0) {
        deleting = false;
        pIndex = (pIndex + 1) % phrases.length;
      }
    }

    const speed = deleting ? 42 : 62;
    window.setTimeout(typeLoop, speed);
  };
  typeLoop();

  // ---------- Scroll progress (top thin bar) ----------
  const progressEl = $("#scrollProgress");
  const updateScrollProgress = () => {
    if (!progressEl) return;

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docH = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const pct = docH > 0 ? (scrollTop / docH) * 100 : 0;

    progressEl.style.width = `${pct}%`;
  };

  // ---------- Scroll spy (active nav pill) ----------
  const sections = ["home", "about", "skills", "projects", "contact"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  const navLinks = $$(".nav-pills-custom .nav-link");

  const onScrollSpy = () => {
    const offset = 140;
    let currentId = sections[0]?.id || "home";

    for (const sec of sections) {
      const top = sec.getBoundingClientRect().top;
      if (top <= offset) currentId = sec.id;
    }

    navLinks.forEach((a) => {
      const href = a.getAttribute("href") || "";
      a.classList.toggle("active", href === `#${currentId}`);
    });
  };

  // ---------- Navbar shrink + hide/show polish ----------
  const nav = $("#mainNav");
  let lastY = window.scrollY;

  const updateNavBehavior = () => {
    if (!nav) return;

    const y = window.scrollY;
    nav.classList.toggle("nav-scrolled", y > 24);

    // Hide when scrolling down, show when scrolling up (desktop-friendly)
    const goingDown = y > lastY;
    nav.classList.toggle("nav-hidden", goingDown && y > 260);

    lastY = y;
  };

  // ---------- Reveal on scroll (stagger) ----------
  const revealEls = $$(".reveal");

  // Add a stagger delay to every reveal element (makes entrance feel more animated)
  revealEls.forEach((el, i) => el.style.setProperty("--reveal-delay", `${Math.min(i * 60, 360)}ms`));

  const revealObs = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("show");

          // When a card reveals, also animate skill bars inside it.
          e.target.querySelectorAll?.(".bar").forEach((bar) => bar.classList.add("bar-animate"));

          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  revealEls.forEach((el) => revealObs.observe(el));

  // ---------- Count up stats (About) ----------
  const statNums = $$(".stat-num");
  let statsStarted = false;

  /**
   * Animate numbers: supports decimals and suffixes (e.g., %).
   */
  const animateCount = (el, target, suffix = "") => {
    const duration = 900;
    const start = performance.now();

    // Decide precision based on target
    const isDecimal = String(target).includes(".");
    const decimals = isDecimal ? String(target).split(".")[1].length : 0;

    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const value = (target * p);

      el.textContent = `${value.toFixed(decimals)}${suffix}`;

      if (p < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  const aboutSection = $("#about");
  const statsObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !statsStarted) {
          statsStarted = true;

          statNums.forEach((el) => {
            const target = Number(el.dataset.count || "0");
            const suffix = el.dataset.suffix || "";
            animateCount(el, target, suffix);
          });
        }
      });
    },
    { threshold: 0.32 }
  );

  if (aboutSection) statsObs.observe(aboutSection);

  // ---------- Projects filter (animated) ----------
  const filterBtns = $$(".btn-filter");
  const projectItems = $$(".project-item");

  const setProjectVisibility = (filter) => {
    projectItems.forEach((item) => {
      const cat = item.dataset.category;
      const shouldShow = filter === "all" || filter === cat;

      if (shouldShow) {
        // Show: restore display first, then animate in
        item.style.display = "";
        requestAnimationFrame(() => item.classList.remove("is-hidden"));
      } else {
        // Hide: animate out, then remove from layout
        item.classList.add("is-hidden");
        window.setTimeout(() => {
          if (item.classList.contains("is-hidden")) item.style.display = "none";
        }, 180);
      }
    });
  };

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      setProjectVisibility(btn.dataset.filter || "all");
    });
  });

  // ---------- Projects modal (split view) ----------
  const projectModalEl = $("#projectModal");
  const modal = projectModalEl && window.bootstrap ? new bootstrap.Modal(projectModalEl) : null;

  const modalTitle = $("#modalTitle");
  const modalCategory = $("#modalCategory");
  const modalShort = $("#modalShort");
  const modalFeatured = $("#modalFeatured");
  const modalDetails = $("#modalDetails");
  const modalFeatures = $("#modalFeatures");
  const modalStack = $("#modalStack");
  const modalTags = $("#modalTags");
  const modalGithub = $("#modalGithub");
  const modalDemo = $("#modalDemo");

  const pill = (text) => {
    const span = document.createElement("span");
    span.className = "tag";

    // Normalize labels (keeps tags consistent)
    const labelMap = {
      Bootstrap: "Bootstrap 5",
      Bootstrap5: "Bootstrap 5",
      Tailwind: "Tailwind CSS",
    };
    span.textContent = labelMap[text] || text;

    return span;
  };

  projectItems.forEach((item) => {
    item.addEventListener("click", () => {
      const raw = item.getAttribute("data-project");
      if (!raw || !modal) return;

      const data = JSON.parse(raw);

      modalTitle.textContent = data.title || "Project";
      modalCategory.textContent = data.category || "Category";
      modalShort.textContent = data.short || "";
      modalDetails.textContent = data.details || "";

      // Featured badge
      if (data.featured) modalFeatured.classList.remove("d-none");
      else modalFeatured.classList.add("d-none");

      // Features list
      modalFeatures.innerHTML = "";
      (data.features || []).forEach((f) => {
        const li = document.createElement("li");
        li.textContent = f;
        modalFeatures.appendChild(li);
      });

      // Stack pills (right panel)
      modalStack.innerHTML = "";
      (data.stack || []).forEach((s) => modalStack.appendChild(pill(s)));

      // Tags (left panel)
      modalTags.innerHTML = "";
      (data.stack || []).forEach((t) => modalTags.appendChild(pill(t)));

      // Links
      if (modalGithub) modalGithub.href = data.github || "#";
      if (modalDemo) modalDemo.href = data.demo || "#";

      modal.show();
    });
  });

  // ---------- Contact form (front-end validation only) ----------
  const contactForm = $("#contactForm");
  const formStatus = $("#formStatus");

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  contactForm?.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = $("#name");
    const email = $("#email");
    const message = $("#message");

    let ok = true;

    // Name
    if (!name?.value.trim()) {
      name?.classList.add("is-invalid");
      ok = false;
    } else name.classList.remove("is-invalid");

    // Email
    if (!isValidEmail(email?.value.trim() || "")) {
      email?.classList.add("is-invalid");
      ok = false;
    } else email.classList.remove("is-invalid");

    // Message
    if (!message?.value.trim()) {
      message?.classList.add("is-invalid");
      ok = false;
    } else message.classList.remove("is-invalid");

    // If status node doesn't exist, fail gracefully
    if (!formStatus) {
      if (ok) contactForm.reset();
      return;
    }

    if (!ok) {
      formStatus.textContent = "Please fix the highlighted fields.";
      formStatus.className = "text-danger fw-semibold mt-3";
      return;
    }

    // Demo-only submit (wire this to your backend later)
    formStatus.textContent = "✅ Message sent successfully! (Demo: connect backend later)";
    formStatus.className = "text-success fw-semibold mt-3";

    contactForm.reset();
  });

  // ---------- Scroll to top button ----------
  const toTop = $("#toTop");

  toTop?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  const updateToTop = () => {
    if (!toTop) return;
    toTop.classList.toggle("show", window.scrollY > 520);
  };

  // ---------- 3D tilt (subtle hover effect) ----------
  const tiltCards = $$(".project-card, .glass-card");

  const handleTiltMove = (el, ev) => {
    const rect = el.getBoundingClientRect();
    const x = (ev.clientX - rect.left) / rect.width;  // 0..1
    const y = (ev.clientY - rect.top) / rect.height;  // 0..1

    // Keep it subtle: small degrees only
    const rotY = (x - 0.5) * 8;
    const rotX = (0.5 - y) * 8;

    el.style.transform = `translateY(-2px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  };

  const resetTilt = (el) => {
    el.style.transform = "";
  };

  tiltCards.forEach((card) => {
    card.classList.add("tilt"); // lets CSS opt-in perspective

    card.addEventListener("mousemove", (ev) => handleTiltMove(card, ev));
    card.addEventListener("mouseleave", () => resetTilt(card));
  });

  // ---------- Footer year ----------
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // ---------- Global scroll listener ----------
  const onScroll = () => {
    updateScrollProgress();
    onScrollSpy();
    updateToTop();
    updateNavBehavior();
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", updateScrollProgress);

  // Initial run
  onScroll();
})();

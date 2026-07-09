/* Barrtar shared site behaviour — nav, header, reveal, accordion, tabs, counters */
(() => {
 "use strict";

 const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

 /* Sticky header background on scroll */
 const header = document.querySelector(".site-header");
 if (header) {
  const setScrolled = () => {
   header.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  setScrolled();
  window.addEventListener("scroll", setScrolled, { passive: true });
 }

 /* Mobile nav toggle */
 const navToggle = document.querySelector(".nav-toggle");
 if (navToggle) {
  navToggle.addEventListener("click", () => {
   const open = document.body.classList.toggle("nav-open");
   navToggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  document.querySelectorAll(".mobile-menu a").forEach((a) => {
   a.addEventListener("click", () => document.body.classList.remove("nav-open"));
  });
 }

 /* Reveal-on-scroll */
 const revealEls = document.querySelectorAll(".reveal");
 if (revealEls.length) {
  if (reduced || !("IntersectionObserver" in window)) {
   revealEls.forEach((el) => el.classList.add("is-visible"));
  } else {
   const io = new IntersectionObserver(
    (entries) => {
     entries.forEach((entry) => {
      if (entry.isIntersecting) {
       entry.target.classList.add("is-visible");
       io.unobserve(entry.target);
      }
     });
    },
    { threshold: 0.14, rootMargin: "0px 0px -40px 0px" },
   );
   revealEls.forEach((el, i) => {
    el.style.setProperty("--stagger-i", i % 6);
    io.observe(el);
   });
   /* Safety net: guarantee everything is visible even if an observer
     edge case (odd layout, zero-height container, etc.) never fires. */
   window.setTimeout(() => {
    revealEls.forEach((el) => el.classList.add("is-visible"));
   }, 2500);
  }
 }

 /* FAQ accordion */
 document.querySelectorAll(".faq-item").forEach((item) => {
  const btn = item.querySelector(".faq-question");
  if (!btn) return;
  btn.addEventListener("click", () => {
   const isOpen = item.classList.contains("is-open");
   item.closest(".accordion")?.querySelectorAll(".faq-item.is-open").forEach((openItem) => {
    if (openItem !== item && openItem.dataset.exclusive === "true") {
     openItem.classList.remove("is-open");
     openItem.querySelector(".faq-question")?.setAttribute("aria-expanded", "false");
    }
   });
   item.classList.toggle("is-open", !isOpen);
   btn.setAttribute("aria-expanded", (!isOpen).toString());
  });
 });

 /* Tabs (Creator / Doer) */
 document.querySelectorAll(".tabs").forEach((tabGroup) => {
  const buttons = tabGroup.querySelectorAll(".tab-btn");
  const panels = tabGroup.querySelectorAll(".tab-panel");
  buttons.forEach((btn) => {
   btn.addEventListener("click", () => {
    const target = btn.getAttribute("data-tab");
    buttons.forEach((b) => b.classList.toggle("is-active", b === btn));
    panels.forEach((p) => p.classList.toggle("is-active", p.getAttribute("data-tab-panel") === target));
   });
  });
 });

 /* Count-up for fact/stat numbers with data-count-to */
 const counters = document.querySelectorAll("[data-count-to]");
 if (counters.length && !reduced && "IntersectionObserver" in window) {
  const animate = (el) => {
   const target = parseFloat(el.getAttribute("data-count-to"));
   const suffix = el.getAttribute("data-count-suffix") || "";
   const dur = 1100;
   const start = performance.now();
   const tick = (now) => {
    const p = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * eased) + suffix;
    if (p < 1) requestAnimationFrame(tick);
   };
   requestAnimationFrame(tick);
  };
  const io2 = new IntersectionObserver(
   (entries) => {
    entries.forEach((entry) => {
     if (entry.isIntersecting) {
      animate(entry.target);
      io2.unobserve(entry.target);
     }
    });
   },
   { threshold: 0.6 },
  );
  counters.forEach((el) => io2.observe(el));
 }

 /* Smooth-scroll for same-page anchors, accounting for sticky header */
 document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
   const id = a.getAttribute("href").slice(1);
   if (!id) return;
   const target = document.getElementById(id);
   if (!target) return;
   e.preventDefault();
   const headerH = header ? header.offsetHeight : 0;
   const top = target.getBoundingClientRect().top + window.scrollY - headerH - 16;
   window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
   document.body.classList.remove("nav-open");
  });
 });
})();

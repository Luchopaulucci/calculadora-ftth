import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Entradas y revelados con GSAP. No toca la lógica de la calculadora.
 */
export function initAnimations() {
  if (prefersReducedMotion()) return;

  const ctx = gsap.context(() => {
    const intro = gsap.utils.toArray(
      ".site-header__bar .brand, .site-header__bar .sitio-nav, .site-header__bar .hdr-btns, main h1, main .lead, main .calc-toolbar, main .crumbs",
    );

    if (intro.length) {
      gsap.from(intro, {
        y: 18,
        opacity: 0,
        duration: 0.55,
        stagger: 0.06,
        ease: "power3.out",
        clearProps: "transform",
      });
    }

    const cards = gsap.utils.toArray(".card, .reach-warn");
    cards.forEach((card) => {
      gsap.from(card, {
        y: 24,
        opacity: 0,
        duration: 0.5,
        ease: "power2.out",
        clearProps: "transform",
        scrollTrigger: {
          trigger: card,
          start: "top 92%",
          once: true,
        },
      });
    });
  });

  requestAnimationFrame(() => ScrollTrigger.refresh());

  return () => ctx.revert();
}

/**
 * @param {HTMLElement} nav
 * @param {boolean} open
 */
export function animateNav(nav, open) {
  if (prefersReducedMotion() || !open) return;
  const links = nav.querySelectorAll("a");
  if (!links.length) return;
  gsap.fromTo(
    links,
    { y: 8, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.25, stagger: 0.04, ease: "power2.out", clearProps: "transform" },
  );
}

/**
 * Pulso suave al cambiar el veredicto.
 * @param {HTMLElement} el
 */
export function pulseVerdict(el) {
  if (!el || prefersReducedMotion()) return;
  gsap.fromTo(el, { scale: 0.985 }, { scale: 1, duration: 0.35, ease: "power2.out", clearProps: "transform" });
}

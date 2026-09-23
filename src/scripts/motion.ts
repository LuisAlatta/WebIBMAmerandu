/**
 * Coreografía de la landing, cargada en el navegador por el script de Layout.astro.
 * IntersectionObserver activa cada entrada una sola vez; Web Animations controla
 * fundido/desplazamiento/escala. motion.css aporta hover, resplandores y estados CSS.
 * Los selectores de group() dependen de las clases de los componentes: mantenerlos
 * sincronizados al renombrar o agregar secciones. Sin JS el contenido queda visible.
 * No importar desde el frontmatter de Astro: este módulo usa window y document.
 */
const easing = "cubic-bezier(0.2, 0.8, 0.2, 1)";
const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
type Motion = { element: Element; kind: string; delay: number; opacity: string };
const pending = new Map<Element, Motion>();
const active = new Set<Animation>();

// Quita la observación y restaura el estilo original al terminar. `immediate` evita
// ocultar el elemento al recibir foco, imprimir o activar movimiento reducido.
function reveal(element: Element, immediate = false) {
  const motion = pending.get(element);
  if (!motion) return;
  pending.delete(element);
  observer.unobserve(element);
  element.classList.remove("motion-pending");
  if (immediate || preference.matches) return;
  const from: Keyframe = { opacity: 0 };
  const to: Keyframe = { opacity: motion.opacity };
  if (motion.kind === "up" || motion.kind === "side") {
    from.translate = motion.kind === "side" ? "18px 0" : "0 20px";
    to.translate = "0 0";
  } else if (motion.kind === "scale") {
    from.scale = "0.965";
    to.scale = "1";
  }
  const animation = element.animate([from, to], {
    duration: motion.kind === "fade" ? 1000 : 760,
    delay: motion.delay, easing, fill: "backwards",
  });
  active.add(animation);
  animation.finished.then(() => {
    active.delete(animation);
    if (element.matches(".photo-frame") && !preference.matches) {
      element.classList.add("community-glow");
    }
  }).catch(() => active.delete(animation));
}

const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) if (entry.isIntersecting) reveal(entry.target);
}, { threshold: 0.08 });

// Orden DOM = orden de entrada. step está en milisegundos; el retraso se limita
// a 330 ms. Se conserva la opacidad propia de decoraciones semitransparentes.
function group(selector: string, kind = "up", step = 110) {
  document.querySelectorAll(selector).forEach((element, index) => {
    if (preference.matches || pending.has(element)) return;
    pending.set(element, { element, kind, delay: Math.min(index * step, 330), opacity: getComputedStyle(element).opacity });
    element.classList.add("motion-pending");
    observer.observe(element);
  });
}

group(".hero-content > *", "up", 150);
for (const selector of [".about-copy", ".values-heading", ".allies-heading", ".join-heading", ".section-heading", ".faq-heading", ".contact-heading"]) {
  group(`${selector} > *`);
}
group(".principle");
group(".value-card", "up", 130);
group(".ally-card", "scale", 160);
group(".photo-frame", "fade", 130);
document.querySelectorAll(".join-copy").forEach((element) => {
  element.querySelectorAll(":scope > *").forEach((child, index) => {
    if (preference.matches) return;
    pending.set(child, { element: child, kind: "up", delay: index * 100, opacity: getComputedStyle(child).opacity });
    child.classList.add("motion-pending");
    observer.observe(child);
  });
});
group(".content-card", "fade", 130);
group(".spotify-embed, .platform-buttons > *", "up", 110);
group(".event", "up", 100);
group(".faq-panel", "up");
// The Astro island wrapper survives React hydration.
group(".contact-layout > astro-island", "side");
group(".footer-columns > *", "fade", 110);
group(".footer-bottom", "fade", 0);
group(".organic-decoration, .plants-decoration, .contours, .contact-shape, .contact-dots, .faq-dots, .join > .dots", "fade", 0);
group(".animate-on-scroll");

// Keyboard and anchor navigation must never land on invisible content.
document.addEventListener("focusin", (event) => {
  if (!(event.target instanceof Element)) return;
  for (const element of pending.keys()) if (element.contains(event.target)) reveal(element, true);
  for (const animation of active) {
    const target = (animation.effect as KeyframeEffect)?.target;
    if (target?.contains(event.target)) animation.cancel();
  }
});
window.addEventListener("beforeprint", () => {
  for (const element of pending.keys()) reveal(element, true);
  for (const animation of active) animation.cancel();
});

// Paralaje acotado al margen extra de la fotografía definido en motion.css.
// Agrupa eventos de scroll en un solo frame y no actualiza fuera del viewport.
const hero = document.querySelector<HTMLElement>(".hero");
const background = document.querySelector<HTMLElement>(".hero-background");
let heroVisible = false;
let frame = 0;
function updateParallax() {
  frame = 0;
  if (!hero || !background || preference.matches || !heroVisible || document.hidden) return;
  const offset = Math.max(-32, Math.min(64, -hero.getBoundingClientRect().top * 0.09));
  background.style.setProperty("--parallax-y", `${offset}px`);
}
function scheduleParallax() {
  if (!frame && heroVisible && !preference.matches && !document.hidden) frame = requestAnimationFrame(updateParallax);
}
if (hero && background) {
  const heroObserver = new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting;
    scheduleParallax();
  });
  heroObserver.observe(hero);
  window.addEventListener("scroll", scheduleParallax, { passive: true });
  window.addEventListener("resize", scheduleParallax, { passive: true });
  document.addEventListener("visibilitychange", scheduleParallax);
}
preference.addEventListener("change", () => {
  if (preference.matches) {
    for (const element of pending.keys()) reveal(element, true);
    for (const animation of active) animation.cancel();
    cancelAnimationFrame(frame);
    frame = 0;
    background?.style.removeProperty("--parallax-y");
    document.querySelectorAll(".community-glow").forEach((element) => element.classList.remove("community-glow"));
  } else scheduleParallax();
});

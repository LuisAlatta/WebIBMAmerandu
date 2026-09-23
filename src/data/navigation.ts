/**
 * Fuente compartida por Navbar.astro y MobileMenu.tsx: enlaces y estilos de sus CTA.
 * Los href comienzan con / para volver a la portada incluso desde la página legal.
 * Al cambiar un hash, actualiza también el id de la sección o pestaña de destino.
 */
export const navigationLinks = [
  { href: "/#inicio", label: "Inicio" },
  { href: "/#nosotros", label: "Nosotros" },
  { href: "/#valores", label: "Valores" },
  { href: "/#aliados", label: "Aliados" },
  { href: "/#unete", label: "Participa" },
  { href: "/#nuevas-miradas", label: "Podcast y eventos" },
  { href: "/#faq", label: "FAQ" },
  // { href: "/#contacto", label: "Contacto" },
];

// ContactForm escucha estos hashes para abrir club o voluntariado, incluso antes de hidratarse.
// `secondary` solo elige el estilo del botón; no cambia el comportamiento del formulario.
export const participationLinks = [
  { href: "/#contact-tab-club", label: "Unirme al club", secondary: false },
  { href: "/#contact-tab-volunteer", label: "Ser voluntario", secondary: true },
];

export const navigationButtonClass = "inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white whitespace-nowrap transition-[background-color,translate] duration-200 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white";
export const navigationButtonColors = {
  primary: "bg-rojo hover:bg-[#c23001]",
  secondary: "bg-verde-dark ring-1 ring-inset ring-white/50 hover:bg-[#044f35]",
};

/**
 * Menú móvil modal que reutiliza src/data/navigation.ts.
 * <dialog>.showModal() gestiona el foco y Escape; el efecto bloquea el scroll
 * y lo restaura al cerrar. El breakpoint de 1280 px debe coincidir con Navbar.
 */
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { navigationLinks, participationLinks, navigationButtonClass, navigationButtonColors } from "../data/navigation";
import "../styles/mobile-menu.css";

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    const desktop = window.matchMedia("(min-width: 1280px)");
    const onResize = () => { if (desktop.matches) setIsOpen(false); };
    desktop.addEventListener("change", onResize);
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      desktop.removeEventListener("change", onResize);
    };
  }, [isOpen]);

  const closeMenu = () => {
    dialogRef.current?.close();
    setIsOpen(false);
  };

  return (
    <div className="mobile-navigation">
      <button type="button" className="mobile-menu-trigger" onClick={() => setIsOpen(true)}
        aria-label="Abrir menú" aria-expanded={isOpen} aria-controls="mobile-navigation-dialog" aria-haspopup="dialog">
        <Menu size={28} aria-hidden="true" />
      </button>
      <dialog ref={dialogRef} id="mobile-navigation-dialog" className="mobile-menu-dialog"
        aria-labelledby="mobile-menu-title" onClose={() => setIsOpen(false)}
        onClick={(event) => { if (event.target === event.currentTarget) closeMenu(); }}>
        <div className="mobile-menu-content">
          <div className="mobile-menu-heading">
            <h2 id="mobile-menu-title">Explora Amerandú</h2>
            <button type="button" className="mobile-menu-close" onClick={closeMenu} aria-label="Cerrar menú">
              <X size={25} aria-hidden="true" />
            </button>
          </div>
          <nav aria-label="Navegación principal móvil">
            <ul className="mobile-menu-links">
              {navigationLinks.map(({ href, label }) => (
                <li key={href}><a href={href} onClick={closeMenu}>{label}<ArrowRight size={16} aria-hidden="true" /></a></li>
              ))}
            </ul>
            <div className="mobile-menu-actions">
              {participationLinks.map(({ href, label, secondary }) => (
                <a key={href} href={href} onClick={closeMenu}
                  className={`${navigationButtonClass} ${secondary ? navigationButtonColors.secondary : navigationButtonColors.primary}`}>
                  {label}<ArrowRight size={18} aria-hidden="true" />
                </a>
              ))}
            </div>
          </nav>
        </div>
      </dialog>
    </div>
  );
}

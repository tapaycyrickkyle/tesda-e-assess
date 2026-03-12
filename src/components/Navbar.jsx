import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

function MortarboardIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-8 w-8 fill-current"
    >
      <path d="M12 3 1.5 8.25 12 13.5l8.63-4.31v5.96H22V8.25L12 3Zm-6.75 8.49V15c0 2.14 3.2 3.75 6.75 3.75s6.75-1.61 6.75-3.75v-3.51L12 14.86l-6.75-3.37Z" />
    </svg>
  );
}

const defaultLinks = [
  { label: "Home", href: "/" },
  { label: "Register", href: "/registration-type" },
];

const Navbar = ({ links = defaultLinks, ctaLabel = "Login", ctaTo = "/login", fixed = false }) => {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState("");
  const hasHashLinks = links.some((item) => item.href.startsWith("#"));

  useEffect(() => {
    if (!hasHashLinks) {
      return;
    }

    const sectionIds = links.map((item) => item.href.replace("#", ""));

    const updateActiveSection = () => {
      const scrollPosition = window.scrollY + 140;
      let currentSection = sectionIds[0] || "";

      for (const id of sectionIds) {
        const section = document.getElementById(id);
        if (!section) continue;

        const top = section.offsetTop;
        const bottom = top + section.offsetHeight;

        if (scrollPosition >= top && scrollPosition < bottom) {
          currentSection = id;
          break;
        }

        if (scrollPosition >= top) {
          currentSection = id;
        }
      }

      setActiveSection(currentSection);
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    return () => window.removeEventListener("scroll", updateActiveSection);
  }, [hasHashLinks, links]);

  const headerClassName = fixed
    ? "fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur"
    : "border-b border-slate-200 bg-white";

  return (
    <header className={headerClassName}>
      <div className="page-container flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
        <Link to="/" className="flex items-center gap-3 text-blue-700">
          <MortarboardIcon />
          <span className="text-2xl font-bold tracking-tight">TESDA E-Assess</span>
        </Link>

        <nav className="flex flex-wrap items-center gap-5 text-sm font-medium text-slate-700 sm:text-base">
          {links.map((item) => {
            const isHash = item.href.startsWith("#");
            const isRouteActive = !isHash && location.pathname === item.href;
            const isSectionActive = isHash && activeSection === item.href.replace("#", "");

            const sharedClass = `transition hover:text-blue-700 ${
              isRouteActive || isSectionActive ? "font-semibold text-blue-700" : ""
            }`;

            if (isHash) {
              return (
                <a key={item.label} href={item.href} className={sharedClass}>
                  {item.label}
                </a>
              );
            }

            return (
              <Link key={item.label} to={item.href} className={sharedClass}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {ctaLabel ? (
          <Link to={ctaTo} className="ui-btn-primary text-center">
            {ctaLabel}
          </Link>
        ) : null}
      </div>
    </header>
  );
};

export default Navbar;

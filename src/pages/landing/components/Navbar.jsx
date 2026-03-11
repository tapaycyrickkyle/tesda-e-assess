import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const navItems = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Programs", href: "#programs" },
  { label: "Staff", href: "#staff" },
];

function MortarboardIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-9 w-9 fill-current"
    >
      <path d="M12 3 1.5 8.25 12 13.5l8.63-4.31v5.96H22V8.25L12 3Zm-6.75 8.49V15c0 2.14 3.2 3.75 6.75 3.75s6.75-1.61 6.75-3.75v-3.51L12 14.86l-6.75-3.37Z" />
    </svg>
  );
}

const Navbar = () => {
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    const sectionIds = navItems.map((item) => item.href.replace("#", ""));

    const updateActiveSection = () => {
      const scrollPosition = window.scrollY + 140;
      let currentSection = sectionIds[0];

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
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1360px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 md:px-10">
        <div className="flex items-center gap-3 text-blue-700">
          <MortarboardIcon />
          <span className="text-[1.8rem] font-bold tracking-tight">
            TESDA E-Assess
          </span>
        </div>

        <nav className="flex flex-wrap items-center gap-4 text-[1rem] font-medium text-slate-700 sm:gap-6 sm:text-[1.1rem] md:gap-8 md:text-[1.2rem]">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`transition hover:text-blue-700 ${
                activeSection === item.href.replace("#", "")
                  ? "font-semibold text-blue-700"
                  : ""
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <Link
          to="/login"
          className="rounded-xl bg-blue-700 px-6 py-3 text-[1rem] font-semibold text-white shadow-sm transition hover:bg-blue-800 sm:px-8 sm:py-4 sm:text-[1.2rem]"
        >
          Login
        </Link>
      </div>
    </header>
  );
};

export default Navbar;

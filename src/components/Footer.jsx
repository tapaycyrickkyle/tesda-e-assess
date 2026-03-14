import React from "react";
import tesdaLogo from "../assets/toppng.com-deped-logo-tesda-logo-624x621.png";

const Footer = () => {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="page-container py-8">
        <div className="flex flex-col gap-4 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center text-white">
              <img
                src={tesdaLogo}
                alt="TESDA Logo"
                className="h-full w-full object-contain"
              />
            </span>
            <span className="font-semibold text-slate-700">TESDA E-Assess</span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <a href="#" className="transition hover:text-slate-700">
              Privacy Policy
            </a>
            <a href="#" className="transition hover:text-slate-700">
              Terms of Service
            </a>
            <a href="#" className="transition hover:text-slate-700">
              Contact Us
            </a>
          </div>

          <p>&copy; 2026 TESDA Assessment. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

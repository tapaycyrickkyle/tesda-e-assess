import React from "react";

const Footer = () => {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="page-container py-8">
        <div className="flex flex-col gap-4 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded bg-blue-600 text-white">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M12 3 1.5 8.25 12 13.5l8.63-4.31v5.96H22V8.25L12 3Zm-6.75 8.49V15c0 2.14 3.2 3.75 6.75 3.75s6.75-1.61 6.75-3.75v-3.51L12 14.86l-6.75-3.37Z" />
              </svg>
            </span>
            <span className="font-semibold text-slate-700">TESDA Assessment System</span>
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

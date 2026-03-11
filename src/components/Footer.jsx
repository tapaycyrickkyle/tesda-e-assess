import React from "react";

function BuildingIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
      <path d="M3 21h18v-2H3v2ZM5 17h2V9H5v8Zm4 0h2V9H9v8Zm4 0h2V9h-2v8Zm4 0h2V9h-2v8ZM2 7l10-5 10 5v1H2V7Z" />
    </svg>
  );
}

const RegistrationTypeFooter = () => {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-5 px-4 py-8 text-[14px] text-slate-500 sm:px-6 sm:text-[15px] md:flex-row md:items-center md:justify-between md:px-10">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded bg-slate-300 text-white">
            <BuildingIcon />
          </span>
          <span className="font-semibold tracking-wide text-slate-500">
            TESDA Assessment System
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6 md:gap-10">
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

        <p>&copy; 2024 TESDA Assessment. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default RegistrationTypeFooter;

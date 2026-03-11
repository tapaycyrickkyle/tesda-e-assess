import React from "react";

function BuildingIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M3 21h18v-2H3v2ZM5 17h2V9H5v8Zm4 0h2V9H9v8Zm4 0h2V9h-2v8Zm4 0h2V9h-2v8ZM2 7l10-5 10 5v1H2V7Z" />
    </svg>
  );
}

const RegistrationTypeNavbar = () => {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-[1360px] items-center justify-between px-6 py-4 md:px-10">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
            <BuildingIcon />
          </span>
          <p className="text-[23px] font-semibold tracking-tight text-slate-900">
            TESDA <span className="font-medium text-blue-700">Assessment System</span>
          </p>
        </div>

        <div className="flex items-center gap-8 md:gap-12">
          <nav className="hidden items-center gap-8 text-[15px] font-medium text-slate-700 md:flex">
            <a href="#" className="transition hover:text-blue-700">
              Home
            </a>
            <a href="#" className="transition hover:text-blue-700">
              About
            </a>
            <a href="#" className="transition hover:text-blue-700">
              Help
            </a>
          </nav>
          <a
            href="#"
            className="rounded-xl bg-blue-700 px-8 py-3 text-[15px] font-semibold text-white transition hover:bg-blue-800"
          >
            Login
          </a>
        </div>
      </div>
    </header>
  );
};

export default RegistrationTypeNavbar;

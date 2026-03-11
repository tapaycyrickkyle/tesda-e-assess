import React from "react";

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
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-[1360px] items-center justify-between px-4 py-4 sm:px-6 md:px-10">
        <div className="flex items-center gap-3 text-blue-700">
          <MortarboardIcon />
          <span className="text-[1.25rem] font-bold tracking-tight sm:text-[1.5rem] lg:text-[1.8rem]">
            TESDA E-Assess
          </span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

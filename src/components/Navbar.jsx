const navItems = ["Home", "Courses", "About"];

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

export default function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <div className="flex items-center gap-3 text-blue-700">
          <MortarboardIcon />
          <span className="text-[2rem] font-bold tracking-tight">TESDA Portal</span>
        </div>

        <nav className="hidden items-center gap-14 text-2xl font-medium text-slate-700 md:flex">
          {navItems.map((item) => (
            <a
              key={item}
              href="#"
              className="transition hover:text-blue-700"
            >
              {item}
            </a>
          ))}
        </nav>

        <button className="rounded-2xl bg-blue-700 px-8 py-4 text-xl font-semibold text-white shadow-sm transition hover:bg-blue-800">
          Login
        </button>
      </div>
    </header>
  );
}

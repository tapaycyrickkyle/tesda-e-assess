function GlobeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M12 2a10 10 0 1 0 10 10A10.01 10.01 0 0 0 12 2Zm6.93 9h-3.02a15.93 15.93 0 0 0-1.33-5A8.03 8.03 0 0 1 18.93 11ZM12 4.07c.95 1.08 1.98 3.45 2.39 6.93H9.61C10.02 7.52 11.05 5.15 12 4.07ZM4.07 13h3.02a15.93 15.93 0 0 0 1.33 5A8.03 8.03 0 0 1 4.07 13Zm3.02-2H4.07a8.03 8.03 0 0 1 4.35-5 15.93 15.93 0 0 0-1.33 5ZM12 19.93c-.95-1.08-1.98-3.45-2.39-6.93h4.78c-.41 3.48-1.44 5.85-2.39 6.93ZM14.59 13c-.17 1.74-.54 3.39-1.09 4.8-.55 1.4-1.13 2.19-1.5 2.19-.37 0-.95-.79-1.5-2.19-.55-1.41-.92-3.06-1.09-4.8h5.18Zm-5.18-2c.17-1.74.54-3.39 1.09-4.8.55-1.4 1.13-2.19 1.5-2.19.37 0 .95.79 1.5 2.19.55 1.41.92 3.06 1.09 4.8H9.41ZM15.58 18a15.93 15.93 0 0 0 1.33-5h3.02a8.03 8.03 0 0 1-4.35 5Z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M12 2 4 5v6c0 5.25 3.4 9.88 8 11 4.6-1.12 8-5.75 8-11V5l-8-3Zm0 17.85c-3.4-1-6-4.95-6-8.85V6.44l6-2.25 6 2.25V11c0 3.9-2.6 7.85-6 8.85Z" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M12 2a10 10 0 1 0 10 10A10.01 10.01 0 0 0 12 2Zm0 17a1.25 1.25 0 1 1 1.25-1.25A1.25 1.25 0 0 1 12 19Zm1.31-6.56-.56.38A1.76 1.76 0 0 0 12 14.3V15h-1.8v-.88a2.9 2.9 0 0 1 1.2-2.78l.77-.56a1.78 1.78 0 0 0 .75-1.38 1.84 1.84 0 0 0-3.68.08H7.45a3.64 3.64 0 0 1 7.28-.08 3.4 3.4 0 0 1-1.42 2.81Z" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 text-slate-500 sm:flex-row sm:items-end sm:justify-between lg:px-10">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-slate-500">
            Republic of the Philippines
          </p>
          <p className="mt-3 text-2xl text-slate-800">
            Technical Education and Skills Development Authority
          </p>
        </div>

        <div className="flex items-center gap-6 text-slate-400">
          <GlobeIcon />
          <ShieldIcon />
          <HelpIcon />
        </div>
      </div>
    </footer>
  );
}

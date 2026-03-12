import React from "react";

const navItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    active: false,
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
        <path
          d="M3 3h8v8H3V3Zm10 0h8v5h-8V3ZM3 13h5v8H3v-8Zm7 0h11v8H10v-8Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    id: "incoming",
    label: "Applicants",
    active: true,
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
        <path
          d="M4 4h16v12H4V4Zm2 2v8h12V6H6Zm1 11h10v2H7v-2Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    id: "verified",
    label: "Verified Applications",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
        <path
          d="M12 2 4 5v6c0 5.1 3.2 9.7 8 11 4.8-1.3 8-5.9 8-11V5l-8-3Zm-1 12-3-3 1.4-1.4 1.6 1.6 3.6-3.6L16 9l-5 5Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
];

const SecretaryDashboardSidebar = () => {
  return (
    <aside className="border-b border-slate-200 bg-white p-4 lg:min-h-screen lg:border-b-0 lg:border-r">
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6">
              <path
                d="M12 3 1.5 8.25 12 13.5l8.63-4.31v5.96H22V8.25L12 3Zm-6.75 8.49V15c0 2.14 3.2 3.75 6.75 3.75s6.75-1.61 6.75-3.75v-3.51L12 14.86l-6.75-3.37Z"
                fill="currentColor"
              />
            </svg>
          </span>
          <div>
            <p className="text-xl font-bold tracking-tight text-slate-900">
              TESDA E-Assess
            </p>
            <p className="text-base text-slate-500">Secretary Dashboard</p>
          </div>
        </div>

        <nav className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left text-base font-medium transition ${
                item.active
                  ? "bg-blue-100 text-blue-700"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span
                className={`${item.active ? "text-blue-700" : "text-slate-500"}`}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-8 flex items-center gap-3 border-t border-slate-200 pt-5 lg:mt-auto">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 font-semibold text-amber-700">
            C
          </span>
          <div>
            <p className="text-base font-semibold text-slate-900">C. Secretary</p>
            <p className="text-sm text-slate-500">Regional Office</p>
          </div>
          <button
            type="button"
            className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
              <path
                d="m10.9 2.5-.3 1.6a7.8 7.8 0 0 0-1.7.7l-1.3-1a1 1 0 0 0-1.3.1L4 5.1a1 1 0 0 0-.1 1.3l1 1.3c-.3.5-.6 1.1-.7 1.7l-1.6.3a1 1 0 0 0-.8 1v2.4a1 1 0 0 0 .8 1l1.6.3c.2.6.4 1.2.7 1.7l-1 1.3a1 1 0 0 0 .1 1.3l1.7 1.7a1 1 0 0 0 1.3.1l1.3-1c.5.3 1.1.6 1.7.7l.3 1.6a1 1 0 0 0 1 .8h2.4a1 1 0 0 0 1-.8l.3-1.6c.6-.2 1.2-.4 1.7-.7l1.3 1a1 1 0 0 0 1.3-.1l1.7-1.7a1 1 0 0 0 .1-1.3l-1-1.3c.3-.5.6-1.1.7-1.7l1.6-.3a1 1 0 0 0 .8-1V11a1 1 0 0 0-.8-1l-1.6-.3a7.8 7.8 0 0 0-.7-1.7l1-1.3a1 1 0 0 0-.1-1.3L18.4 4a1 1 0 0 0-1.3-.1l-1.3 1c-.5-.3-1.1-.6-1.7-.7l-.3-1.6a1 1 0 0 0-1-.8h-2.4a1 1 0 0 0-1 .8Zm1.3 6a3.7 3.7 0 1 1 0 7.4 3.7 3.7 0 0 1 0-7.4Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default SecretaryDashboardSidebar;

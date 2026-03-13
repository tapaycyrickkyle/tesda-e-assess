import React from "react";
import tesdaLogo from "../../assets/toppng.com-deped-logo-tesda-logo-624x621.png";

const navItems = [
  { id: "dashboard", label: "Dashboard", active: true },
  { id: "assigned", label: "Assigned Applicants" },
  { id: "reports", label: "Reports" },
  { id: "export", label: "Export Data" },
];

function TesdaIcon() {
  return <img src={tesdaLogo} alt="TESDA Logo" className="h-8 w-8 object-contain" />;
}

function GridIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M3 3h8v8H3V3Zm10 0h8v5h-8V3ZM3 13h5v8H3v-8Zm7 0h11v8H10v-8Z" />
    </svg>
  );
}

function GroupIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M16 11.5a3.5 3.5 0 1 0-2.8-5.6 4.5 4.5 0 0 1 0 5.6A3.48 3.48 0 0 0 16 11.5Zm-8 0a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0 2c-2.88 0-5.5 1.62-5.5 3.61 0 .77.64 1.39 1.43 1.39h8.14c.79 0 1.43-.62 1.43-1.39 0-1.99-2.62-3.61-5.5-3.61Zm8 0c-.86 0-1.67.14-2.4.38 1.23.87 1.9 2 1.9 3.23 0 .48-.1.94-.28 1.39h4.25c.84 0 1.53-.66 1.53-1.46 0-1.95-2.2-3.54-5-3.54Z" />
    </svg>
  );
}

function DescriptionIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current">
      <path
        d="M7 5h10M7 9h10M7 13h6M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current">
      <path d="M12 16V4m0 12-3.5-3.5M12 16l3.5-3.5" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 20h16" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="m10.9 2.5-.3 1.6a7.8 7.8 0 0 0-1.7.7l-1.3-1a1 1 0 0 0-1.3.1L4 5.1a1 1 0 0 0-.1 1.3l1 1.3c-.3.5-.6 1.1-.7 1.7l-1.6.3a1 1 0 0 0-.8 1v2.4a1 1 0 0 0 .8 1l1.6.3c.2.6.4 1.2.7 1.7l-1 1.3a1 1 0 0 0 .1 1.3l1.7 1.7a1 1 0 0 0 1.3.1l1.3-1c.5.3 1.1.6 1.7.7l.3 1.6a1 1 0 0 0 1 .8h2.4a1 1 0 0 0 1-.8l.3-1.6c.6-.2 1.2-.4 1.7-.7l1.3 1a1 1 0 0 0 1.3-.1l1.7-1.7a1 1 0 0 0 .1-1.3l-1-1.3c.3-.5.6-1.1.7-1.7l1.6-.3a1 1 0 0 0 .8-1V11a1 1 0 0 0-.8-1l-1.6-.3a7.8 7.8 0 0 0-.7-1.7l1-1.3a1 1 0 0 0-.1-1.3L18.4 4a1 1 0 0 0-1.3-.1l-1.3 1c-.5-.3-1.1-.6-1.7-.7l-.3-1.6a1 1 0 0 0-1-.8h-2.4a1 1 0 0 0-1 .8Zm1.3 6a3.7 3.7 0 1 1 0 7.4 3.7 3.7 0 0 1 0-7.4Z" />
    </svg>
  );
}

function iconForItem(id) {
  if (id === "dashboard") return <GridIcon />;
  if (id === "assigned") return <GroupIcon />;
  if (id === "reports") return <DescriptionIcon />;
  return <ExportIcon />;
}

const AssessmentCenterDashboardSidebar = () => {
  return (
    <aside className="border-b border-slate-200 bg-white p-4 lg:min-h-screen lg:border-b-0 lg:border-r">
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full text-white">
            <TesdaIcon />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">TESDA E-Assess</h1>
            <p className="text-base text-slate-500">Assessment Center</p>
          </div>
        </div>

        <nav className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left text-base font-medium transition ${
                item.active ? "bg-blue-100 text-blue-700" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span className={item.active ? "text-blue-700" : "text-slate-500"}>{iconForItem(item.id)}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-8 flex items-center gap-3 border-t border-slate-200 pt-5 lg:mt-auto">
          <span
            className="inline-flex h-10 w-10 rounded-full bg-slate-200 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCDRCk79J6VFvUvCHK0q3gZxGPxpQCa-PI7zItUwJ9-mbA2ZxkvGD6petnerGOAPd94VxUmVuyOMSMQ6W67Pri6SRdmn_oibfbt3hkXPbjn1zBUj4J-fHGdHA4WQllqc7DNzJvR0UbTPSGhmAQuCtXgTF2YhsD5417zi4S3538Wss9m1XzaGxmPojodyvzii6tGY5oKjR_3cuokLxBL-CgqIM_A27Wf-TjdR4DnNcs3mTNZ7BSombzBfSfO0T3l03xn0fbm2LaXXjRI')",
            }}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-slate-900">Director Reyes</p>
            <p className="text-sm text-slate-500">Center Administrator</p>
          </div>
          <button
            type="button"
            className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Settings"
          >
            <SettingsIcon />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AssessmentCenterDashboardSidebar;

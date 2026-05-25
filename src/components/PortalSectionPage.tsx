"use client";

import Link from "next/link";

type PortalSectionPageProps = {
  title: string;
  description: string;
  portalLabel: string;
  primaryActionLabel: string;
  secondaryActionLabel: string;
};

const infoCards = [
  {
    icon: "fa-regular fa-clock",
    label: "Latest Activity",
    value: "Updated just now",
  },
  {
    icon: "fa-solid fa-chart-line",
    label: "Status",
    value: "Ready for configuration",
  },
  {
    icon: "fa-regular fa-folder-open",
    label: "Workspace",
    value: "Connected to dashboard navigation",
  },
];

export default function PortalSectionPage({
  title,
  description,
  primaryActionLabel,
  secondaryActionLabel,
}: PortalSectionPageProps) {
  return (
    <main className="ui-portal-main pb-8 pt-8">
      <div className="ui-page-content">
        <section className="ui-page-header">
          <h1 className="ui-page-title text-[#002576]">{title}</h1>
          <p className="ui-page-description">{description}</p>
        </section>

        <section className="ui-surface-highlight mb-5 overflow-hidden p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-[44rem]">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Workspace</p>
              <h2 className="mt-2 text-[24px] font-bold leading-[1.2] text-[#0b1c30]">Section Ready for Real Content</h2>
              <p className="mt-2 text-[14px] leading-[1.65] text-[#536179]">
                This section is connected and ready. Use it as the starting point for live data, real workflows,
                and sharper role-based tools without reworking the navigation shell.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                className="rounded-lg bg-[#0038a8] px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-[#002576]"
                type="button"
              >
                {primaryActionLabel}
              </button>
              <button
                className="rounded-lg border border-[#c8d6ee] bg-white px-5 py-3 text-[14px] font-semibold text-[#002576] transition hover:bg-[#eef4ff]"
                type="button"
              >
                {secondaryActionLabel}
              </button>
            </div>
          </div>
        </section>

        <section className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          {infoCards.map((card) => (
            <article key={card.label} className="ui-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="ui-meta-label">{card.label}</p>
                  <p className="mt-2 text-[22px] font-semibold leading-[1.25] text-[#0b1c30]">{card.value}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f0ff] text-[#093cab]">
                  <i aria-hidden="true" className={card.icon} />
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
          <article className="ui-surface p-5">
            <h2 className="ui-section-title text-[#0b1c30]">Section Ready</h2>
            <p className="mt-2 text-[15px] leading-[1.6] text-[#444653]">
              This page is now connected to the sidebar. You can continue building out the real workflow for this
              section without the menu redirecting to nowhere.
            </p>

            <div className="mt-5 ui-subtle-divider">
              <div className="pt-3">
                <p className="ui-meta-label">Next Steps</p>
                <div className="mt-2">
                  <div className="ui-list-row">
                    <p className="text-[14px] leading-[1.55] text-[#444653]">Connect this section to its real data source or CRUD flow.</p>
                  </div>
                  <div className="ui-list-row">
                    <p className="text-[14px] leading-[1.55] text-[#444653]">Replace the placeholder metrics with live records and summaries.</p>
                  </div>
                  <div className="ui-list-row">
                    <p className="text-[14px] leading-[1.55] text-[#444653]">Keep the current layout so the navigation experience stays consistent.</p>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <aside className="ui-surface p-5">
            <h3 className="text-[20px] font-semibold text-[#0b1c30]">Quick Links</h3>
            <div className="mt-4">
              <Link
                className="ui-list-row text-[14px] font-semibold text-[#002576] transition hover:text-[#0038a8]"
                href="/"
              >
                <span>Back to Login</span>
                <i aria-hidden="true" className="fa-solid fa-arrow-right text-[12px]" />
              </Link>
              <button
                className="ui-list-row w-full text-[14px] font-semibold text-[#002576] transition hover:text-[#0038a8]"
                type="button"
              >
                <span>View Section Notes</span>
                <i aria-hidden="true" className="fa-regular fa-note-sticky text-[12px]" />
              </button>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

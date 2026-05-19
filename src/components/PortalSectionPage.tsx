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

        <section className="ui-surface-highlight mb-5 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button
              className="rounded-lg bg-[#0038a8] px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-[#002576]"
              type="button"
            >
              {primaryActionLabel}
            </button>
            <button
              className="rounded-lg border border-[#747685] px-5 py-3 text-[14px] font-semibold text-[#002576] transition hover:bg-[#e5eeff]"
              type="button"
            >
              {secondaryActionLabel}
            </button>
          </div>
        </section>

        <section className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          {infoCards.map((card) => (
            <article key={card.label} className="ui-surface p-4">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#dce1ff] text-[#093cab]">
                <i aria-hidden="true" className={card.icon} />
              </div>
              <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#5d5f5f]">{card.label}</p>
              <p className="mt-2 text-[22px] font-semibold leading-[1.3] text-[#0b1c30]">{card.value}</p>
            </article>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
          <article className="ui-surface p-4">
            <h2 className="ui-section-title text-[#0b1c30]">Section Ready</h2>
            <p className="mt-2 text-[15px] leading-[1.6] text-[#444653]">
              This page is now connected to the sidebar. You can continue building out the real workflow for this
              section without the menu redirecting to nowhere.
            </p>

            <div className="mt-5 rounded-lg border border-[#d9e3f7] bg-[#f8faff] p-4">
              <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#5d5f5f]">Next Steps</p>
              <ul className="mt-3 space-y-3 text-[14px] leading-[1.5] text-[#444653]">
                <li>Connect this section to its real data source or CRUD flow.</li>
                <li>Replace the placeholder metrics with live records and summaries.</li>
                <li>Keep the current layout so the navigation experience stays consistent.</li>
              </ul>
            </div>
          </article>

          <aside className="ui-surface p-4">
            <h3 className="text-[20px] font-semibold text-[#0b1c30]">Quick Links</h3>
            <div className="mt-4 space-y-3">
              <Link
                className="flex items-center justify-between rounded-lg border border-[#d9e3f7] px-4 py-3 text-[14px] font-semibold text-[#002576] transition hover:bg-[#eef3ff]"
                href="/"
              >
                Back to Login
                <i aria-hidden="true" className="fa-solid fa-arrow-right text-[12px]" />
              </Link>
              <button
                className="flex w-full items-center justify-between rounded-lg border border-[#d9e3f7] px-4 py-3 text-[14px] font-semibold text-[#002576] transition hover:bg-[#eef3ff]"
                type="button"
              >
                View Section Notes
                <i aria-hidden="true" className="fa-regular fa-note-sticky text-[12px]" />
              </button>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import AnimatedModal from "@/components/AnimatedModal";

type SidebarItem = {
  key: string;
  label: string;
  icon: string;
  href: string;
};

type DashboardSidebarProps = {
  portalLabel: string;
  items: SidebarItem[];
};

export default function DashboardSidebar({ portalLabel, items }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const activeItemHref =
    items
      .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
      .sort((firstItem, secondItem) => secondItem.href.length - firstItem.href.length)[0]?.href ?? null;

  const navigateTo = (href: string) => {
    setIsMobileNavOpen(false);
    router.push(href);
  };

  const performLogout = async () => {
    setIsMobileNavOpen(false);
    setIsLogoutConfirmOpen(false);
    setIsLoggingOut(true);
    try {
      await fetch("/api/logout", { method: "POST" });
      router.replace("/");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <div className="sticky top-0 z-30 border-b border-[#d9e3f7] bg-white/96 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eef4ff]">
              <Image alt="TESDA logo" className="h-7 w-7 object-contain" height={28} priority src="/images/tesda-logo.png" width={28} />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-[16px] font-bold leading-[1.15] text-[#002576]">TESDA E-Assess</h2>
              <p className="truncate text-[12px] leading-[1.3] text-[#5d6d8a]">{portalLabel}</p>
            </div>
          </div>

          <button
            aria-expanded={isMobileNavOpen}
            aria-label={isMobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#c4d1eb] bg-[#f8fbff] text-[#002576] transition duration-300 hover:bg-[#eff4ff]"
            onClick={() => setIsMobileNavOpen((currentValue) => !currentValue)}
            type="button"
          >
            <span className="relative block h-4 w-4">
              <span
                aria-hidden="true"
                className={`absolute left-1/2 top-1/2 h-[2px] w-4 -translate-x-1/2 rounded-full bg-current transition-all duration-300 ${
                  isMobileNavOpen ? "rotate-45" : "-translate-y-[5px]"
                }`}
              />
              <span
                aria-hidden="true"
                className={`absolute left-1/2 top-1/2 h-[2px] w-4 -translate-x-1/2 rounded-full bg-current transition-all duration-300 ${
                  isMobileNavOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                aria-hidden="true"
                className={`absolute left-1/2 top-1/2 h-[2px] w-4 -translate-x-1/2 rounded-full bg-current transition-all duration-300 ${
                  isMobileNavOpen ? "-rotate-45" : "translate-y-[5px]"
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      <div
        aria-hidden={!isMobileNavOpen}
        className={`fixed inset-0 z-40 transition-opacity duration-300 lg:hidden ${
          isMobileNavOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
          <button
            aria-label="Close navigation menu"
            className={`absolute inset-0 bg-[#0b1c30]/48 transition-opacity duration-300 ${
              isMobileNavOpen ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => setIsMobileNavOpen(false)}
            type="button"
          />
          <div
            className={`absolute left-0 top-0 flex h-full w-[86%] max-w-[320px] flex-col border-r border-[#2f61c7] bg-[#0038a8] pb-4 pt-5 shadow-[0_14px_34px_rgba(15,23,42,0.14)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isMobileNavOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="mb-5 flex items-center gap-3 px-5">
              <Image
                alt="TESDA logo"
                className="h-10 w-10 object-contain [filter:brightness(0)_invert(1)]"
                height={40}
                priority
                src="/images/tesda-logo.png"
                width={40}
              />
              <div className="min-w-0">
                <h2 className="truncate text-[18px] font-bold leading-[1.15] text-white">TESDA E-Assess</h2>
                <p className="mt-1 truncate text-[13px] leading-[1.25] text-[#d9e7ff]">{portalLabel}</p>
              </div>
            </div>

            <nav className="flex-1 space-y-1 px-2">
              {items.map((item) => {
                const isActive = activeItemHref === item.href;

                return (
                  <button
                    key={item.key}
                    className={`flex w-full items-center gap-3 rounded-lg px-5 py-3 text-left text-[13px] font-medium transition-all ${
                      isActive
                        ? "bg-white/16 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)]"
                        : "text-[#d9e7ff] hover:bg-white/12 hover:text-white"
                    }`}
                    onClick={() => navigateTo(item.href)}
                    type="button"
                  >
                    <i aria-hidden="true" className={item.icon} />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="mt-auto px-2 pt-4">
              <button
                className="flex w-full items-center gap-3 rounded-lg px-5 py-3 text-left text-[13px] font-medium text-[#d9e7ff] transition-all hover:bg-white/12 hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isLoggingOut}
                onClick={() => {
                  setIsMobileNavOpen(false);
                  setIsLogoutConfirmOpen(true);
                }}
                type="button"
              >
                <i aria-hidden="true" className="fa-solid fa-right-from-bracket" />
                {isLoggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>
      </div>

      <aside className="fixed left-0 top-0 z-40 hidden h-full w-64 flex-col border-r border-[#2f61c7] bg-[#0038a8] pb-4 pt-6 lg:flex">
        <div className="mb-5 px-6">
          <div className="mb-4 flex items-center gap-3">
            <Image
              alt="TESDA logo"
              className="h-10 w-10 object-contain [filter:brightness(0)_invert(1)]"
              height={40}
              priority
              src="/images/tesda-logo.png"
              width={40}
            />
            <div>
              <h2 className="text-[18px] font-bold leading-[1.15] text-white">TESDA E-Assess</h2>
              <p className="mt-1 text-[14px] leading-[1.2] text-[#d9e7ff]">{portalLabel}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-2">
          {items.map((item) => {
            const isActive = activeItemHref === item.href;

            return (
              <button
                key={item.key}
                className={`flex w-full items-center gap-3 rounded-lg px-6 py-3 text-left text-[13px] font-medium transition-all ${
                  isActive
                    ? "bg-white/16 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)]"
                    : "text-[#d9e7ff] hover:bg-white/12 hover:text-white"
                }`}
                onClick={() => navigateTo(item.href)}
                type="button"
              >
                <i aria-hidden="true" className={item.icon} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto px-2 pt-4">
          <button
            className="flex w-full items-center gap-3 rounded-lg px-6 py-3 text-left text-[13px] font-medium text-[#d9e7ff] transition-all hover:bg-white/12 hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isLoggingOut}
            onClick={() => setIsLogoutConfirmOpen(true)}
            type="button"
          >
            <i aria-hidden="true" className="fa-solid fa-right-from-bracket" />
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </aside>

      <AnimatedModal
        contentClassName="w-full max-w-[420px] rounded-[12px] border border-[#d9e3f7] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
        open={isLogoutConfirmOpen}
      >
        <div className="border-b border-[#d9e3f7] px-6 py-4">
          <h2 className="text-[24px] font-semibold leading-[1.2] text-[#0b1c30]">Confirm Logout</h2>
          <p className="mt-1 text-[13px] leading-[1.5] text-[#444653]">
            Are you sure you want to log out of the TESDA E-Assess portal?
          </p>
        </div>

        <div className="space-y-3 rounded-b-[20px] bg-[#f8fbff] px-6 py-4">
          <div className="rounded-lg border border-[#d9e3f7] bg-white px-4 py-3.5">
            <p className="text-[13px] leading-[1.6] text-[#0b1c30]">
              You will be returned to the main login page and need to sign in again to continue.
            </p>
          </div>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <button
              className="inline-flex min-w-[112px] items-center justify-center rounded-lg border border-[#d9e3f7] bg-white px-4 py-2.5 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
              onClick={() => setIsLogoutConfirmOpen(false)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="inline-flex min-w-[112px] items-center justify-center rounded-lg bg-[#c62828] px-4 py-2.5 text-[12px] font-bold text-white shadow-[0_10px_24px_rgba(198,40,40,0.16)] transition hover:bg-[#b71c1c]"
              onClick={performLogout}
              type="button"
            >
              Log Out
            </button>
          </div>
        </div>
      </AnimatedModal>

      <AnimatedModal
        contentClassName="w-full max-w-[340px] rounded-[12px] border border-[#d9e3f7] bg-white px-6 py-5 text-center shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
        open={isLoggingOut}
        zIndexClassName="z-[60]"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eef4ff] text-[#3056c4]">
          <i aria-hidden="true" className="fa-solid fa-spinner animate-spin text-[18px]" />
        </div>
        <p className="mt-3 text-[17px] font-bold text-[#0b1c30]">Logging you out</p>
        <p className="mt-1.5 text-[13px] leading-[1.5] text-[#5d5f5f]">
          Please wait while we securely end your session.
        </p>
      </AnimatedModal>
    </>
  );
}

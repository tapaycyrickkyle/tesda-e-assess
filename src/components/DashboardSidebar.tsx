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
  const activeItemHref =
    items
      .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
      .sort((firstItem, secondItem) => secondItem.href.length - firstItem.href.length)[0]?.href ?? null;

  const performLogout = async () => {
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
    <aside className="fixed left-0 top-0 z-40 hidden h-full w-64 flex-col border-r border-[#2f61c7] bg-[#0038a8] pb-4 pt-6 lg:flex">
      <div className="mb-6 px-6">
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
              onClick={() => router.push(item.href)}
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
          <i className="fa-solid fa-right-from-bracket" />
          {isLoggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>

      <AnimatedModal
        contentClassName="w-full max-w-[420px] rounded-[20px] border border-[#c4c5d5] bg-white shadow-[0_24px_60px_rgba(4,15,37,0.22)]"
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
                  className="inline-flex min-w-[112px] items-center justify-center rounded-lg border border-[#c4c5d5] bg-white px-4 py-2.5 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                  onClick={() => setIsLogoutConfirmOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="inline-flex min-w-[112px] items-center justify-center rounded-lg bg-[#c65a5a] px-4 py-2.5 text-[12px] font-bold text-white transition hover:bg-[#b84d4d]"
                  onClick={performLogout}
                  type="button"
                >
                  Log Out
                </button>
              </div>
            </div>
      </AnimatedModal>

      <AnimatedModal
        contentClassName="w-full max-w-[340px] rounded-[20px] border border-[#c4d6f6] bg-white px-6 py-5 text-center shadow-[0_24px_60px_rgba(4,15,37,0.22)]"
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
    </aside>
  );
}

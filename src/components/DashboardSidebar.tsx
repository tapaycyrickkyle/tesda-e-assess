"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

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
  const activeItemHref =
    items
      .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
      .sort((firstItem, secondItem) => secondItem.href.length - firstItem.href.length)[0]?.href ?? null;

  const performLogout = async () => {
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
          onClick={performLogout}
          type="button"
        >
          <i className="fa-solid fa-right-from-bracket" />
          {isLoggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>
    </aside>
  );
}

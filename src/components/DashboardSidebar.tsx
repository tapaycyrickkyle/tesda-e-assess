"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  userAvatarUrl?: string | null;
  userEmail: string;
};

export default function DashboardSidebar({ portalLabel, items, userAvatarUrl, userEmail }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const mobileMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobileCloseButtonRef = useRef<HTMLButtonElement | null>(null);
  const shouldRestoreFocusRef = useRef(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const activeItemHref =
    items
      .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
      .sort((firstItem, secondItem) => secondItem.href.length - firstItem.href.length)[0]?.href ?? null;
  const accountItem = items.find((item) => item.key === "account");
  const navigationItems = items.filter((item) => item.key !== "account");
  const displayEmail = userEmail.trim() || "Signed-in user";
  const emailInitial = displayEmail.charAt(0).toUpperCase();
  const resolvedAvatarUrl = userAvatarUrl?.trim() ? userAvatarUrl.trim() : null;
  const canShowAvatar = Boolean(resolvedAvatarUrl) && failedAvatarUrl !== resolvedAvatarUrl;

  const closeMobileNav = () => {
    setIsMobileNavOpen(false);
  };

  useEffect(() => {
    if (!isMobileNavOpen) {
      if (shouldRestoreFocusRef.current) {
        mobileMenuButtonRef.current?.focus();
        shouldRestoreFocusRef.current = false;
      }
      return;
    }

    shouldRestoreFocusRef.current = true;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimeoutId = window.setTimeout(() => {
      mobileCloseButtonRef.current?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileNavOpen(false);
      }
    };

    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const handleMediaChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setIsMobileNavOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    mediaQuery.addEventListener("change", handleMediaChange);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      mediaQuery.removeEventListener("change", handleMediaChange);
      window.clearTimeout(focusTimeoutId);
    };
  }, [isMobileNavOpen]);

  const performLogout = async () => {
    setIsMobileNavOpen(false);
    setIsLoggingOut(true);
    setLogoutError(null);
    try {
      const response = await fetch("/api/logout", { method: "POST" });
      if (!response.ok) {
        throw new Error("Logout request failed.");
      }
      router.replace("/");
      router.refresh();
    } catch {
      setLogoutError("We couldn't log you out right now. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const accountLinkClassName =
    "flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-left transition-all hover:bg-white/10 hover:text-white";

  const renderAvatar = (sizeClassName: string, textClassName: string) => {
    if (resolvedAvatarUrl && canShowAvatar) {
      return (
        <span className={`inline-flex shrink-0 overflow-hidden rounded-full bg-white/12 ${sizeClassName}`}>
          <img
            alt={`${displayEmail} profile`}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setFailedAvatarUrl(resolvedAvatarUrl)}
            referrerPolicy="no-referrer"
            src={resolvedAvatarUrl}
          />
        </span>
      );
    }

    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-full bg-white text-[#0038a8] shadow-[0_6px_18px_rgba(11,28,48,0.16)] ${sizeClassName} ${textClassName}`}
      >
        {emailInitial}
      </span>
    );
  };

  return (
    <>
      <div className="sticky top-0 z-30 border-b border-[#d9e3f7] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(244,248,255,0.94)_100%)] backdrop-blur lg:hidden">
        <div className="flex items-center gap-3 px-4 py-2.5 sm:px-6">
            <button
              aria-expanded={isMobileNavOpen}
              aria-label={isMobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#c4d1eb] bg-[#f8fbff] text-[#002576] transition duration-300 hover:bg-[#eff4ff] lg:hidden"
              onClick={() => setIsMobileNavOpen((currentValue) => !currentValue)}
              ref={mobileMenuButtonRef}
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

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eef4ff] shadow-[inset_0_0_0_1px_rgba(207,224,255,0.72)] lg:hidden">
              <Image alt="TESDA logo" className="h-7 w-7 object-contain" height={28} priority src="/images/tesda-logo.png" width={28} />
            </div>

            <div className="min-w-0 lg:hidden">
              <p className="truncate text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">{portalLabel}</p>
              <h2 className="truncate text-[15px] font-bold leading-[1.15] text-[#0b1c30]">TESDA E-Assess</h2>
            </div>
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
            onClick={closeMobileNav}
            type="button"
          />
          <div
            aria-labelledby="mobile-sidebar-title"
            aria-modal="true"
            className={`absolute left-0 top-0 flex h-full w-[86%] max-w-[320px] flex-col border-r border-[#285ebf] bg-[linear-gradient(180deg,#0038a8_0%,#0b2f7d_100%)] pb-4 pt-5 shadow-[0_18px_40px_rgba(15,23,42,0.22)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isMobileNavOpen ? "translate-x-0" : "-translate-x-full"
            }`}
            role="dialog"
          >
            <div className="mb-5 flex items-start justify-between gap-3 px-5">
              <div className="flex min-w-0 items-center gap-3">
                <Image
                  alt="TESDA logo"
                  className="h-10 w-10 object-contain [filter:brightness(0)_invert(1)]"
                  height={40}
                  priority
                  src="/images/tesda-logo.png"
                  width={40}
                />
                <div className="min-w-0">
                  <h2 className="truncate text-[18px] font-bold leading-[1.15] text-white" id="mobile-sidebar-title">
                    TESDA E-Assess
                  </h2>
                  <p className="mt-1 truncate text-[13px] leading-[1.25] text-[#d9e7ff]">{portalLabel}</p>
                </div>
              </div>
              <button
                aria-label="Close navigation menu"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition hover:bg-white/16"
                onClick={closeMobileNav}
                ref={mobileCloseButtonRef}
                type="button"
              >
                <i aria-hidden="true" className="fa-solid fa-xmark text-[16px]" />
              </button>
            </div>

            <nav aria-label={`${portalLabel} navigation`} className="flex-1 space-y-1.5 px-3">
              {navigationItems.map((item) => {
                const isActive = activeItemHref === item.href;

                return (
                  <Link
                    key={item.key}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[13px] font-medium transition-all ${
                      isActive
                        ? "bg-white/16 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)]"
                        : "text-[#d9e7ff] hover:bg-white/10 hover:text-white"
                    }`}
                    href={item.href}
                    onClick={closeMobileNav}
                  >
                    <i aria-hidden="true" className={item.icon} />
                    {item.label}
                  </Link>
                );
              })}
        </nav>

        <div className="mt-auto px-3 pt-4">
          {accountItem ? (
            <Link className={accountLinkClassName} href={accountItem.href} onClick={closeMobileNav}>
              {renderAvatar("h-9 w-9", "text-[13px] font-bold")}
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#bfd4ff]">Account</p>
                    <p className="truncate text-[13px] font-semibold leading-[1.3] text-white">{displayEmail}</p>
                  </div>
                </Link>
              ) : null}
              <button
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[13px] font-medium text-[#d9e7ff] transition-all hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isLoggingOut}
                onClick={() => {
                  setIsMobileNavOpen(false);
                  setLogoutError(null);
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

      <aside className="fixed left-0 top-0 z-40 hidden h-full w-64 flex-col border-r border-[#285ebf] bg-[linear-gradient(180deg,#0038a8_0%,#0b2f7d_100%)] pb-5 pt-6 lg:flex">
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

        <nav className="flex-1 space-y-1.5 px-3">
          {navigationItems.map((item) => {
            const isActive = activeItemHref === item.href;

            return (
              <Link
                key={item.key}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[13px] font-medium transition-all ${
                  isActive
                    ? "bg-white/16 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)]"
                    : "text-[#d9e7ff] hover:bg-white/10 hover:text-white"
                }`}
                href={item.href}
              >
                <i aria-hidden="true" className={item.icon} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-3 pt-4">
          {accountItem ? (
            <Link className={accountLinkClassName} href={accountItem.href}>
              {renderAvatar("h-9 w-9", "text-[13px] font-bold")}
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#bfd4ff]">Account</p>
                <p className="truncate text-[13px] font-semibold leading-[1.3] text-white">{displayEmail}</p>
              </div>
            </Link>
          ) : null}
          <button
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[13px] font-medium text-[#d9e7ff] transition-all hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isLoggingOut}
            onClick={() => {
              setLogoutError(null);
              setIsLogoutConfirmOpen(true);
            }}
            type="button"
          >
            <i aria-hidden="true" className="fa-solid fa-right-from-bracket" />
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </aside>

      <AnimatedModal
        contentClassName="w-full max-w-[400px] rounded-xl border border-[#d9e3f7] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
        open={isLogoutConfirmOpen}
      >
        <div className="border-b border-[#d9e3f7] px-6 py-5">
          <div className="min-w-0">
            <h2 className="ui-section-title text-[#0b1c30]">Log out?</h2>
            <p className="mt-1 text-[13px] leading-[1.5] text-[#444653]">
              You&apos;ll return to the sign-in page and need to log in again to continue.
            </p>
          </div>
        </div>

        <div className="ui-modal-section space-y-3 px-6 py-4">
          {logoutError ? (
            <div
              aria-live="polite"
              className="rounded-lg border border-[#f0b4b4] bg-[#fff1f1] px-3 py-2.5 text-[13px] leading-[1.5] text-[#8a1c1c]"
            >
              {logoutError}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <button
              className="inline-flex min-w-[112px] items-center justify-center rounded-lg border border-[#d9e3f7] bg-white px-4 py-2.5 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isLoggingOut}
              onClick={() => {
                setLogoutError(null);
                setIsLogoutConfirmOpen(false);
              }}
              type="button"
            >
              Cancel
            </button>
            <button
              className="inline-flex min-w-[112px] items-center justify-center gap-2 rounded-lg bg-[#0038a8] px-4 py-2.5 text-[12px] font-bold text-white shadow-[0_10px_24px_rgba(0,56,168,0.18)] transition hover:bg-[#002d86] disabled:cursor-not-allowed disabled:bg-[#6b8fd6] disabled:shadow-none"
              disabled={isLoggingOut}
              onClick={performLogout}
              type="button"
            >
              {isLoggingOut ? (
                <>
                  <i aria-hidden="true" className="fa-solid fa-spinner animate-spin text-[12px]" />
                  Logging out...
                </>
              ) : (
                "Log Out"
              )}
            </button>
          </div>
        </div>
      </AnimatedModal>
    </>
  );
}

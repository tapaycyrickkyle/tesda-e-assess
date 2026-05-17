"use client";

import { useEffect, useState } from "react";

type NotificationVariant = "error" | "info" | "success" | "warning";

const variantStyles: Record<
  NotificationVariant,
  {
    accent: string;
    background: string;
    border: string;
    icon: string;
    message: string;
  }
> = {
  error: {
    accent: "text-[#93000a]",
    background: "bg-[#fff4f4]",
    border: "border-[#f3d6d6]",
    icon: "fa-solid fa-circle-exclamation",
    message: "text-[#7a1f1f]",
  },
  info: {
    accent: "text-[#3056c4]",
    background: "bg-[#eef4ff]",
    border: "border-[#d4def2]",
    icon: "fa-solid fa-circle-info",
    message: "text-[#24448f]",
  },
  success: {
    accent: "text-[#1f7a45]",
    background: "bg-[#edf9f1]",
    border: "border-[#bfe3cc]",
    icon: "fa-solid fa-check",
    message: "text-[#215c36]",
  },
  warning: {
    accent: "text-[#8a5200]",
    background: "bg-[#fff8e8]",
    border: "border-[#f3dfb2]",
    icon: "fa-solid fa-triangle-exclamation",
    message: "text-[#7f5b00]",
  },
};

export default function NotificationToast({
  message,
  onClose,
  open,
  title,
  variant,
}: {
  message: string;
  onClose?: () => void;
  open: boolean;
  title: string;
  variant: NotificationVariant;
}) {
  const [isRendered, setIsRendered] = useState(open);
  const [isVisible, setIsVisible] = useState(open);

  useEffect(() => {
    let enterTimeoutId: number | null = null;
    let exitTimeoutId: number | null = null;

    if (open) {
      enterTimeoutId = window.setTimeout(() => {
        setIsRendered(true);
        setIsVisible(true);
      }, 10);
    } else {
      enterTimeoutId = window.setTimeout(() => {
        setIsVisible(false);
      }, 0);
      exitTimeoutId = window.setTimeout(() => {
        setIsRendered(false);
      }, 260);
    }

    return () => {
      if (enterTimeoutId !== null) {
        window.clearTimeout(enterTimeoutId);
      }
      if (exitTimeoutId !== null) {
        window.clearTimeout(exitTimeoutId);
      }
    };
  }, [open]);

  if (!isRendered) {
    return null;
  }

  const styles = variantStyles[variant];

  return (
    <div
      className="pointer-events-none fixed inset-x-3 top-4 z-[70] flex justify-center sm:inset-x-4 sm:top-4 lg:left-64 lg:right-8 lg:justify-end"
      data-state={isVisible ? "open" : "closed"}
    >
      <div
        className={`ui-toast-pop pointer-events-auto w-full max-w-[420px] rounded-[12px] border ${styles.border} ${styles.background} px-4 py-3.5 shadow-[0_10px_24px_rgba(15,23,42,0.10)] sm:px-5 sm:py-4`}
        data-state={isVisible ? "open" : "closed"}
      >
        <div className="flex items-start gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/70 ${styles.accent} sm:h-10 sm:w-10`}>
            <i aria-hidden="true" className={`${styles.icon} text-[14px]`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-[13px] font-bold uppercase tracking-[0.08em] ${styles.accent}`}>{title}</p>
            <p className={`mt-1 text-[14px] leading-[1.55] ${styles.message}`}>{message}</p>
          </div>
          {onClose ? (
            <button
              className={`pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/70 ${styles.accent}`}
              onClick={onClose}
              type="button"
            >
              <i aria-hidden="true" className="fa-solid fa-xmark text-[13px]" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

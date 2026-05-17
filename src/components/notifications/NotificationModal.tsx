"use client";

import type { ReactNode } from "react";
import AnimatedModal from "@/components/AnimatedModal";

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
    background: "bg-[#ffe3e3]",
    border: "border-[#f0b4b4]",
    icon: "fa-solid fa-circle-xmark",
    message: "text-[#0b1c30]",
  },
  info: {
    accent: "text-[#3056c4]",
    background: "bg-[#eef4ff]",
    border: "border-[#c4d6f6]",
    icon: "fa-solid fa-circle-info",
    message: "text-[#0b1c30]",
  },
  success: {
    accent: "text-[#1f7a45]",
    background: "bg-[#edf9f1]",
    border: "border-[#bfe3cc]",
    icon: "fa-solid fa-circle-check",
    message: "text-[#215c36]",
  },
  warning: {
    accent: "text-[#8a5200]",
    background: "bg-[#fff4db]",
    border: "border-[#f3dfb2]",
    icon: "fa-solid fa-hourglass-half",
    message: "text-[#0b1c30]",
  },
};

export default function NotificationModal({
  actions,
  description,
  message,
  onClose,
  open,
  title,
  variant,
}: {
  actions?: ReactNode;
  description?: string;
  message: string;
  onClose?: () => void;
  open: boolean;
  title: string;
  variant: NotificationVariant;
}) {
  const styles = variantStyles[variant];

  return (
    <AnimatedModal
      contentClassName={`w-full max-w-[420px] rounded-[12px] border ${styles.border} bg-white px-6 py-6 shadow-[0_12px_30px_rgba(15,23,42,0.12)]`}
      open={open}
    >
      {open ? (
        <div className="text-center">
          {onClose ? (
            <div className="mb-2 flex justify-end">
              <button
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#5d5f5f] transition hover:bg-[#f3f6fd]"
                onClick={onClose}
                type="button"
              >
                <i aria-hidden="true" className="fa-solid fa-xmark text-[13px]" />
              </button>
            </div>
          ) : null}
          <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${styles.background} ${styles.accent}`}>
            <i aria-hidden="true" className={`${styles.icon} text-[20px]`} />
          </div>
          <p className={`mt-4 text-[13px] font-bold uppercase tracking-[0.08em] ${styles.accent}`}>{title}</p>
          <p className={`mt-3 text-[16px] leading-[1.6] ${styles.message}`}>{message}</p>
          {description ? <p className="mt-2 text-[13px] leading-[1.55] text-[#5d5f5f]">{description}</p> : null}
          {actions ? <div className="mt-5">{actions}</div> : null}
        </div>
      ) : null}
    </AnimatedModal>
  );
}

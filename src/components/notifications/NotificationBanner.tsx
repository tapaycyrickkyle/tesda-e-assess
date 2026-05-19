import type { ReactNode } from "react";

type NotificationVariant = "error" | "info" | "success" | "warning";

const variantStyles: Record<
  NotificationVariant,
  {
    accent: string;
    background: string;
    border: string;
    icon: string;
    text: string;
  }
> = {
  error: {
    accent: "text-[#93000a]",
    background: "bg-[#fff4f4]",
    border: "border-[#f3d6d6]",
    icon: "fa-solid fa-circle-exclamation",
    text: "text-[#93000a]",
  },
  info: {
    accent: "text-[#3056c4]",
    background: "bg-[#eef4ff]",
    border: "border-[#d4def2]",
    icon: "fa-solid fa-circle-info",
    text: "text-[#24448f]",
  },
  success: {
    accent: "text-[#1f7a45]",
    background: "bg-[#edf9f1]",
    border: "border-[#bfe3cc]",
    icon: "fa-solid fa-circle-check",
    text: "text-[#215c36]",
  },
  warning: {
    accent: "text-[#8a5200]",
    background: "bg-[#fff8e8]",
    border: "border-[#f3dfb2]",
    icon: "fa-solid fa-triangle-exclamation",
    text: "text-[#7f5b00]",
  },
};

export default function NotificationBanner({
  className = "",
  compact = false,
  message,
  title,
  variant,
}: {
  className?: string;
  compact?: boolean;
  message: ReactNode;
  title?: string;
  variant: NotificationVariant;
}) {
  const styles = variantStyles[variant];

  return (
    <div
      className={`rounded-xl border ${styles.border} ${styles.background} ${
        compact ? "px-4 py-3" : "px-4 py-3.5"
      } ${className}`.trim()}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/70 ${styles.accent}`}
        >
          <i aria-hidden="true" className={`${styles.icon} text-[14px]`} />
        </div>
        <div className="min-w-0">
          {title ? (
            <p className={`text-[12px] font-bold uppercase tracking-[0.08em] ${styles.accent}`}>{title}</p>
          ) : null}
          <div className={`${title ? "mt-1" : ""} text-[13px] leading-[1.6] ${styles.text}`}>{message}</div>
        </div>
      </div>
    </div>
  );
}

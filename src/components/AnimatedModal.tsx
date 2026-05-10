"use client";

import { useEffect, useState, type ReactNode } from "react";

type AnimatedModalProps = {
  backdropClassName?: string;
  children: ReactNode;
  contentClassName: string;
  open: boolean;
  zIndexClassName?: string;
};

const EXIT_ANIMATION_MS = 220;

export default function AnimatedModal({
  backdropClassName = "",
  children,
  contentClassName,
  open,
  zIndexClassName = "z-50",
}: AnimatedModalProps) {
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
      enterTimeoutId = window.setTimeout(() => setIsVisible(false), 0);
      exitTimeoutId = window.setTimeout(() => setIsRendered(false), EXIT_ANIMATION_MS);
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

  return (
    <div
      className={`ui-modal-backdrop fixed inset-0 flex items-center justify-center bg-[#0b1c30]/45 px-4 py-4 ${zIndexClassName} ${backdropClassName}`.trim()}
      data-state={isVisible ? "open" : "closed"}
    >
      <div className={`ui-modal-pop ${contentClassName}`.trim()} data-state={isVisible ? "open" : "closed"}>
        {children}
      </div>
    </div>
  );
}

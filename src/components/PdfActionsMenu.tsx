"use client";

import { useEffect, useRef, useState } from "react";
import { buildApplicationSubmissionPdfUrl } from "@/lib/application-submission-pdf";

type PdfActionsMenuProps = {
  align?: "left" | "right";
  className?: string;
  submissionId: string;
};

const triggerClassName =
  "inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#d9e3f7] bg-white font-sans text-[#24364c] shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition hover:bg-[#f8fbff] hover:text-[#002576]";

const actionClassName =
  "flex items-center rounded-lg px-3 py-2.5 font-sans text-[13px] font-medium text-[#24364c] transition hover:bg-[#f4f7ff] hover:text-[#002576]";

const MENU_WIDTH = 250;
const VIEWPORT_PADDING = 12;
const MENU_OFFSET = 8;

export default function PdfActionsMenu({
  align = "right",
  className = "",
  submissionId,
}: PdfActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuStyle, setMenuStyle] = useState<{ left: number; maxHeight: number; top: number }>({
    left: VIEWPORT_PADDING,
    maxHeight: 320,
    top: VIEWPORT_PADDING,
  });

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function updateMenuPosition() {
      if (!containerRef.current || !menuRef.current) {
        return;
      }

      const triggerRect = containerRef.current.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let left =
        align === "left"
          ? triggerRect.left
          : triggerRect.right - MENU_WIDTH;

      left = Math.max(VIEWPORT_PADDING, Math.min(left, viewportWidth - MENU_WIDTH - VIEWPORT_PADDING));

      const spaceBelow = viewportHeight - triggerRect.bottom - VIEWPORT_PADDING;
      const spaceAbove = triggerRect.top - VIEWPORT_PADDING;
      const shouldOpenAbove = spaceBelow < menuRect.height + MENU_OFFSET && spaceAbove > spaceBelow;

      const top = shouldOpenAbove
        ? Math.max(VIEWPORT_PADDING, triggerRect.top - menuRect.height - MENU_OFFSET)
        : Math.min(triggerRect.bottom + MENU_OFFSET, viewportHeight - menuRect.height - VIEWPORT_PADDING);

      const maxHeight = Math.max(180, (shouldOpenAbove ? spaceAbove : spaceBelow) - MENU_OFFSET);

      setMenuStyle({
        left,
        maxHeight,
        top,
      });
    }

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [align, isOpen]);

  return (
    <div className={`relative inline-flex ${className}`.trim()} ref={containerRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Open PDF actions"
        className={triggerClassName}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <i aria-hidden="true" className="fa-solid fa-ellipsis-vertical text-[16px]" />
      </button>

      {isOpen ? (
        <div
          className="fixed z-30 w-[250px] overflow-y-auto rounded-xl border border-[#d9e3f7] bg-white font-sans shadow-[0_18px_40px_rgba(15,23,42,0.14)]"
          ref={menuRef}
          role="menu"
          style={menuStyle}
        >
          <div className="border-b border-[#edf2fd] px-2 py-2">
            <p className="px-2 pb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#747685]">Application PDF</p>
            <a
              className={actionClassName}
              href={buildApplicationSubmissionPdfUrl(submissionId)}
              rel="noreferrer"
              role="menuitem"
              target="_blank"
            >
              <span>View Application PDF</span>
            </a>
            <a
              className={actionClassName}
              href={buildApplicationSubmissionPdfUrl(submissionId, { download: true })}
              role="menuitem"
            >
              <span>Download Application PDF</span>
            </a>
          </div>

          <div className="px-2 py-2">
            <p className="px-2 pb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#747685]">SAG PDF</p>
            <a
              className={actionClassName}
              href={buildApplicationSubmissionPdfUrl(submissionId, { document: "sag" })}
              rel="noreferrer"
              role="menuitem"
              target="_blank"
            >
              <span>View SAG PDF</span>
            </a>
            <a
              className={actionClassName}
              href={buildApplicationSubmissionPdfUrl(submissionId, { document: "sag", download: true })}
              role="menuitem"
            >
              <span>Download SAG PDF</span>
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import type { ReactNode } from "react";

export const SIDEBAR_WIDTH = 360;

const cx = (...p: Array<string | false | null | undefined>) => p.filter(Boolean).join(" ");

export function SidebarLayout({
  theme,
  title,
  subtitle,
  children,
  footer,
  width = SIDEBAR_WIDTH,
}: {
  theme: "dark" | "light";
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  const isDark = theme === "dark";
  const muted = isDark ? "text-white/55" : "text-black/55";

  return (
    <aside
      className={cx(
        "border-r flex flex-col",
        isDark ? "border-white/10 bg-[#0f1512] text-white" : "border-black/10 bg-white text-black"
      )}
      style={{ width }}
    >
      {/* HEADER */}
      <div className={cx("p-4 border-b", isDark ? "border-white/10" : "border-black/10")}>
        <div className="font-extrabold text-lg">{title}</div>
        {subtitle ? <p className={cx("text-xs mt-1", muted)}>{subtitle}</p> : null}
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto p-3">{children}</div>

      {/* FOOTER */}
      {footer ? (
        <div className={cx("p-3 border-t", isDark ? "border-white/10" : "border-black/10")}>{footer}</div>
      ) : null}
    </aside>
  );
}

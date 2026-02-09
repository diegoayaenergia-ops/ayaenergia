"use client";

import type { ReactNode } from "react";
import { SIDEBAR_WIDTH } from "@/components/sidebar/SidebarLayout";

const cx = (...p: Array<string | false | null | undefined>) =>
  p.filter(Boolean).join(" ");

export function SplitShell({
  sidebar,
  children,
  sidebarWidth = SIDEBAR_WIDTH,
}: {
  sidebar: ReactNode;
  children: ReactNode;
  sidebarWidth?: number;
}) {
  return (
    <div className="absolute inset-0 flex bg-[#f6f7f8] text-black">
      {/* SIDEBAR */}
      <aside
        className={cx(
          "border-r flex flex-col",
          "border-black/10 bg-white"
        )}
        style={{ width: sidebarWidth }}
      >
        {sidebar}
      </aside>

      {/* CONTENT */}
      <main className="flex-1 p-4">
        <div
          className={cx(
            "h-full rounded-2xl border overflow-hidden",
            "border-black/10 bg-white",
            "shadow-[0_18px_60px_-30px_rgba(0,0,0,0.18)]"
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}

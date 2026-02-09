"use client";

const cx = (...p: Array<string | false | null | undefined>) => p.filter(Boolean).join(" ");

export function SidebarItem({
  theme,
  active,
  title,
  hint,
  onClick,
}: {
  theme: "dark" | "light";
  active: boolean;
  title: string;
  hint?: string;
  onClick: () => void;
}) {
  const isDark = theme === "dark";
  const muted = isDark ? "text-white/55" : "text-black/55";

  return (
    <button
      onClick={onClick}
      className={cx(
        "w-full text-left px-3 py-2 rounded-xl border transition",
        "flex items-center justify-between gap-3",
        active
          ? isDark
            ? "bg-white/10 border-[#5CAE70]/40"
            : "bg-black/[0.04] border-[#2E7B57]/30"
          : isDark
          ? "bg-white/0 border-white/10 hover:bg-white/[0.06]"
          : "bg-white border-black/10 hover:bg-black/[0.03]"
      )}
    >
      <span className="text-sm font-semibold">{title}</span>
      {hint ? <span className={cx("text-[11px]", muted)}>{hint}</span> : null}
    </button>
  );
}

"use client";

import type { LucideIcon } from "lucide-react";

const cx = (...p: Array<string | false | null | undefined>) =>
  p.filter(Boolean).join(" ");

/* =========================================================
   PILL
========================================================= */
type PillProps = {
  label: string;
  icon?: LucideIcon;
};

export function Pill({ label, icon: Icon }: PillProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs md:text-sm",
        "border-black/10 bg-white text-black/70"
      )}
    >
      {Icon ? <Icon size={14} className="text-green-800" /> : null}
      {label}
    </span>
  );
}

/* =========================================================
   BULLET
========================================================= */
type BulletProps = {
  title: string;
  text: string;
};

export function Bullet({ title, text }: BulletProps) {
  return (
    <div className="flex gap-3">
      <span className="mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 bg-green-700" />
      <div>
        <div className="text-md font-semibold text-black/85">{title}</div>
        <div className="text-sm leading-relaxed text-black/65">{text}</div>
      </div>
    </div>
  );
}

/* =========================================================
   ENTERPRISE CARD
========================================================= */
type EnterpriseCardProps = {
  icon: LucideIcon;
  title: string;
  desc: string;
};

export function EnterpriseCard({
  icon: Icon,
  title,
  desc,
}: EnterpriseCardProps) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-[0_8px_30px_-18px_rgba(0,0,0,0.25)]">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl border border-green-900/10 bg-green-900/[0.06] flex items-center justify-center">
          <Icon size={20} className="text-green-800" />
        </div>

        <div>
          <div className="text-base font-bold text-green-950">{title}</div>
          <p className="mt-1 text-sm leading-relaxed text-black/65">{desc}</p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   BIG SERVICE CARD
========================================================= */
type BigServiceCardProps = {
  icon: LucideIcon;
  title: string;
  desc: string;
  body: string;
};

export function BigServiceCard({
  icon: Icon,
  title,
  desc,
  body,
}: BigServiceCardProps) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-[0_10px_34px_-20px_rgba(0,0,0,0.25)]">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl border border-green-900/10 bg-green-900/[0.06] flex items-center justify-center">
          <Icon size={22} className="text-green-800" />
        </div>

        <div className="min-w-0">
          <div className="text-lg font-extrabold text-green-950">{title}</div>
          <p className="mt-1 text-sm leading-relaxed text-black/65">{desc}</p>
        </div>
      </div>

      <div className="mt-4 text-sm leading-relaxed text-black/70">{body}</div>
    </div>
  );
}

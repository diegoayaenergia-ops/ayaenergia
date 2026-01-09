"use client";

import { REPORTS } from "../lib/reports";

type Props = {
  active: string;
  onSelect: (id: string) => void;
};

export default function Sidebar({ active, onSelect }: Props) {
  return (
    <aside className="w-20 h-full bg-slate-900 border-r border-white/10 flex flex-col items-center py-4 gap-3">
      <div className="text-xl mb-4">AYA</div>

      {REPORTS.map((r) => (
        <button
          key={r.id}
          onClick={() => onSelect(r.id)}
          title={r.title}
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg transition
            ${
              active === r.id
                ? "bg-cyan-500 text-black"
                : "bg-slate-800 hover:bg-slate-700"
            }
          `}
        >
          {r.icon}
        </button>
      ))}
    </aside>
  );
}

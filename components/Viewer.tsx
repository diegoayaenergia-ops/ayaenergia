"use client";

import { REPORTS } from "../lib/reports";

type Props = {
  active: string;
};

export default function Viewer({ active }: Props) {
  const report = REPORTS.find((r) => r.id === active);

  if (!report) return null;

  return (
    <div className="flex flex-col h-full w-full bg-black">

      {/* TOP BAR */}
      <div className="h-12 shrink-0 bg-slate-950 border-b border-white/10 flex items-center px-5 text-sm">
        {report.title}
      </div>

      {/* IFRAME */}
      <div className="flex-1 w-full bg-black">
        <iframe
          key={report.id}
          src={formatUrl(report.src)}
          className="w-full h-full border-none"
          allowFullScreen
        />
      </div>

    </div>
  );
}

function formatUrl(url: string) {
  if (!url) return url;
  const extra = "navContentPaneEnabled=false&filterPaneEnabled=false";
  return url.includes("?") ? `${url}&${extra}` : `${url}?${extra}`;
}

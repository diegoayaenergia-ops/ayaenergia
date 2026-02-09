"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";

type ReportItem = {
  id: string;
  title: string;
  src?: string;
  image?: string;
  icon?: LucideIcon;
};

function safeSrc(src?: string | null) {
  const s = (src ?? "").trim();
  return s.length ? s : null;
}

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

function formatUrl(url: string) {
  if (!url) return url;

  const params = [
    "navContentPaneEnabled=false",
    "filterPaneEnabled=false",
    "pageView=fitToWidth",
  ].join("&");

  return url.includes("?") ? `${url}&${params}` : `${url}?${params}`;
}

export default function ReportsPage({
  access,
  portfolioReports,
  internalReports,
}: {
  access: string[];
  portfolioReports: ReportItem[];
  internalReports: ReportItem[];
}) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string>("");

  const groups = useMemo(
    () => [
      { id: "portfolio", title: "Portfólio", items: portfolioReports },
      { id: "internos", title: "Internos", items: internalReports },
    ],
    [portfolioReports, internalReports]
  );

  const allAllowed = useMemo(() => {
    const allRaw = [...portfolioReports, ...internalReports];
    return allRaw.filter((r) => access.includes(r.id));
  }, [access, portfolioReports, internalReports]);

  useEffect(() => {
    if (!allAllowed.length) {
      setSelected("");
      return;
    }
    setSelected((prev) =>
      prev && allAllowed.some((r) => r.id === prev) ? prev : allAllowed[0].id
    );
  }, [allAllowed]);

  const filteredGroups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return groups
      .map((g) => ({
        ...g,
        items: g.items
          .filter((it) => access.includes(it.id))
          .filter((it) => it.title.toLowerCase().includes(needle)),
      }))
      .filter((g) => g.items.length > 0);
  }, [access, q, groups]);

  const selectedReport = useMemo(
    () => allAllowed.find((r) => r.id === selected) ?? null,
    [allAllowed, selected]
  );

  const selectedSrc = safeSrc(selectedReport?.src);

  const shell = "h-full w-full flex bg-[#f6f7f8] text-black";
  const card =
    "rounded-2xl border shadow-[0_18px_60px_-30px_rgba(0,0,0,0.45)] border-black/10 bg-white";
  const input =
    "w-full rounded-xl px-3 py-2 border outline-none transition bg-white text-black border-black/15 focus:ring-1 focus:ring-[#2E7B57]";
  const muted = "text-black/55";

  return (
    <div className={shell}>
      <aside className="w-[360px] border-r flex flex-col border-black/10 bg-white">
        <div className="p-4 border-b border-black/10">
          <div className="font-extrabold text-lg">Relatórios</div>
          <p className={cx("text-xs mt-1", muted)}>
            Escolha um relatório e visualize no painel.
          </p>

          <div className="mt-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className={input}
              placeholder="Buscar relatório…"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {filteredGroups.map((g) => (
            <div key={g.id}>
              <div className={cx("text-xs font-bold uppercase px-2 mb-2", muted)}>
                {g.title}
              </div>

              <div className="space-y-1">
                {g.items.map((r) => {
                  const active = r.id === selected;
                  const img = safeSrc(r.image);

                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelected(r.id)}
                      className={cx(
                        "w-full text-left px-3 py-2 rounded-xl border transition flex items-center gap-3",
                        active
                          ? "bg-black/[0.04] border-[#2E7B57]/30"
                          : "bg-white border-black/10 hover:bg-black/[0.03]"
                      )}
                    >
                      {img ? (
                        <Image src={img} alt="" width={20} height={20} />
                      ) : r.icon ? (
                        <r.icon size={18} className="text-black/70" />
                      ) : null}

                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">
                          {r.title}
                        </div>
                        <div className={cx("text-xs truncate", muted)}>
                          {active ? "Selecionado" : "Clique para abrir"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>

      <main className="flex-1 p-4">
        <div className={cx(card, "h-full overflow-hidden")}>
          {selectedSrc ? (
            <iframe
              key={selectedReport?.id ?? "none"}
              src={formatUrl(selectedSrc)}
              className="w-full h-full border-none"
              allowFullScreen
            />
          ) : (
            <div className="h-full flex items-center justify-center p-8">
              <div className="text-center">
                <div className="text-lg font-extrabold">
                  Nenhum relatório selecionado
                </div>
                <div className={cx("mt-2 text-sm", muted)}>
                  Selecione um item na lista à esquerda.
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

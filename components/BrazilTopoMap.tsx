"use client";

import { useEffect, useMemo, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";

type Props = {
  activeUFs: string[];
  topoUrl?: string;
  height?: number;
  showLabels?: boolean;
};

type GeoFeature = any;

export default function BrazilTopoMap({
  activeUFs,
  topoUrl = "/maps/br-estados.topo.json",
  height = 560,
  showLabels = true,
}: Props) {
  const [features, setFeatures] = useState<GeoFeature[]>([]);
  const [hover, setHover] = useState<{ uf: string; nome?: string } | null>(null);
  const [err, setErr] = useState<string>("");
  const [visibleUFs, setVisibleUFs] = useState<Set<string>>(new Set());

  // ✅ normaliza uma vez e cria "chave estável" (evita reiniciar animação por render)
  const activeList = useMemo(
    () => activeUFs.map((u) => u.trim().toUpperCase()).filter(Boolean),
    [activeUFs]
  );
  const activeKey = useMemo(() => activeList.join("|"), [activeList]);

  const activeSet = useMemo(() => new Set(activeList), [activeList]);

  // ===== Carrega topojson =====
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setErr("");
      try {
        const res = await fetch(topoUrl, { cache: "force-cache" });
        const text = await res.text();

        if (!res.ok) throw new Error(`HTTP ${res.status} ao carregar ${topoUrl}`);
        if (!text.trim()) throw new Error(`Arquivo vazio em ${topoUrl}`);

        const topo = JSON.parse(text);

        // ⚠️ no seu arquivo: objects.estados
        const geo = feature(topo as any, (topo as any).objects.estados) as any;

        if (!cancelled) setFeatures(geo.features || []);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Erro ao carregar o mapa");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [topoUrl]);

  // ===== Animação: estados aparecem 1 por 1 (estável) =====
  useEffect(() => {
    // reset
    setVisibleUFs(new Set());

    let cancelled = false;
    const timers: number[] = [];

    activeList.forEach((uf, idx) => {
      const t = window.setTimeout(() => {
        if (cancelled) return;
        setVisibleUFs((prev) => {
          const next = new Set(prev);
          next.add(uf);
          return next;
        });
      }, 400 * idx);
      timers.push(t);
    });

    return () => {
      cancelled = true;
      timers.forEach((t) => clearTimeout(t));
    };
  }, [activeKey]); // ✅ chave estável

  const width = 1200;

  const projection = useMemo(() => {
    const p = geoMercator();
    if (features.length) {
      p.fitSize([width, height], { type: "FeatureCollection", features } as any);
    }
    return p;
  }, [features, height]);

  const pathGen = useMemo(() => geoPath(projection as any), [projection]);

  if (err) {
    return <div className="w-full p-4 text-red-400 text-sm">{err}</div>;
  }

  return (
    <div className="w-full h-full">
      <div className="w-full h-full p-3 overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          {/* ESTADOS */}
          <g>
            {features.map((f: any) => {
              const uf = String(f.id || "").toUpperCase();
              const nome = f?.properties?.nome as string | undefined;

              const isActive = activeSet.has(uf);
              const isVisible = visibleUFs.has(uf);
              const isHover = hover?.uf === uf;

              // ✅ cores:
              // - inativo: escuro
              // - ativo (ainda não "acendeu"): verde fraco (não some)
              // - ativo visível: verde forte
              const fill = isActive
                ? isVisible
                  ? "#256947"
                  : "rgba(0, 0, 0, 0.45)"
                : "rgba(0, 0, 0, 0.45)";

              const opacity = isActive ? (isVisible ? 1 : 0.9) : 0.85;

              return (
                <path
                  key={uf}
                  d={pathGen(f) || ""}
                  onMouseEnter={() => setHover({ uf, nome })}
                  onMouseLeave={() => setHover(null)}
                  style={{
                    fill,
                    opacity,
                    stroke: isHover ? "rgba(255,255,255,0.60)" : "rgba(255,255,255,0.22)",
                    strokeWidth: isHover ? 1.4 : 1,
                    cursor: "pointer",
                    transition: "fill 320ms ease, opacity 320ms ease, transform 320ms ease, stroke 200ms ease",
                    transform: isActive && isVisible ? "scale(1)" : "scale(0.997)",
                    transformOrigin: "center",
                  }}
                />
              );
            })}
          </g>

          {/* SIGLAS: só nos estados selecionados e só quando "acender" */}
          {showLabels && (
            <g pointerEvents="none">
              {features.map((f: any) => {
                const uf = String(f.id || "").toUpperCase();
                const isActive = activeSet.has(uf);
                const isVisible = visibleUFs.has(uf);

                if (!isActive || !isVisible) return null;

                const [cx, cy] = pathGen.centroid(f) as [number, number];
                if (!Number.isFinite(cx) || !Number.isFinite(cy)) return null;

                return (
                  <text
                    key={`label-${uf}`}
                    x={cx}
                    y={cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      fill: "rgba(255,255,255,0.92)",
                      paintOrder: "stroke",
                      stroke: "rgba(0,0,0,0.55)",
                      strokeWidth: 3,
                      opacity: 1,
                      transition: "opacity 250ms ease",
                    }}
                  >
                    {uf}
                  </text>
                );
              })}
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}

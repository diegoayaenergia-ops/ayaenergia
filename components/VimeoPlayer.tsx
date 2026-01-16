"use client";

import { useEffect, useRef } from "react";
import Player from "@vimeo/player";

type Props = {
  videoId: string | number;
  onEnded?: () => void;
  onReady?: () => void;
  onError?: (msg: string) => void;
};

export default function VimeoPlayer({ videoId, onEnded, onReady, onError }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<Player | null>(null);
  const aliveRef = useRef(false);

  useEffect(() => {
    aliveRef.current = true;

    if (!containerRef.current) return;

    // ✅ mata player anterior (se existir)
    const prev = playerRef.current;
    if (prev) {
      try {
        prev.unload().catch(() => {});
        prev.destroy().catch(() => {});
      } catch {}
      playerRef.current = null;
    }

    // ✅ cria player novo
    const player = new Player(containerRef.current, {
      id: Number(videoId),
      autoplay: true,
      autopause: true,
      responsive: true,
      title: false,
      byline: false,
      portrait: false,
    });

    playerRef.current = player;

    const safe = (fn?: () => void) => {
      if (!aliveRef.current) return;
      fn?.();
    };

    const handleEnded = () => safe(onEnded);

    player.on("ended", handleEnded);

    player.on("error", (e: any) => {
      if (!aliveRef.current) return;
      onError?.(e?.message || "Erro no player");
    });

    // ✅ NUNCA chame getVideoId aqui
    player
      .ready()
      .then(() => safe(onReady))
      .catch((e) => {
        if (!aliveRef.current) return;
        onError?.(e?.message || "Falha ao inicializar player");
      });

    return () => {
      aliveRef.current = false;

      // ✅ remove listeners + destroy sem estourar
      try {
        player.off("ended", handleEnded);
      } catch {}

      try {
        player.unload().catch(() => {});
        player.destroy().catch(() => {});
      } catch {}

      if (playerRef.current === player) playerRef.current = null;
    };
  }, [videoId, onEnded, onReady, onError]);

  return <div ref={containerRef} className="w-full h-full" />;
}

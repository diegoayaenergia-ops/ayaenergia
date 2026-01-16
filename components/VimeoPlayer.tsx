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
  const playerRef = useRef<any>(null);

  // trava para não disparar duas vezes
  const endedOnceRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;

    let alive = true; // ✅ impede callbacks após destroy/unmount
    endedOnceRef.current = false;

    // destrói anterior
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch {}
      playerRef.current = null;
    }

    const player = new Player(containerRef.current, {
      id: Number(videoId),
      autoplay: true,
      autopause: false,
    });

    playerRef.current = player;

    const finish = () => {
      if (!alive) return;
      if (endedOnceRef.current) return;
      endedOnceRef.current = true;
      onEnded?.();
    };

    const onTimeUpdate = (data: any) => {
      if (!alive) return;
      if (!data?.duration) return;

      if (data.seconds >= data.duration - 0.5) {
        finish();
      }
    };

    const onLoaded = () => {
      if (!alive) return;
      onReady?.();
    };

    const onErr = (e: any) => {
      if (!alive) return;
      onError?.(e?.message || "Erro no player Vimeo");
    };

    // listeners
    player.on("loaded", onLoaded);
    player.on("ended", finish);
    player.on("timeupdate", onTimeUpdate);
    player.on("error", onErr);

    // força iframe 100% (sem chamar métodos que podem falhar em versões antigas)
    player
      .ready()
      .then(() => {
        if (!alive) return;
        const iframe = containerRef.current?.querySelector("iframe");
        if (iframe) {
          const el = iframe as HTMLIFrameElement;
          el.style.position = "absolute";
          el.style.inset = "0";
          el.style.width = "100%";
          el.style.height = "100%";
        }
      })
      .catch(() => {
        // se já tiver sido destruído, ignore
      });

    return () => {
      alive = false;
      try {
        player.off("loaded", onLoaded);
        player.off("ended", finish);
        player.off("timeupdate", onTimeUpdate);
        player.off("error", onErr);
        player.destroy();
      } catch {}
    };
  }, [videoId, onEnded, onReady, onError]);

  return <div ref={containerRef} className="relative w-full h-full" />;
}

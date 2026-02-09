"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import VimeoPlayer from "@/components/VimeoPlayer";

type CourseItem = {
  id: string;
  title: string;
  description?: string;
  vimeoId?: string;
  formUrl?: string;
};

const cx = (...p: Array<string | false | null | undefined>) => p.filter(Boolean).join(" ");

function normalizeStringArray(raw: any): string[] {
  if (Array.isArray(raw)) return raw.filter((x) => typeof x === "string");
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === "string");
    } catch {}
  }
  return [];
}

function getCourseIndexFromStats(courses: CourseItem[], stats: string[]) {
  const index = courses.findIndex((course) => !stats.includes(course.id));
  return index === -1 ? courses.length - 1 : index;
}

export function CoursesPage({
  user,
  courses,
  stats,
  setStats,
}: {
  user: any;
  courses: CourseItem[];
  stats: string[];
  setStats: (v: string[]) => void;
}) {
  const [currentCourse, setCurrentCourse] = useState(0);

  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState("");

  const completingRef = useRef<string | null>(null);

  // ao entrar, posiciona na primeira não concluída
  useEffect(() => {
    const idx = getCourseIndexFromStats(courses, stats);
    setCurrentCourse(idx >= 0 ? idx : 0);
  }, [courses, stats]);

  // track loading por troca de aula
  useEffect(() => {
    setVideoLoading(true);
    setVideoError("");
  }, [currentCourse]);

  const progressPercent =
    courses.length > 0 ? Math.round((stats.length / courses.length) * 100) : 0;

  const isWatched = (id: string) => stats.includes(id);

  const canAccess = (index: number) => {
    if (index === 0) return true;

    const course = courses[index];
    const prev = courses[index - 1];

    if (course?.id && stats.includes(course.id)) return true;
    if (!course?.vimeoId) return true;
    return !!prev?.id && stats.includes(prev.id);
  };

  const completeCourse = async (courseId: string) => {
    if (!courseId) return;
    if (!user?.login) return;
    if (stats.includes(courseId)) return;
    if (completingRef.current) return;

    completingRef.current = courseId;

    try {
      const res = await fetch("/api/user/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: user.login, courseId }),
      });

      if (!res.ok) return;

      const data = await res.json();
      const fixed = normalizeStringArray(data.stats);

      setStats(fixed);

      const updatedUser = { ...user, stats: fixed };
      localStorage.setItem("bi_user", JSON.stringify(updatedUser));
    } finally {
      completingRef.current = null;
    }
  };

  return (
    <div className="absolute inset-0 flex bg-[#f6f7f8]">
      {/* SIDEBAR */}
      <aside className="w-[360px] border-r flex flex-col bg-white border-black/10">
        <div className="p-4 border-b border-black/10">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base text-black">Conteúdo</h3>
            <span className="text-xs text-black/50">
              {stats.length}/{courses.length}
            </span>
          </div>

          <div className="mt-3">
            <div className="w-full h-2 rounded-full overflow-hidden bg-black/10">
              <div className="h-full bg-[#5CAE70] transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
            <span className="text-xs mt-1 block text-black/50">{progressPercent}% concluído</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {courses.map((course, index) => {
            const watched = isWatched(course.id);
            const activeItem = index === currentCourse;
            const locked = !canAccess(index);

            return (
              <div
                key={course.id}
                className={cx(
                  "group rounded-xl transition",
                  activeItem ? "bg-black/[0.03] ring-1 ring-[#5CAE70]/25" : "hover:bg-black/[0.04]",
                  locked && "opacity-45"
                )}
              >
                <div className="flex items-center gap-3 px-3 py-3">
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => {
                      if (!canAccess(index)) return;
                      setCurrentCourse(index);
                    }}
                    className="flex-1 min-w-0 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate text-black">{course.title}</p>

                      {watched && (
                        <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-[#5CAE70]/20 text-[#2a6a3a] border border-[#5CAE70]/20">
                          Concluída
                        </span>
                      )}

                      {!course.vimeoId && (
                        <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full border bg-black/[0.03] text-black/55 border-black/10">
                          Em breve
                        </span>
                      )}

                      {locked && (
                        <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full border bg-black/[0.03] text-black/45 border-black/10">
                          Bloqueada
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex items-center gap-2 text-xs text-black/55">
                      <span>Aula {index + 1}</span>
                      <span className="w-1 h-1 rounded-full bg-black/25" />
                      <span>{course.description || "Conteúdo do módulo"}</span>
                    </div>
                  </button>

                  {course.vimeoId && (
                    <button
                      type="button"
                      onClick={() => {
                        if (locked) return;
                        if (watched) return;
                        completeCourse(course.id);
                      }}
                      disabled={locked || watched || completingRef.current === course.id}
                      className={cx(
                        "shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition border",
                        watched
                          ? "bg-black/[0.03] text-black/40 border-black/10 cursor-not-allowed"
                          : locked
                            ? "bg-black/[0.03] text-black/30 border-black/10 cursor-not-allowed"
                            : "bg-[#5CAE70] text-black border-[#5CAE70]/30 hover:brightness-110 active:scale-[0.98]"
                      )}
                      title={watched ? "Já concluída" : "Marcar como concluída"}
                    >
                      {watched ? "✓" : completingRef.current === course.id ? "..." : "Concluir"}
                    </button>
                  )}
                </div>

                {course.formUrl && (
                  <div className="px-3 pb-3">
                    <a
                      href={course.formUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cx(
                        "inline-flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2 transition border",
                        watched
                          ? "bg-black/[0.03] text-black border-black/10 hover:bg-black/[0.06]"
                          : "bg-black/0 text-black/30 border-black/10 cursor-not-allowed pointer-events-none"
                      )}
                    >
                      📄 Avaliação da Aula
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t border-black/10">
          <button
            onClick={async () => {
              const ok = window.confirm("Tem certeza que deseja recomeçar o curso? Isso vai remover seu progresso.");
              if (!ok) return;

              try {
                const res = await fetch("/api/user/reset-stats", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ login: user.login }),
                });

                if (!res.ok) return;

                setStats([]);
                const updatedUser = { ...user, stats: [] };
                localStorage.setItem("bi_user", JSON.stringify(updatedUser));
                setCurrentCourse(0);
              } catch {}
            }}
            className="w-full px-4 py-2 rounded-lg text-sm font-semibold border transition border-black/15 text-black/70 hover:bg-black/[0.04]"
            title="Zerar progresso do curso"
          >
            Recomeçar
          </button>
        </div>
      </aside>

      {/* PLAYER */}
      <main className="flex-1 bg-[#f6f7f8]">
        <div className="h-full flex flex-col">
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-[1200px]">
              <div className="rounded-2xl border overflow-hidden shadow-[0_18px_60px_-30px_rgba(0,0,0,0.7)] border-black/10 bg-white">
                <div className="relative w-full aspect-video bg-black">
                  {courses[currentCourse]?.vimeoId ? (
                    <div className="absolute inset-0">
                      <VimeoPlayer
                        key={courses[currentCourse].vimeoId}
                        videoId={courses[currentCourse].vimeoId!}
                        onReady={() => {
                          setVideoLoading(false);
                          setVideoError("");
                        }}
                        onError={(msg) => {
                          setVideoLoading(false);
                          setVideoError(msg);
                        }}
                      />
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 bg-black/[0.04]">
                      <p className="font-semibold text-lg text-black">Conteúdo em preparação</p>
                      <p className="text-sm mt-2 max-w-md text-black/60">
                        Esta aula ainda não possui vídeo disponível. Em breve o conteúdo será liberado.
                      </p>
                    </div>
                  )}

                  {videoLoading && courses[currentCourse]?.vimeoId && !videoError && (
                    <div className="absolute inset-0 grid place-items-center bg-black/60">
                      <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                    </div>
                  )}

                  {videoError && !videoLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6">
                      <div className="max-w-md text-center">
                        <p className="text-white font-semibold">Erro no player</p>
                        <p className="text-white/70 text-sm mt-2">{videoError}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-5 py-4 border-t bg-white border-black/10">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-black/50">
                        Aula {currentCourse + 1} de {courses.length}
                      </p>
                      <p className="font-semibold truncate text-black">
                        {courses[currentCourse]?.title}
                      </p>
                    </div>

                    {courses[currentCourse]?.vimeoId && (
                      <button
                        onClick={() => completeCourse(courses[currentCourse].id)}
                        disabled={isWatched(courses[currentCourse].id)}
                        className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#5CAE70] text-black disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition"
                      >
                        {isWatched(courses[currentCourse].id) ? "Concluída ✓" : "Marcar como concluída"}
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

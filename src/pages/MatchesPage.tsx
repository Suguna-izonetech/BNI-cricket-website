import { useMemo, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { loadMatchScheduleSnapshot } from "@/lib/matchScheduleStorage";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TEAM_LABELS = Array.from({ length: 20 }, (_, index) =>
  String.fromCharCode(65 + index)
);

const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTH_NAMES = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

const MatchesSection = () => {
  const navigate = useNavigate();

  const snapshot = loadMatchScheduleSnapshot();
  const matches = snapshot?.schedulePlan ?? [];
  const revealedCount = snapshot?.revealedCount ?? 0;

  const [visibleCount, setVisibleCount] = useState(0);

  // ✅ BACK BUTTON SCROLL CONTROL
  const [showBack, setShowBack] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      if (window.scrollY > lastScrollY) {
        setShowBack(false); // ↓ hide
      } else {
        setShowBack(true); // ↑ show
      }
      lastScrollY = window.scrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 🔥 STAGGER LOGIC
  useEffect(() => {
    if (!matches.length) return;

    setVisibleCount(0);

    const interval = setInterval(() => {
      setVisibleCount((prev) => {
        if (prev >= matches.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [matches.length]);

  const teamNameForSlot = useMemo(
    () => (slotIndex: number) =>
      snapshot?.slotToTeamName?.[slotIndex] ??
      `Team ${TEAM_LABELS[slotIndex]}`,
    [snapshot?.slotToTeamName]
  );

  const matchMeta = useMemo(
    () => (matchIndex: number) => {
      const d = new Date(2026, 2, 28);
      d.setDate(d.getDate() + matchIndex);
      const date = `${MONTH_NAMES[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}`;
      const day = DAY_NAMES[d.getDay()];
      const time = matchIndex % 2 === 0 ? "3:30 PM" : "7:30 PM";
      return { date, day, time };
    },
    []
  );

  return (
    <section id="matches" className="bg-ipl-surface px-3 pt-4 pb-4 min-h-screen">
      
      <div className="container mx-auto flex h-[calc(100vh-2rem)] flex-col [perspective:1000px]">

        {/* ✅ BACK BUTTON (FINAL FIXED) */}
        <button
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate("/");
            }
          }}
          className={`fixed left-4 top-3 z-[999] pointer-events-auto
          rounded-full border border-primary/40 
          backdrop-blur-md
          bg-[radial-gradient(circle_at_30%_30%,rgba(var(--background-rgb),0.95),rgba(var(--primary-rgb),0.6))] 
          p-1.5 shadow-[0_0_12px_rgba(var(--primary-rgb),0.35)] 
          transition-all duration-300 hover:scale-105
          ${
            showBack
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-10 pointer-events-none"
          }`}
        >
          <ArrowLeft className="text-primary w-4 h-4" />
        </button>

        <h2 className="mb-3 text-center font-heading text-2xl font-bold uppercase text-foreground md:text-3xl">
          Matches
        </h2>

        {matches.length === 0 ? (
          <div className="gold-panel flex flex-1 items-center justify-center rounded-xl border border-border bg-card p-6 text-center text-muted-foreground">
            No reveal schedule yet.
          </div>
        ) : (
          <div className="grid flex-1 auto-rows-fr grid-flow-col grid-rows-5 gap-2">
            {matches.map((match, index) => {
              const isRevealed = index < revealedCount;
              const isVisible = index < visibleCount;

              const meta = matchMeta(index);
              const team1 = teamNameForSlot(match.team1);
              const team2 = teamNameForSlot(match.team2);

              if (!isVisible) {
                return (
                  <div
                    key={match.slot}
                    className="rounded-lg border border-primary/20 bg-card p-2 opacity-0"
                  />
                );
              }

              return (
                <div
                  key={match.slot}
                  className={cn(
                    "group flex min-h-0 flex-col justify-between rounded-lg border border-primary/55 bg-card p-2",
                    "transition-all duration-500",
                    "shadow-[0_0_0_1px_rgba(var(--primary-rgb),0.2),0_8px_18px_rgba(var(--dark-surface-rgb),0.14)]",
                    "hover:shadow-[0_0_0_1px_rgba(var(--primary-rgb),0.4),0_12px_25px_rgba(var(--dark-surface-rgb),0.25)]",
                    "animate-[cardAttach_.7s_cubic-bezier(0.22,1,0.36,1)_forwards]",
                    "[transform-style:preserve-3d]",
                    !isRevealed && "opacity-75 saturate-75"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-block rounded-sm border border-primary/50 bg-[linear-gradient(135deg,rgba(var(--background-rgb),0.98),rgba(var(--primary-light-rgb),0.88))] px-2 py-0.5 font-heading text-[10px] font-bold uppercase text-primary">
                      Match {index + 1}
                    </span>
                    <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                      {meta.time}
                    </span>
                  </div>

                  <div className="relative my-2 flex items-center justify-center gap-2">
                    <p className="max-w-[44%] truncate font-premium text-[16px] font-semibold uppercase text-foreground">
                      {team1}
                    </p>

                    <p className="font-premium text-[18px] font-bold text-[#C79A6C]">
                      VS
                    </p>

                    <p className="max-w-[44%] truncate font-premium text-[16px] font-semibold uppercase text-foreground">
                      {team2}
                    </p>
                  </div>

                  <div className="flex items-center justify-between rounded-md border border-primary/45 bg-[linear-gradient(90deg,rgba(var(--background-rgb),0.96),rgba(var(--primary-light-rgb),0.82))] px-2 py-1">
                    <p className="text-[10px] font-semibold uppercase text-foreground">{meta.date}</p>
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">{meta.day}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default MatchesSection;
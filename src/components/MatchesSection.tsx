import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { loadMatchScheduleSnapshot } from "@/lib/matchScheduleStorage";

const TEAM_LABELS = Array.from({ length: 20 }, (_, index) =>
  String.fromCharCode(65 + index)
);
const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTH_NAMES = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

const MatchesSection = () => {
  const snapshot = loadMatchScheduleSnapshot();

  const matches = snapshot?.schedulePlan ?? [];
  const revealedCount = snapshot?.revealedCount ?? 0;

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
      <div className="container mx-auto flex h-[calc(100vh-2rem)] flex-col">
        <h2 className="mb-3 text-center font-heading text-2xl font-bold uppercase text-foreground md:text-3xl">
          Matches
        </h2>

        {matches.length === 0 ? (
          <div className="gold-panel flex flex-1 items-center justify-center rounded-xl border border-border bg-card p-6 text-center text-muted-foreground">
            No reveal schedule yet.
          </div>
        ) : (
          <div className="grid flex-1 auto-rows-fr grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {matches.map((match, index) => {
              const isRevealed = index < revealedCount;
              const meta = matchMeta(index);
              const team1 = teamNameForSlot(match.team1);
              const team2 = teamNameForSlot(match.team2);

              return (
                <div
                  key={match.slot}
                  className={cn(
                    "group flex min-h-0 flex-col justify-between rounded-lg border border-primary/55 bg-card p-2 transition-all duration-300 shadow-[0_0_0_1px_rgba(var(--primary-rgb),0.2),0_8px_18px_rgba(var(--dark-surface-rgb),0.14)] hover:shadow-[0_0_0_1px_rgba(var(--primary-rgb),0.4),0_12px_25px_rgba(var(--dark-surface-rgb),0.25)]",
                    !isRevealed && "opacity-75 saturate-75"
                  )}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-block rounded-sm border border-primary/50 bg-[linear-gradient(135deg,rgba(var(--background-rgb),0.98),rgba(var(--primary-light-rgb),0.88))] px-2 py-0.5 font-heading text-[10px] font-bold uppercase tracking-[0.08em] text-primary">
                      Match {index + 1}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                      {meta.time}
                    </span>
                  </div>

                  {/* 🔥 VS SECTION (UPDATED) */}
                  <div className="relative my-2 flex items-center justify-center gap-2 overflow-hidden">

                    {/* Left Team */}
                    <p className="max-w-[44%] truncate font-premium text-[16px] font-semibold uppercase tracking-[0.035em] text-foreground transform -translate-x-5 opacity-0 animate-[slideLeft_.4s_ease_forwards] group-hover:scale-105">
                      {team1}
                    </p>

                    {/* VS with Glow */}
                    <p className="relative font-premium text-[18px] font-bold italic text-[#C79A6C] 
                      animate-[vsPop_.5s_ease_forwards,glow_1.5s_infinite]
                      drop-shadow-[0_0_6px_rgba(199,154,108,0.6)]
                      group-hover:scale-110">
                      VS
                    </p>

                    {/* Right Team */}
                    <p className="max-w-[44%] truncate font-premium text-[16px] font-semibold uppercase tracking-[0.035em] text-foreground transform translate-x-5 opacity-0 animate-[slideRight_.4s_ease_forwards] group-hover:scale-105">
                      {team2}
                    </p>

                    {/* Glow line */}
                    <div className="absolute w-10 h-[2px] bg-gradient-to-r from-transparent via-[#C79A6C] to-transparent opacity-70 animate-pulse" />
                  </div>

                  {/* Footer */}
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

      {/* 🔥 ANIMATIONS */}
      <style>
        {`
        @keyframes slideLeft {
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideRight {
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes vsPop {
          0% { opacity: 0; transform: scale(0.5); }
          60% { transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes glow {
          0%,100% { text-shadow: 0 0 5px rgba(199,154,108,0.4); }
          50% { text-shadow: 0 0 15px rgba(199,154,108,0.9); }
        }
        `}
      </style>
    </section>
  );
};

export default MatchesSection;
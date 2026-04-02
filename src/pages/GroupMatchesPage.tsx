import { useMemo, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { loadMatchScheduleSnapshot } from "@/lib/matchScheduleStorage";

const TEAM_LABELS = Array.from({ length: 20 }, (_, i) =>
  String.fromCharCode(65 + i)
);

const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTH_NAMES = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN"];

const generateMatches = (teams: string[]) => {
  const matches: { team1: string; team2: string }[] = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matches.push({ team1: teams[i], team2: teams[j] });
    }
  }
  return matches;
};

const GroupMatchesPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const snapshot = loadMatchScheduleSnapshot();
  const slotToTeamName = snapshot?.slotToTeamName ?? [];

  const groupId = Number(id);
  const safeGroupId =
    isNaN(groupId) || groupId < 1 || groupId > 5 ? 1 : groupId;

  const start = (safeGroupId - 1) * 4;

  const teams = Array.from({ length: 4 }, (_, i) => {
    const slot = start + i;
    return slotToTeamName[slot] ?? `Team ${TEAM_LABELS[slot]}`;
  });

  const matches = generateMatches(teams);

  const matchMeta = useMemo(
    () => (index: number) => {
      const d = new Date(2026, 2, 28);
      d.setDate(d.getDate() + index);
      return {
        date: `${MONTH_NAMES[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}`,
        day: DAY_NAMES[d.getDay()],
        time: index % 2 === 0 ? "3:30 PM" : "7:30 PM",
      };
    },
    []
  );

  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    setVisibleCount(0);
    const interval = setInterval(() => {
      setVisibleCount((prev) => {
        if (prev >= matches.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 180);
    return () => clearInterval(interval);
  }, [matches.length]);

  return (
    <section className="relative min-h-screen flex flex-col px-3 pt-6 pb-6 bg-ipl-surface overflow-hidden">

      {/* 🔥 BACKGROUND GLOW */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--primary-light-rgb),0.15),transparent_70%)] pointer-events-none" />

      {/* BACK */}
      <button
        onClick={() => navigate(-1)}
        className="fixed left-4 top-4 z-50 rounded-full border border-primary/40 
        bg-[radial-gradient(circle_at_30%_30%,rgba(var(--background-rgb),0.95),rgba(var(--primary-rgb),0.6))] 
        p-2 shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)] transition hover:scale-110"
      >
        <ArrowLeft className="text-primary" />
      </button>

      {/* TITLE */}
      <h2 className="mb-10 text-center font-heading text-3xl font-bold uppercase text-foreground tracking-wide">
        Group {safeGroupId} Matches
      </h2>

      {/* GRID */}
      <div className="flex-1 flex items-center">
        <div className="w-full grid grid-cols-1 gap-6 sm:grid-cols-2 [perspective:1200px]">

          {matches.map((match, index) => {
            if (index >= visibleCount) return null;
            const meta = matchMeta(index);

            return (
              <div
                key={index}
                className={cn(
                  "group relative flex flex-col justify-between rounded-xl border border-primary/50 p-4",
                  "bg-[linear-gradient(135deg,rgba(var(--background-rgb),0.95),rgba(var(--primary-light-rgb),0.35))]",
                  "shadow-[0_8px_25px_rgba(0,0,0,0.2)]",
                  "transition duration-500 hover:scale-[1.02] hover:-translate-y-1",
                  "hover:shadow-[0_12px_35px_rgba(var(--primary-rgb),0.35)]",
                  "animate-[cardAttach_.9s_cubic-bezier(0.22,1,0.36,1)]"
                )}
              >

                {/* HEADER */}
                <div className="flex justify-between items-center">
                  <span className="px-2 py-1 text-[10px] font-bold rounded-full 
                  bg-[linear-gradient(135deg,#fff,#d4af37)] text-black shadow">
                    Match {index + 1}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {meta.time}
                  </span>
                </div>

                {/* VS */}
                <div className="relative my-4 flex justify-center items-center gap-3">

                  <p className="text-[16px] font-semibold uppercase 
                  transform -translate-x-6 opacity-0 
                  animate-[slideLeft_.4s_ease_forwards]">
                    {match.team1}
                  </p>

                  <p className="relative text-[#C79A6C] font-bold text-[20px]
                  animate-[vsPop_.5s,glow_1.5s_infinite]">
                    VS
                  </p>

                  <p className="text-[16px] font-semibold uppercase 
                  transform translate-x-6 opacity-0 
                  animate-[slideRight_.4s_ease_forwards]">
                    {match.team2}
                  </p>

                  {/* glow line */}
                  <div className="absolute w-14 h-[2px] bg-gradient-to-r from-transparent via-[#C79A6C] to-transparent animate-pulse" />
                </div>

                {/* DATE BAR */}
                <div className="relative overflow-hidden flex justify-between items-center rounded-md border border-primary/40 px-3 py-1 text-[10px]
                bg-[linear-gradient(90deg,rgba(var(--background-rgb),0.9),rgba(var(--primary-light-rgb),0.8))]">

                  <span className="font-semibold">{meta.date}</span>
                  <span className="text-muted-foreground">{meta.day}</span>

                  {/* shimmer */}
                  <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.4),transparent)] animate-[shimmer_2.5s_infinite]" />
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* ANIMATIONS */}
      <style>
        {`
        @keyframes slideLeft { to { opacity:1; transform:translateX(0);} }
        @keyframes slideRight { to { opacity:1; transform:translateX(0);} }

        @keyframes vsPop {
          0% { opacity:0; transform:scale(.5);}
          60% { transform:scale(1.2);}
          100% { opacity:1; transform:scale(1);}
        }

        @keyframes glow {
          0%,100% { text-shadow:0 0 6px rgba(199,154,108,0.4);}
          50% { text-shadow:0 0 18px rgba(199,154,108,0.9);}
        }

        @keyframes shimmer {
          0% { transform:translateX(-100%);}
          100% { transform:translateX(100%);}
        }

        @keyframes cardAttach {
          0% { opacity:0; transform:translateZ(200px) scale(1.2);}
          100% { opacity:1; transform:translateZ(0) scale(1);}
        }
        `}
      </style>
    </section>
  );
};

export default GroupMatchesPage;
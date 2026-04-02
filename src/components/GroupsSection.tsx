import { loadMatchScheduleSnapshot } from "@/lib/matchScheduleStorage";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

const TEAM_LABELS = Array.from({ length: 20 }, (_, index) =>
  String.fromCharCode(65 + index)
);

const GroupsSection = () => {
  const navigate = useNavigate();
  const snapshot = loadMatchScheduleSnapshot();
  const slotToTeamName = snapshot?.slotToTeamName ?? [];

  // ✅ scroll state
  const [showBack, setShowBack] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      if (window.scrollY > lastScrollY) {
        setShowBack(false); // scroll down → hide
      } else {
        setShowBack(true); // scroll up → show
      }
      lastScrollY = window.scrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const groups = Array.from({ length: 5 }, (_, groupIndex) => {
    const start = groupIndex * 4;
    const teams = Array.from({ length: 4 }, (_, offset) => {
      const slotIndex = start + offset;
      return slotToTeamName[slotIndex] ?? `Team ${TEAM_LABELS[slotIndex]}`;
    });
    return {
      title: `Group ${groupIndex + 1}`,
      teams,
    };
  });

  return (
    <section id="groups" className="min-h-[calc(100vh-4rem)] px-4 pt-6 pb-6">
      <div className="container mx-auto flex min-h-[calc(100vh-6rem)] flex-col">

        {/* BACK BUTTON */}
        <button
          onClick={() => navigate(-1)}
          className={`fixed left-6 top-20 z-50 
          rounded-full border border-primary/40 
          backdrop-blur-md
          bg-[radial-gradient(circle_at_30%_30%,rgba(var(--background-rgb),0.95),rgba(var(--primary-rgb),0.6))] 
          p-2 shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)] 
          transition-all duration-300 hover:scale-110
          ${
            showBack
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-10 pointer-events-none"
          }`}
        >
          <ArrowLeft className="text-primary w-5 h-5" />
        </button>

        {/* TITLE */}
        <div className="text-center">
          <h2 className="font-heading text-3xl font-bold uppercase text-foreground md:text-4xl">
            Groups
          </h2>
        </div>

        {/* GROUP GRID */}
        <div className="mt-6 grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {groups.map((group, index) => (
            <article
              key={group.title}
              onClick={() => navigate(`/group/${index + 1}`)}
              className="cursor-pointer gold-panel flex min-h-[340px] flex-col rounded-2xl border-primary/35 
              bg-[linear-gradient(160deg,var(--surface-dim)_0%,var(--primary-light)_52%,var(--primary)_100%)] 
              p-5 shadow-[0_14px_30px_rgba(var(--dark-surface-rgb),0.28)] 
              ring-1 ring-primary/28 transition hover:scale-105"
            >
              <h3 className="mb-4 text-center font-heading text-xl font-bold uppercase tracking-[0.08em] text-foreground">
                {group.title}
              </h3>

              <div className="flex flex-1 flex-col justify-between gap-3">
                {group.teams.map((team) => (
                  <p
                    key={`${group.title}-${team}`}
                    className="rounded-md border border-primary/25 
                    bg-[linear-gradient(120deg,rgba(var(--surface-dim-rgb),0.96)_0%,rgba(var(--primary-light-rgb),0.5)_50%,rgba(var(--primary-rgb),0.32)_100%)] 
                    px-3 py-3 text-center font-heading text-base font-semibold uppercase tracking-[0.04em] text-foreground"
                  >
                    {team}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>

        {/* NEXT BUTTON */}
       

      </div>
    </section>
  );
};

export default GroupsSection;
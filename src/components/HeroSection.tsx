import heroBg from "@/assets/BNI bg3.jpg.jpeg";
import { CalendarDays, Tv } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section
      className="relative mt-16 flex min-h-[90vh] items-center justify-center overflow-hidden bg-no-repeat bg-[46%_-300px] bg-[length:103%_auto] md:bg-[45%_-360px] md:bg-[length:102%_auto] lg:bg-[44%_-420px] lg:bg-[length:101%_auto]"
      style={{ backgroundImage: `url(${heroBg})` }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(var(--surface-dim-rgb),0.42)_0%,rgba(var(--surface-dim-rgb),0.24)_48%,rgba(var(--dark-surface-rgb),0.08)_100%)]" />

      <div className="relative z-10 flex min-h-[90vh] w-full items-end justify-center px-4 pb-10 text-center md:pb-14">
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row animate-fade-up" style={{ animationDelay: "300ms" }}>
          <button
            onClick={() => navigate("/live-scores")}
            className="gold-button animate-float-gentle flex items-center gap-2 rounded-lg px-8 py-3 font-heading text-lg"
          >
            <Tv className="h-5 w-5" /> Live Scores
          </button>
          <button
            onClick={() => navigate("/matches")}
            className="gold-outline-button flex items-center gap-2 rounded-lg border-2 px-8 py-3 font-heading text-lg"
          >
            <CalendarDays className="h-5 w-5" /> Schedule
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;


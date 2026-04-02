import { useState } from "react";
import { TEAM_SQUADS } from "@/data/teamSquads";
import { TEAM_LOGOS } from "@/lib/logos";

type StandingRow = {
  pos: number;
  team: string;
  short: string;
  p: number;
  w: number;
  l: number;
  nrr: string;
  pts: number;
};

const standings: StandingRow[] = TEAM_SQUADS.map((team, index) => ({
  pos: index + 1,
  team: team.name,
  short: team.short,
  p: 0,
  w: 0,
  l: 0,
  nrr: "0.000",
  pts: 0,
}));

const initialsFromName = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

const TeamLogoAvatar = ({ teamCode, teamName }: { teamCode: string; teamName: string }) => {
  const [logoError, setLogoError] = useState(false);
  const logoSrc = TEAM_LOGOS[teamCode];

  if (!logoSrc || logoError) {
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-full border border-primary/45 bg-primary/10 font-heading text-[10px] font-bold text-foreground">
        {initialsFromName(teamName)}
      </div>
    );
  }

  return (
    <img
      src={logoSrc}
      alt={`${teamName} logo`}
      className="h-7 w-7 rounded-full object-contain"
      loading="lazy"
      onError={() => setLogoError(true)}
    />
  );
};

const PointsTable = () => {
  return (
    <section id="points-table" className="px-4 pt-6 pb-16">
      <div className="container mx-auto">
        <h2 className="mb-8 text-center font-heading text-3xl font-bold uppercase text-foreground md:text-4xl">Points Table</h2>

        <div className="gold-panel overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[linear-gradient(90deg,rgba(var(--text-main-rgb),1),rgba(var(--primary-rgb),1))] text-primary-foreground">
                <th className="px-4 py-3 text-left font-heading">#</th>
                <th className="px-4 py-3 text-left font-heading">Team</th>
                <th className="px-4 py-3 text-center font-heading">P</th>
                <th className="px-4 py-3 text-center font-heading">W</th>
                <th className="px-4 py-3 text-center font-heading">L</th>
                <th className="px-4 py-3 text-center font-heading">NRR</th>
                <th className="px-4 py-3 text-center font-heading">Pts</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row, index) => (
                <tr
                  key={row.short}
                  className={`animate-fade-up border-t border-border transition-colors hover:bg-muted/50 ${row.pos <= 4 ? "bg-secondary/10" : ""}`}
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <td className="px-4 py-3 font-bold text-muted-foreground">{row.pos}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <TeamLogoAvatar teamCode={row.short} teamName={row.team} />
                      <span className="font-heading font-semibold text-foreground">{row.team}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{row.p}</td>
                  <td className="px-4 py-3 text-center font-semibold text-secondary">{row.w}</td>
                  <td className="px-4 py-3 text-center font-semibold text-ipl-red">{row.l}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{row.nrr}</td>
                  <td className="px-4 py-3 text-center font-heading font-bold text-primary">{row.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">Top 4 teams (highlighted) qualify for the playoffs</p>
      </div>
    </section>
  );
};

export default PointsTable;

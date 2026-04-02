import { Activity } from "lucide-react";
import { TEAM_LOGOS } from "@/lib/logos";

const liveMatches = [
  {
    id: 1,
    status: "LIVE",
    team1: { name: "CSK", short: "CSK", score: "185/4", overs: "18.2" },
    team2: { name: "MI", short: "MI", score: "142/3", overs: "15.0" },
    venue: "Wankhede Stadium, Mumbai",
    link: "https://www.iplt20.com/matches/live",
  },
  {
    id: 2,
    status: "LIVE",
    team1: { name: "RCB", short: "RCB", score: "198/6", overs: "20.0" },
    team2: { name: "KKR", short: "KKR", score: "95/2", overs: "10.3" },
    venue: "M. Chinnaswamy Stadium, Bengaluru",
    link: "https://www.iplt20.com/matches/live",
  },
  {
    id: 3,
    status: "COMPLETED",
    team1: { name: "DC", short: "DC", score: "167/8", overs: "20.0" },
    team2: { name: "RR", short: "RR", score: "170/5", overs: "19.2" },
    venue: "Arun Jaitley Stadium, Delhi",
    result: "RR won by 5 wickets",
    link: "https://www.iplt20.com/matches/results",
  },
];

const LiveScores = () => {
  return (
    <section id="live-scores" className="py-16 px-4">
      <div className="container mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Activity className="w-6 h-6 text-ipl-red live-pulse" />
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground uppercase">Live Scores</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {liveMatches.map((match, index) => (
            <div
              key={match.id}
              className="gold-panel p-6 transition-all duration-300 hover:-translate-y-1 hover:glow-gold animate-fade-up"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${match.status === "LIVE" ? "bg-ipl-red text-accent-foreground live-pulse" : "bg-secondary text-secondary-foreground"}`}>
                  {match.status}
                </span>
                <span className="text-xs text-muted-foreground">{match.venue}</span>
              </div>

              <div className="space-y-4">
                {[match.team1, match.team2].map((team) => (
                  <div key={team.short} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={TEAM_LOGOS[team.short]}
                        alt={`${team.short} logo`}
                        className="w-9 h-9 rounded-full bg-muted p-1 object-contain"
                        loading="lazy"
                      />
                      <span className="font-heading text-lg font-semibold text-foreground">{team.short}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-heading text-xl font-bold text-foreground">{team.score}</span>
                      <span className="text-sm text-muted-foreground ml-2">({team.overs})</span>
                    </div>
                  </div>
                ))}
              </div>

              {match.result && (
                <p className="mt-4 text-sm text-secondary font-medium">{match.result}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LiveScores;

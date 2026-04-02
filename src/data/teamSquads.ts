type SquadMember = {
  name: string;
  role: string;
  info: string;
  img: string;
};

type TeamDef = {
  name: string;
  short: string;
};

const TEAM_DEFS: TeamDef[] = [
  { name: "Azpire", short: "AZP" },
  { name: "Benchmark", short: "BMK" },
  { name: "Champions", short: "CHP" },
  { name: "Dynamic", short: "DYN" },
  { name: "EMPEROR", short: "EMP" },
  { name: "FORTUNE", short: "FOR" },
  { name: "GLADIATORS", short: "GLD" },
  { name: "HARMONY", short: "HMY" },
  { name: "ICONS", short: "ICN" },
  { name: "JAAGUAR", short: "JAG" },
  { name: "KINGS", short: "KNG" },
  { name: "Legends", short: "LGD" },
  { name: "Millionaire", short: "MLN" },
  { name: "Nest", short: "NST" },
  { name: "PRINCE", short: "PRC" },
  { name: "SPARK", short: "SPK" },
  { name: "PD A", short: "PDA" },
  { name: "PD B", short: "PDB" },
  { name: "TRICHY A", short: "TRA" },
  { name: "TRICHY B", short: "TRB" },
];

const ROLES = ["Batter", "Bowler", "All-Rounder", "WK-Batter"];

const makeMembers = (short: string): SquadMember[] =>
  Array.from({ length: 15 }, (_, index) => ({
    name: `${short} Player ${index + 1}`,
    role: ROLES[index % ROLES.length],
    info: "Squad",
    img: "",
  }));

export const TEAM_SQUADS = TEAM_DEFS.map((team) => ({
  name: team.name,
  short: team.short,
  captain: "Captain TBD",
  members: makeMembers(team.short),
}));
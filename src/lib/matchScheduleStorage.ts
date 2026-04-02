export type StoredMatchSlot = {
  slot: number;
  team1: number;
  team2: number;
};

export type MatchScheduleSnapshot = {
  slotToTeamName: (string | null)[];
  schedulePlan: StoredMatchSlot[];
  revealedCount: number;
};

const STORAGE_KEY = "ipl_match_schedule_snapshot_v1";

const isValidMatch = (item: unknown): item is StoredMatchSlot => {
  if (!item || typeof item !== "object") return false;
  const m = item as Record<string, unknown>;
  return typeof m.slot === "number" && typeof m.team1 === "number" && typeof m.team2 === "number";
};

export const saveMatchScheduleSnapshot = (snapshot: MatchScheduleSnapshot) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // ignore storage write failures
  }
};

export const loadMatchScheduleSnapshot = (): MatchScheduleSnapshot | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<MatchScheduleSnapshot>;
    if (!Array.isArray(parsed.slotToTeamName) || !Array.isArray(parsed.schedulePlan)) return null;
    if (!parsed.schedulePlan.every(isValidMatch)) return null;
    return {
      slotToTeamName: parsed.slotToTeamName.map((item) => (typeof item === "string" && item.trim() ? item : null)),
      schedulePlan: parsed.schedulePlan,
      revealedCount: typeof parsed.revealedCount === "number" ? parsed.revealedCount : 0,
    };
  } catch {
    return null;
  }
};

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { loadMatchScheduleSnapshot, saveMatchScheduleSnapshot } from "@/lib/matchScheduleStorage";
import { useNavigate } from "react-router-dom";

type MatchSlot = {
  slot: number;
  team1: number;
  team2: number;
};

type MatchRevealPhase = "idle" | "loading" | "team1" | "versus" | "team2" | "done";
type SpinSoundProfile = "classic" | "roulette" | "industrial" | "suspense";

const TEAM_LABELS = Array.from({ length: 20 }, (_, index) => String.fromCharCode(65 + index));
const SLOT_GROUP_COUNT = 5;
const TEAMS_PER_GROUP = 4;
const MATCHES_PER_GROUP = 6; // round-robin for 4 teams
const TOTAL_MATCH_SLOTS = SLOT_GROUP_COUNT * MATCHES_PER_GROUP;
const EMPTY_SLOTS = Array.from({ length: TEAM_LABELS.length }, () => null as string | null);
const SPINNER_CELL_HEIGHT = 72;
const SPINNER_LANE_LENGTH = 220;

const buildSchedulePlan = () => {
  const plan: MatchSlot[] = [];
  let matchNumber = 1;

  for (let group = 0; group < SLOT_GROUP_COUNT; group += 1) {
    const start = group * TEAMS_PER_GROUP;
    const groupTeams = [start, start + 1, start + 2, start + 3];
    for (let i = 0; i < groupTeams.length; i += 1) {
      for (let j = i + 1; j < groupTeams.length; j += 1) {
        plan.push({
          slot: matchNumber,
          team1: groupTeams[i],
          team2: groupTeams[j],
        });
        matchNumber += 1;
      }
    }
  }

  return plan;
};

const MatchSetupSection = () => {
  const navigate = useNavigate();
  const storedSnapshot = loadMatchScheduleSnapshot();
  const [teamInput, setTeamInput] = useState("");
  const [slotToTeamName, setSlotToTeamName] = useState<(string | null)[]>(
    storedSnapshot?.slotToTeamName?.length === TEAM_LABELS.length ? storedSnapshot.slotToTeamName : EMPTY_SLOTS,
  );
  const [lastAssignedSlot, setLastAssignedSlot] = useState<number | null>(null);
  const [schedulePlan, setSchedulePlan] = useState<MatchSlot[]>(() => storedSnapshot?.schedulePlan ?? buildSchedulePlan() ?? []);
  const [revealedMatches, setRevealedMatches] = useState<MatchSlot[]>(() => {
    if (!storedSnapshot?.schedulePlan?.length || !storedSnapshot?.revealedCount) return [];
    return storedSnapshot.schedulePlan.slice(0, Math.max(0, storedSnapshot.revealedCount));
  });
  const [error, setError] = useState<string | null>(null);
  const [isSpinningAssignment, setIsSpinningAssignment] = useState(false);
  const [spinnerStep, setSpinnerStep] = useState(0);
  const [spinnerTransitionMs, setSpinnerTransitionMs] = useState(90);
  const spinSoundProfile: SpinSoundProfile = "classic";
  const [isRevealingMatch, setIsRevealingMatch] = useState(false);
  const [matchRevealPhase, setMatchRevealPhase] = useState<MatchRevealPhase>("idle");
  const [matchRevealPopup, setMatchRevealPopup] = useState<{
    matchNumber: number;
    team1Name: string;
    team2Name: string;
  } | null>(null);
  const timersRef = useRef<number[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const spinSoundRef = useRef<{
    rotorOsc: OscillatorNode;
    rotorGain: GainNode;
    motorOsc: OscillatorNode;
    motorGain: GainNode;
    suspenseOsc: OscillatorNode | null;
    suspenseGain: GainNode | null;
    clickTimer: number;
  } | null>(null);
  const matchSoundRef = useRef<{
    droneOsc: OscillatorNode;
    droneGain: GainNode;
    tickTimer: number;
  } | null>(null);

  const spinnerLane = useMemo(
    () => Array.from({ length: SPINNER_LANE_LENGTH }, (_, index) => TEAM_LABELS[index % TEAM_LABELS.length]),
    [],
  );

  const assignedCount = useMemo(() => slotToTeamName.filter(Boolean).length, [slotToTeamName]);
  const allTeamsAssigned = assignedCount === TEAM_LABELS.length;
  const canStartMatchPicking = assignedCount >= 1;
  const isComplete = revealedMatches.length >= TOTAL_MATCH_SLOTS;
  const lastPicked = revealedMatches[revealedMatches.length - 1] ?? null;

  const teamNameForSlot = (slotIndex: number) => slotToTeamName[slotIndex] ?? `Team ${TEAM_LABELS[slotIndex]}`;
  const assignedTeamMatchList = useMemo(() => {
    if (lastAssignedSlot === null) return [];
    return schedulePlan
      .map((match, index) => {
        if (match.team1 !== lastAssignedSlot && match.team2 !== lastAssignedSlot) return null;
        const opponentSlot = match.team1 === lastAssignedSlot ? match.team2 : match.team1;
        return {
          matchNumber: index + 1,
          opponentSlot,
        };
      })
      .filter((item): item is { matchNumber: number; opponentSlot: number } => item !== null);
  }, [lastAssignedSlot, schedulePlan]);

  const queueTimer = (timerId: number) => {
    timersRef.current.push(timerId);
  };

  const getAudioCtx = () => {
    if (audioCtxRef.current) return audioCtxRef.current;
    const AudioCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return null;
    audioCtxRef.current = new AudioCtor();
    return audioCtxRef.current;
  };

  const startAssignmentSpinSound = () => {
    if (spinSoundRef.current) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    const profileSettings: Record<
      SpinSoundProfile,
      {
        rotorType: OscillatorType;
        rotorStart: number;
        rotorEnd: number;
        rotorGain: number;
        motorType: OscillatorType;
        motorStart: number;
        motorEnd: number;
        motorGain: number;
        clickStart: number;
        clickEnd: number;
        clickGain: number;
        knockStart: number;
        knockEnd: number;
        knockGain: number;
        clickInterval: number;
        suspenseEnabled: boolean;
        suspenseStart: number;
        suspenseEnd: number;
        suspenseGain: number;
        stopStart: number;
        stopEnd: number;
        stopGain: number;
      }
    > = {
      classic: {
        rotorType: "triangle",
        rotorStart: 44,
        rotorEnd: 58,
        rotorGain: 0.055,
        motorType: "triangle",
        motorStart: 66,
        motorEnd: 82,
        motorGain: 0.045,
        clickStart: 1900,
        clickEnd: 760,
        clickGain: 0.26,
        knockStart: 162,
        knockEnd: 72,
        knockGain: 0.12,
        clickInterval: 68,
        suspenseEnabled: false,
        suspenseStart: 0,
        suspenseEnd: 0,
        suspenseGain: 0,
        stopStart: 138,
        stopEnd: 46,
        stopGain: 0.16,
      },
      roulette: {
        rotorType: "sawtooth",
        rotorStart: 56,
        rotorEnd: 74,
        rotorGain: 0.07,
        motorType: "triangle",
        motorStart: 78,
        motorEnd: 102,
        motorGain: 0.05,
        clickStart: 2300,
        clickEnd: 820,
        clickGain: 0.3,
        knockStart: 176,
        knockEnd: 68,
        knockGain: 0.16,
        clickInterval: 58,
        suspenseEnabled: false,
        suspenseStart: 0,
        suspenseEnd: 0,
        suspenseGain: 0,
        stopStart: 154,
        stopEnd: 42,
        stopGain: 0.21,
      },
      industrial: {
        rotorType: "triangle",
        rotorStart: 26,
        rotorEnd: 34,
        rotorGain: 0.1,
        motorType: "square",
        motorStart: 60,
        motorEnd: 84,
        motorGain: 0.06,
        clickStart: 2600,
        clickEnd: 900,
        clickGain: 0.38,
        knockStart: 186,
        knockEnd: 52,
        knockGain: 0.24,
        clickInterval: 49,
        suspenseEnabled: false,
        suspenseStart: 0,
        suspenseEnd: 0,
        suspenseGain: 0,
        stopStart: 168,
        stopEnd: 36,
        stopGain: 0.29,
      },
      suspense: {
        rotorType: "triangle",
        rotorStart: 28,
        rotorEnd: 36,
        rotorGain: 0.11,
        motorType: "square",
        motorStart: 62,
        motorEnd: 84,
        motorGain: 0.055,
        clickStart: 2800,
        clickEnd: 900,
        clickGain: 0.42,
        knockStart: 180,
        knockEnd: 52,
        knockGain: 0.22,
        clickInterval: 46,
        suspenseEnabled: true,
        suspenseStart: 118,
        suspenseEnd: 188,
        suspenseGain: 0.026,
        stopStart: 176,
        stopEnd: 38,
        stopGain: 0.26,
      },
    };

    const cfg = profileSettings[spinSoundProfile];

    const rotorOsc = ctx.createOscillator();
    const rotorGain = ctx.createGain();
    rotorOsc.type = cfg.rotorType;
    rotorOsc.frequency.setValueAtTime(cfg.rotorStart, ctx.currentTime);
    rotorOsc.frequency.linearRampToValueAtTime(cfg.rotorEnd, ctx.currentTime + 1.2);
    rotorGain.gain.setValueAtTime(0.001, ctx.currentTime);
    rotorGain.gain.linearRampToValueAtTime(cfg.rotorGain, ctx.currentTime + 0.06);
    rotorOsc.connect(rotorGain);
    rotorGain.connect(ctx.destination);
    rotorOsc.start();

    const motorOsc = ctx.createOscillator();
    const motorGain = ctx.createGain();
    motorOsc.type = cfg.motorType;
    motorOsc.frequency.setValueAtTime(cfg.motorStart, ctx.currentTime);
    motorOsc.frequency.linearRampToValueAtTime(cfg.motorEnd, ctx.currentTime + 1.2);
    motorGain.gain.setValueAtTime(0.001, ctx.currentTime);
    motorGain.gain.linearRampToValueAtTime(cfg.motorGain, ctx.currentTime + 0.08);
    motorOsc.connect(motorGain);
    motorGain.connect(ctx.destination);
    motorOsc.start();

    let suspenseOsc: OscillatorNode | null = null;
    let suspenseGain: GainNode | null = null;
    if (cfg.suspenseEnabled) {
      suspenseOsc = ctx.createOscillator();
      suspenseGain = ctx.createGain();
      suspenseOsc.type = "sawtooth";
      suspenseOsc.frequency.setValueAtTime(cfg.suspenseStart, ctx.currentTime);
      suspenseOsc.frequency.exponentialRampToValueAtTime(cfg.suspenseEnd, ctx.currentTime + 1.8);
      suspenseGain.gain.setValueAtTime(0.001, ctx.currentTime);
      suspenseGain.gain.linearRampToValueAtTime(cfg.suspenseGain, ctx.currentTime + 0.2);
      suspenseOsc.connect(suspenseGain);
      suspenseGain.connect(ctx.destination);
      suspenseOsc.start();
    }

    const playRatchetClick = () => {
      const clickOsc = ctx.createOscillator();
      const clickGain = ctx.createGain();
      clickOsc.type = "square";
      clickOsc.frequency.setValueAtTime(cfg.clickStart + Math.random() * 240, ctx.currentTime);
      clickOsc.frequency.exponentialRampToValueAtTime(cfg.clickEnd, ctx.currentTime + 0.014);
      clickGain.gain.setValueAtTime(0.001, ctx.currentTime);
      clickGain.gain.exponentialRampToValueAtTime(cfg.clickGain, ctx.currentTime + 0.0012);
      clickGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.016);
      clickOsc.connect(clickGain);
      clickGain.connect(ctx.destination);
      clickOsc.start();
      clickOsc.stop(ctx.currentTime + 0.018);

      const knockOsc = ctx.createOscillator();
      const knockGain = ctx.createGain();
      knockOsc.type = "triangle";
      knockOsc.frequency.setValueAtTime(cfg.knockStart, ctx.currentTime);
      knockOsc.frequency.exponentialRampToValueAtTime(cfg.knockEnd, ctx.currentTime + 0.036);
      knockGain.gain.setValueAtTime(0.001, ctx.currentTime);
      knockGain.gain.exponentialRampToValueAtTime(cfg.knockGain, ctx.currentTime + 0.0022);
      knockGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.038);
      knockOsc.connect(knockGain);
      knockGain.connect(ctx.destination);
      knockOsc.start();
      knockOsc.stop(ctx.currentTime + 0.04);
    };

    playRatchetClick();
    const clickTimer = window.setInterval(playRatchetClick, cfg.clickInterval);
    spinSoundRef.current = { rotorOsc, rotorGain, motorOsc, motorGain, suspenseOsc, suspenseGain, clickTimer };
  };

  const stopAssignmentSpinSound = () => {
    const active = spinSoundRef.current;
    const ctx = getAudioCtx();
    if (!active || !ctx) return;

    window.clearInterval(active.clickTimer);
    active.rotorGain.gain.cancelScheduledValues(ctx.currentTime);
    active.rotorGain.gain.setValueAtTime(active.rotorGain.gain.value, ctx.currentTime);
    active.rotorGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    active.motorGain.gain.cancelScheduledValues(ctx.currentTime);
    active.motorGain.gain.setValueAtTime(active.motorGain.gain.value, ctx.currentTime);
    active.motorGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    if (active.suspenseGain) {
      active.suspenseGain.gain.cancelScheduledValues(ctx.currentTime);
      active.suspenseGain.gain.setValueAtTime(active.suspenseGain.gain.value, ctx.currentTime);
      active.suspenseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
    }

    const stopThunkOsc = ctx.createOscillator();
    const stopThunkGain = ctx.createGain();
    stopThunkOsc.type = "square";
    const stopStart = spinSoundProfile === "suspense" ? 176 : spinSoundProfile === "industrial" ? 168 : 148;
    const stopEnd = spinSoundProfile === "suspense" ? 38 : spinSoundProfile === "industrial" ? 36 : 44;
    const stopGain = spinSoundProfile === "suspense" ? 0.26 : spinSoundProfile === "industrial" ? 0.29 : 0.2;
    stopThunkOsc.frequency.setValueAtTime(stopStart, ctx.currentTime);
    stopThunkOsc.frequency.exponentialRampToValueAtTime(stopEnd, ctx.currentTime + 0.14);
    stopThunkGain.gain.setValueAtTime(0.001, ctx.currentTime);
    stopThunkGain.gain.exponentialRampToValueAtTime(stopGain, ctx.currentTime + 0.0025);
    stopThunkGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    stopThunkOsc.connect(stopThunkGain);
    stopThunkGain.connect(ctx.destination);
    stopThunkOsc.start();
    stopThunkOsc.stop(ctx.currentTime + 0.19);

    active.rotorOsc.stop(ctx.currentTime + 0.14);
    active.motorOsc.stop(ctx.currentTime + 0.14);
    active.suspenseOsc?.stop(ctx.currentTime + 0.14);
    spinSoundRef.current = null;
  };

  const startMatchRevealSound = () => {
    if (matchSoundRef.current) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    const droneOsc = ctx.createOscillator();
    const droneGain = ctx.createGain();
    droneOsc.type = "sawtooth";
    droneOsc.frequency.setValueAtTime(120, ctx.currentTime);
    droneOsc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 1.4);
    droneGain.gain.setValueAtTime(0.001, ctx.currentTime);
    droneGain.gain.linearRampToValueAtTime(0.035, ctx.currentTime + 0.1);
    droneOsc.connect(droneGain);
    droneGain.connect(ctx.destination);
    droneOsc.start();

    const playTick = () => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(700 + Math.random() * 260, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(340, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.045, ctx.currentTime + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.055);
    };

    const tickTimer = window.setInterval(playTick, 150);
    playTick();
    matchSoundRef.current = { droneOsc, droneGain, tickTimer };
  };

  const stopMatchRevealSound = () => {
    const active = matchSoundRef.current;
    const ctx = getAudioCtx();
    if (!active || !ctx) return;
    window.clearInterval(active.tickTimer);
    active.droneGain.gain.cancelScheduledValues(ctx.currentTime);
    active.droneGain.gain.setValueAtTime(active.droneGain.gain.value, ctx.currentTime);
    active.droneGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    active.droneOsc.stop(ctx.currentTime + 0.14);
    matchSoundRef.current = null;
  };

  const playMatchRevealHit = () => {
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(360, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.14);
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  };

  useEffect(
    () => () => {
      timersRef.current.forEach((timerId) => {
        window.clearInterval(timerId);
        window.clearTimeout(timerId);
      });
      stopAssignmentSpinSound();
      stopMatchRevealSound();
      timersRef.current = [];
    },
    [],
  );

  useEffect(() => {
    saveMatchScheduleSnapshot({
      slotToTeamName,
      schedulePlan,
      revealedCount: revealedMatches.length,
    });
  }, [slotToTeamName, schedulePlan, revealedMatches.length]);

  const spinAssignTeam = () => {
    const cleanName = teamInput.trim();
    if (!cleanName) {
      setError("Type a team name before spinning.");
      return;
    }

    const normalizedInput = cleanName.toLowerCase();
    const teamAlreadyExists = slotToTeamName.some(
      (name) => typeof name === "string" && name.trim().toLowerCase() === normalizedInput,
    );
    if (teamAlreadyExists) {
      setError("Team already exists. Please enter a different team name.");
      return;
    }

    if (isSpinningAssignment) return;

    if (allTeamsAssigned) {
      setError("All 20 slots are already assigned. Use Reset to start over.");
      return;
    }

    const unfilledSlots = TEAM_LABELS.map((_, index) => index).filter((index) => !slotToTeamName[index]);
    const pickedSlot = unfilledSlots[Math.floor(Math.random() * unfilledSlots.length)];
    setError(null);
    setIsSpinningAssignment(true);
    startAssignmentSpinSound();

    setSpinnerTransitionMs(90);
    setSpinnerStep((prev) => {
      if (prev > SPINNER_LANE_LENGTH - 40) {
        return (prev % TEAM_LABELS.length) + TEAM_LABELS.length * 6;
      }
      return prev;
    });

    const rollInterval = window.setInterval(() => {
      setSpinnerStep((prev) => prev + 1);
    }, 82);
    queueTimer(rollInterval);

    const stopRolling = window.setTimeout(() => {
      window.clearInterval(rollInterval);
      stopAssignmentSpinSound();

      setSpinnerStep((prev) => {
        const nowMod = prev % TEAM_LABELS.length;
        const delta = (pickedSlot - nowMod + TEAM_LABELS.length) % TEAM_LABELS.length;
        return prev + delta + TEAM_LABELS.length * 2;
      });
      setSpinnerTransitionMs(700);

      const finishAssign = window.setTimeout(() => {
        setSlotToTeamName((prev) => {
          const next = [...prev];
          next[pickedSlot] = cleanName;
          return next;
        });
        setLastAssignedSlot(pickedSlot);
        setTeamInput("");
        setSpinnerTransitionMs(120);
        setIsSpinningAssignment(false);
      }, 720);
      queueTimer(finishAssign);
    }, 1900);
    queueTimer(stopRolling);
  };

  const pickMatch = () => {
    if (!canStartMatchPicking || isComplete || isRevealingMatch) return;

    if (schedulePlan.length === 0) {
      setError("Could not generate a fair 60-match schedule. Please reset and try again.");
      return;
    }

    const nextMatch = schedulePlan[revealedMatches.length];
    if (!nextMatch) return;

    setError(null);
    setIsRevealingMatch(true);
    setMatchRevealPopup({
      matchNumber: revealedMatches.length + 1,
      team1Name: teamNameForSlot(nextMatch.team1),
      team2Name: teamNameForSlot(nextMatch.team2),
    });
    setMatchRevealPhase("loading");
    startMatchRevealSound();

    const t1 = window.setTimeout(() => setMatchRevealPhase("team1"), 500);
    const t2 = window.setTimeout(() => setMatchRevealPhase("versus"), 1100);
    const t3 = window.setTimeout(() => {
      setMatchRevealPhase("team2");
      playMatchRevealHit();
      stopMatchRevealSound();
    }, 1650);
    const t4 = window.setTimeout(() => {
      setRevealedMatches((prev) => [...prev, nextMatch]);
      setMatchRevealPhase("done");
      setIsRevealingMatch(false);
    }, 2150);

    queueTimer(t1);
    queueTimer(t2);
    queueTimer(t3);
    queueTimer(t4);
  };

  const resetAll = () => {
    timersRef.current.forEach((timerId) => {
      window.clearInterval(timerId);
      window.clearTimeout(timerId);
    });
    timersRef.current = [];
    stopAssignmentSpinSound();
    stopMatchRevealSound();
    setTeamInput("");
    setSlotToTeamName(EMPTY_SLOTS);
    setLastAssignedSlot(null);
    setSchedulePlan(buildSchedulePlan() ?? []);
    setRevealedMatches([]);
    setSpinnerStep(0);
    setSpinnerTransitionMs(90);
    setIsSpinningAssignment(false);
    setIsRevealingMatch(false);
    setMatchRevealPhase("idle");
    setMatchRevealPopup(null);
    setError(null);
  };

  const renderKineticSegment = (
    text: string,
    className: string,
    baseDelayMs: number,
    stepMs: number,
  ) => (
    <span className={className} aria-label={text}>
      {Array.from(text).map((char, charIndex) => (
        <span
          key={`${className}-${char}-${charIndex}`}
          className="kinetic-char"
          style={{ "--kt-delay": `${baseDelayMs + charIndex * stepMs}ms` } as CSSProperties}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );

  return (
    <section id="match-setup" className="px-4 pt-6 pb-16">
      <div className="container mx-auto space-y-6">
        <div className="text-center">
          <h2 className="font-heading text-3xl font-bold uppercase text-foreground md:text-4xl">Cricket Match Scheduler</h2>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            Enter one team name, assign it randomly to A-T. Schedule is grouped into 5 slots with 4 teams each, and each slot has 6 matches (30 total).
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
        <div className="gold-panel rounded-2xl border-primary/40 bg-[linear-gradient(160deg,var(--surface-dim)_0%,var(--primary-light)_52%,var(--primary)_100%)] p-4 shadow-[0_30px_64px_rgba(var(--dark-surface-rgb),0.42),0_0_58px_rgba(var(--primary-rgb),0.4),inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-22px_40px_rgba(var(--dark-surface-rgb),0.22)] ring-1 ring-primary/40 md:p-6">
            <h3 className="mb-4 font-heading text-xl font-bold text-foreground">Team Assignment Spinner</h3>
            <div className="space-y-4 rounded-xl border border-border/70 bg-background/50 p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-foreground">Assigned Slots: {assignedCount}/20</p>
                <p className="text-xs text-muted-foreground">Remaining: {TEAM_LABELS.length - assignedCount}</p>
              </div>

              <label className="block space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">Team Name</span>
                <input
                  value={teamInput}
                  onChange={(event) => setTeamInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      spinAssignTeam();
                    }
                }}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary"
                placeholder="Type team name and press Enter"
                disabled={allTeamsAssigned || isSpinningAssignment}
              />
            </label>

            <div className="flex gap-3">
              <button
                onClick={spinAssignTeam}
                disabled={allTeamsAssigned || isSpinningAssignment}
                className={cn(
                  "rounded-md px-4 py-2 text-sm font-semibold transition",
                  allTeamsAssigned || isSpinningAssignment
                    ? "cursor-not-allowed bg-muted text-muted-foreground"
                    : "bg-primary text-primary-foreground hover:brightness-110",
                )}
              >
                {isSpinningAssignment ? "Spinning..." : "Assign Slot"}
              </button>
              <button
                onClick={resetAll}
                className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
                >
                Reset
              </button>
            </div>

            <div className="rounded-xl border border-primary/45 bg-[linear-gradient(155deg,rgba(var(--surface-dim-rgb),0.96)_0%,rgba(var(--primary-light-rgb),0.52)_46%,rgba(var(--primary-rgb),0.36)_100%)] p-4 shadow-[0_14px_30px_rgba(var(--dark-surface-rgb),0.26),inset_0_1px_0_rgba(255,255,255,0.38),inset_0_-12px_22px_rgba(var(--dark-surface-rgb),0.14)]">
              {lastAssignedSlot !== null && (
                <p className="mb-3 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Assigned: {slotToTeamName[lastAssignedSlot]} {"->"} Team {TEAM_LABELS[lastAssignedSlot]}
                </p>
              )}
              <div className="relative h-[72px] overflow-hidden rounded-xl border border-primary/35 bg-[linear-gradient(120deg,rgba(var(--surface-dim-rgb),0.96)_0%,rgba(var(--primary-light-rgb),0.62)_48%,rgba(var(--primary-rgb),0.42)_100%)] shadow-[inset_0_2px_5px_rgba(255,255,255,0.34),inset_0_-12px_22px_rgba(var(--dark-surface-rgb),0.2)]">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-5 bg-gradient-to-b from-background to-transparent" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-background to-transparent" />
                <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-primary/20" />
                <div
                  className="will-change-transform"
                  style={{
                    transform: `translateY(-${spinnerStep * SPINNER_CELL_HEIGHT}px)`,
                    transition: `transform ${spinnerTransitionMs}ms linear`,
                  }}
                >
                  {spinnerLane.map((label, index) => (
                    <div key={`${label}-${index}`} className="flex h-[72px] items-center justify-center bg-[radial-gradient(circle_at_50%_45%,rgba(var(--surface-dim-rgb),0.58),rgba(var(--primary-rgb),0.18))] text-2xl font-black tracking-[0.2em] text-primary drop-shadow-[0_2px_4px_rgba(var(--dark-surface-rgb),0.3)]">
                      Team {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {lastAssignedSlot !== null && (
              <p className="text-sm font-semibold text-primary">
                Assigned: {slotToTeamName[lastAssignedSlot]} {"->"} Team {TEAM_LABELS[lastAssignedSlot]}
              </p>
              )}

              {error && <p className="text-sm text-ipl-red">{error}</p>}
            </div>
          </div>

          <div className="gold-panel flex flex-col rounded-2xl border-primary/40 bg-[linear-gradient(160deg,var(--surface-dim)_0%,var(--primary-light)_52%,var(--primary)_100%)] p-4 shadow-[0_30px_64px_rgba(var(--dark-surface-rgb),0.42),0_0_58px_rgba(var(--primary-rgb),0.4),inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-22px_40px_rgba(var(--dark-surface-rgb),0.22)] ring-1 ring-primary/40 md:p-6">
            {!canStartMatchPicking && <p className="mt-3 text-xs text-muted-foreground">Assign at least one team to start match picking.</p>}

            {lastAssignedSlot !== null && (
              <div className="mt-2 flex flex-1 flex-col text-center md:mt-0">
                <p className="font-heading text-sm font-bold uppercase tracking-[0.08em] text-foreground">
                  Match Reveal Card: {teamNameForSlot(lastAssignedSlot)}
                </p>
                <div className="mt-2 flex flex-1 flex-col items-center justify-evenly gap-4">
                  {assignedTeamMatchList.map((item, index) => {
                    const primaryTeam = teamNameForSlot(lastAssignedSlot);
                    const opponentTeam = teamNameForSlot(item.opponentSlot);
                    const hasConfirmedOpponent = Boolean(slotToTeamName[item.opponentSlot]);
                    const lineDelay = index * 130;

                    return (
                      <p
                        key={item.matchNumber}
                        className="animate-fixture-pop-spotlight mx-auto flex min-h-[92px] w-full max-w-[700px] items-center justify-center overflow-hidden text-ellipsis whitespace-nowrap rounded-xl border border-primary/35 bg-[linear-gradient(120deg,rgba(var(--surface-dim-rgb),0.96)_0%,rgba(var(--primary-light-rgb),0.62)_50%,rgba(var(--primary-rgb),0.42)_100%)] px-5 py-5 text-center font-fixture text-[clamp(1.45rem,2.3vw,2.35rem)] leading-none tracking-[0.02em] text-foreground shadow-[0_10px_24px_rgba(var(--dark-surface-rgb),0.26),inset_0_1px_0_rgba(255,255,255,0.32),inset_0_-10px_20px_rgba(var(--dark-surface-rgb),0.16)] md:px-7 md:py-6"
                        style={{ animationDelay: `${lineDelay}ms` }}
                      >
                        {renderKineticSegment(`Match ${item.matchNumber}:`, "kinetic-segment kinetic-meta opacity-90", lineDelay, 20)}
                        {renderKineticSegment(
                          primaryTeam,
                          cn(
                            "kinetic-segment kinetic-team-home ml-2",
                            hasConfirmedOpponent && "matchup-pop-hold px-1.5",
                          ),
                          lineDelay + 150,
                          26,
                        )}
                        {renderKineticSegment("VS", "kinetic-segment kinetic-vs px-2 text-primary", lineDelay + 340, 80)}
                        {renderKineticSegment(
                          opponentTeam,
                          cn(
                            "kinetic-segment kinetic-team-away",
                            hasConfirmedOpponent && "matchup-pop-hold px-1.5",
                          ),
                          lineDelay + 430,
                          26,
                        )}
                      </p>
                    );
                  })}
                </div>
              </div>
            )}

            {allTeamsAssigned && (
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => navigate("/group")}
                    className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 font-heading text-xs font-bold uppercase tracking-[0.08em] text-primary-foreground shadow-[0_6px_16px_rgba(var(--dark-surface-rgb),0.24)] transition hover:brightness-110"
                  >
                    <span>Next</span>
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
                      <path
                        d="M5 12h14m-6-6 6 6-6 6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              )}

          </div>
        </div>

      </div>
    </section>
  );
};

export default MatchSetupSection;


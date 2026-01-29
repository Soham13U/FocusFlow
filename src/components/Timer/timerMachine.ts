export type Mode = "FOCUS" | "SHORT_BREAK" | "LONG_BREAK";
export type Status = "IDLE" | "RUNNING" | "PAUSED" | "COMPLETE";
export type Prefs = {
  autoStartNext: boolean;
  soundEnabled: boolean;
};

export type TimerState = {
  mode: Mode;
  status: Status;
  targetDurationSec: number;
  selectedLabelId: number | null;
  startedAtMs: number | null;
  pausedAtMs: number | null;
  accumPausedMs: number;
  remainingSec: number;
  completionFired: boolean;
  prefs: Prefs;
  focusDurationSec: number;
};

export type TimerEvent =
  | { type: "SET_MODE"; mode: Mode }
  | { type: "SET_DURATION_SEC"; seconds: number }
  | { type: "SET_LABEL"; labelId: number | null }
  | { type: "SET_PREFS"; prefs: Partial<Prefs> }
  | { type: "START"; nowMs: number }
  | { type: "PAUSE"; nowMs: number }
  | { type: "RESUME"; nowMs: number }
  | { type: "RESET" }
  | { type: "TICK"; nowMs: number }
  | { type: "HYDRATE"; state: TimerState };

export function createInitialState(): TimerState {
  const focusSec = 25 * 60;
  return {
    mode: "FOCUS",
    status: "IDLE",
    targetDurationSec: focusSec,
    remainingSec: focusSec,
    focusDurationSec: focusSec,
    selectedLabelId: null,
    startedAtMs: null,
    pausedAtMs: null,
    accumPausedMs: 0,
    completionFired: false,
    prefs: {
      autoStartNext: false,
      soundEnabled: true,
    },
  };
}

function clampInt(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

export function deriveRemainingSec(state: TimerState, nowMs: number): number {
  // if its not started, remaining sec = target duration
  if (state.startedAtMs == null) return state.targetDurationSec;

  const targetMs = state.targetDurationSec * 1000;

  const extraPausedMs =
    state.status === "PAUSED" && state.pausedAtMs != null
      ? Math.max(0, nowMs - state.pausedAtMs)
      : 0;

  const elapsedMs =
    nowMs - state.startedAtMs - state.accumPausedMs - extraPausedMs;
  const remainingMs = targetMs - elapsedMs;

  const remainingSec = Math.ceil(remainingMs / 1000);

  return clampInt(remainingSec, 0, state.targetDurationSec);
}

export function reduceTimer(state: TimerState, event: TimerEvent): TimerState {
  switch (event.type) {
    case "START": {
      if (!(state.status === "IDLE" || state.status === "COMPLETE"))
        return state;

      const next: TimerState = {
        ...state,
        status: "RUNNING",
        startedAtMs: event.nowMs,
        pausedAtMs: null,
        accumPausedMs: 0,
        remainingSec: state.targetDurationSec,
        completionFired: false,
      };
      return next;
    }
    case "TICK": {
      if (state.status === "IDLE" || state.status === "COMPLETE") return state;

      const newRemaining = deriveRemainingSec(state, event.nowMs);

      if (newRemaining === 0 && !state.completionFired) {
        return {
          ...state,
          remainingSec: 0,
          status: "COMPLETE",
          completionFired: true,
        };
      }
      return { ...state, remainingSec: newRemaining };
    }

    case "PAUSE": {
      if (state.status != "RUNNING") return state;
      return { ...state, status: "PAUSED", pausedAtMs: event.nowMs };
    }
    case "RESUME": {
      if (state.status != "PAUSED" || state.pausedAtMs == null) return state;
      const pausedFor = Math.max(0, event.nowMs - state.pausedAtMs);
      return {
        ...state,
        status: "RUNNING",
        pausedAtMs: null,
        accumPausedMs: state.accumPausedMs + pausedFor,
      };
    }
    case "RESET": {
      return {
        ...state,
        status: "IDLE",
        startedAtMs: null,
        pausedAtMs: null,
        accumPausedMs: 0,
        remainingSec: state.targetDurationSec,
        completionFired: false,
      };
    }
    case "SET_MODE": {
      if (!(state.status === "IDLE" || state.status === "COMPLETE"))
        return state;

      let nextDuration = state.targetDurationSec;

      if (event.mode === "FOCUS") nextDuration = state.focusDurationSec;
      if (event.mode === "SHORT_BREAK") nextDuration = 5 * 60;
      if (event.mode === "LONG_BREAK") nextDuration = 15 * 60;

      return {
        ...state,
        mode: event.mode,
        targetDurationSec: nextDuration,
        remainingSec: nextDuration,
      };
    }

    case "SET_DURATION_SEC": {
      if (!(state.status === "IDLE" || state.status === "COMPLETE"))
        return state;

      const sec = clampInt(event.seconds, 60, 6 * 60 * 60);

      // If we're configuring focus, remember it as the focus duration
      if (state.mode === "FOCUS") {
        return {
          ...state,
          focusDurationSec: sec,
          targetDurationSec: sec,
          remainingSec: sec,
        };
      }

      // otherwise just set current mode duration (fine for now)
      return { ...state, targetDurationSec: sec, remainingSec: sec };
    }

    case "SET_LABEL":
      return { ...state, selectedLabelId: event.labelId };
    case "SET_PREFS":
      return { ...state, prefs: { ...state.prefs, ...event.prefs } };
    case "HYDRATE": {
      return event.state;
    }

    default:
      return state;
  }
}

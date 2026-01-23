import { createInitialState, reduceTimer } from "../src/components/Timer/timerMachine";

function step(state: any, event: any) {
  const next = reduceTimer(state, event);
  console.log(event, "=>", {
    status: next.status,
    remainingSec: next.remainingSec,
    startedAtMs: next.startedAtMs,
    pausedAtMs: next.pausedAtMs,
    accumPausedMs: next.accumPausedMs,
    completionFired: next.completionFired,
  });
  return next;
}

let s = createInitialState();

// Make it short so we can test quickly (3 seconds)
s = step(s, { type: "SET_DURATION_SEC", seconds: 60 });

// Start at t=0
s = step(s, { type: "START", nowMs: 0 });

// Tick at 500ms -> should still show 3 (ceil)
s = step(s, { type: "TICK", nowMs: 500 });

// Tick at 1001ms -> should show 2
s = step(s, { type: "TICK", nowMs: 1001 });

// Pause at 1200ms
s = step(s, { type: "PAUSE", nowMs: 1200 });

// Tick while paused at 2200ms -> should NOT decrease further
s = step(s, { type: "TICK", nowMs: 2200 });

// Resume at 3000ms (paused for 1800ms)
s = step(s, { type: "RESUME", nowMs: 3000 });

// Tick at 3000ms -> should be same as before resume
s = step(s, { type: "TICK", nowMs: 3000 });

// Tick at 4001ms -> should decrease by ~1 sec
s = step(s, { type: "TICK", nowMs: 4001 });

// Tick at 6000ms+ -> should complete exactly once
s = step(s, { type: "TICK", nowMs: 7000 });
s = step(s, { type: "TICK", nowMs: 8000 }); // should not re-complete

s = step(s, { type: "TICK", nowMs: 62000 }); // should COMPLETE
s = step(s, { type: "TICK", nowMs: 70000 }); // should stay COMPLETE, no re-fire


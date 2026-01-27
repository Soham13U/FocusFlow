"use client";
import { initSound, playEndSound } from "./sound";


import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  createInitialState,
  reduceTimer,
  type TimerState,
  type Mode,
} from "./timerMachine";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Label = { id: number; name: string; createdAt: string };

function formatMMSS(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;

  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function Timer() {
  //Label
  
  const [labels, setLabels] = useState<Label[]>([]);
  const [labelsLoading, setLabelsLoading] = useState(true);
  const [labelsError, setLabelsError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [state, dispatch] = useReducer(
    reduceTimer,
    undefined,
    createInitialState,
  );
  const canEditMeta = state.status === "IDLE" || state.status === "COMPLETE";

  const intervalRef = useRef<number | null>(null);

 const loadLabels = useCallback(async () => {
  try {
    setLabelsLoading(true);
    setLabelsError(null);

    const res = await fetch("/api/labels", { cache: "no-store" });
    if (!res.ok) throw new Error(`GET /api/labels failed (${res.status})`);

    const data = (await res.json()) as Label[];
    setLabels(data);
  } catch (e: any) {
    setLabelsError(e?.message ?? "Failed to load labels");
  } finally {
    setLabelsLoading(false);
  }
}, []);

useEffect(() => {
  loadLabels();
}, [loadLabels]);

useEffect(() => {
  if (!canEditMeta && createOpen) {
    setCreateOpen(false);
  }
}, [canEditMeta, createOpen]);


async function handleCreateLabel() {
  const name = newLabelName.trim();
  if (!canEditMeta) return;

  if (!name) return;

  setCreating(true);
  setCreateError(null);

  try {
    const res = await fetch("/api/labels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (res.status === 409) {
      setCreateError("That label already exists.");
      return;
    }

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setCreateError(body?.error ?? "Failed to create label");
      return;
    }

    const created = (await res.json()) as Label;

    // refresh list + select new label
    await loadLabels();
    dispatch({ type: "SET_LABEL", labelId: created.id });

    // reset + close
    setNewLabelName("");
    setCreateOpen(false);
  } catch (e: any) {
    setCreateError(e?.message ?? "Failed to create label");
  } finally {
    setCreating(false);
  }
}



  useEffect(() => {
    //clear existing intervals
    if (intervalRef.current != null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (state.status === "RUNNING" || state.status === "PAUSED") {
      intervalRef.current = window.setInterval(() => {
        dispatch({ type: "TICK", nowMs: Date.now() });
      }, 250);
    }
    return () => {
      if (intervalRef.current != null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state.status]);

  const presets = useMemo(() => [25, 45, 60], []);
  const currentMinutes = Math.round(state.targetDurationSec / 60);

  const isIdle = state.status === "IDLE";
  const isRunning = state.status === "RUNNING";
  const isPaused = state.status === "PAUSED";
  const isComplete = state.status === "COMPLETE";

  //Sound
  const loggedRunRef = useRef<string | null>(null);

useEffect(() => {
  if (state.mode !== "FOCUS") return;
  if (state.status !== "COMPLETE") return;
  if (!state.completionFired) return;
  if (state.startedAtMs == null) return;

  // Build a unique "run id" based on start timestamp + duration + label
  const runKey = `${state.startedAtMs}:${state.targetDurationSec}:${state.selectedLabelId ?? "none"}`;

  // Guard: don't run side effects more than once for same completion
  if (loggedRunRef.current === runKey) return;
  loggedRunRef.current = runKey;

  // Side effects
  playEndSound();

  const startedAt = new Date(state.startedAtMs).toISOString();
  const endedAt = new Date().toISOString();

  void fetch("/api/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "FOCUS",
      startedAt,
      endedAt,
      durationSec: state.targetDurationSec,
      labelId: state.selectedLabelId,
    }),
  }).then(async (res) => {
    if (!res.ok) {
      // If it failed, allow retry on next completion by clearing guard
      loggedRunRef.current = null;
      console.error("Failed to log session", res.status, await res.text());
    }
  }).catch((err) => {
    loggedRunRef.current = null;
    console.error("Failed to log session", err);
  });
}, [state.status, state.mode, state.completionFired, state.startedAtMs, state.targetDurationSec, state.selectedLabelId]);



  return (
    <Card className="p-6 max-w-md mx-auto space-y-6">
      <div className="text-center">
        <div className="text-sm opacity-70">{state.mode}</div>
        <div className="text-6xl font-semibold tabular-nums">
          {formatMMSS(state.remainingSec)}
        </div>
        {isComplete && (
          <div className="mt-2 text-sm font-medium">Session Complete</div>
        )}
      </div>

      {/*Presets*/}
      <div className="flex gap-2 justify-center flex-wrap">
        {presets.map((m) => (
          <Button
            key={m}
            variant="outline"
            disabled={!(isIdle || isComplete)}
            onClick={() =>
              dispatch({ type: "SET_DURATION_SEC", seconds: m * 60 })
            }
          >
            {m}m
          </Button>
        ))}
      </div>

      {/* Custom minutes */}
      <div className="flex items-center gap-2 justify-center">
        <Input
          className="w-28"
          type="number"
          min={1}
          max={360}
          disabled={!(isIdle || isComplete)}
          value={currentMinutes}
          onChange={(e) => {
            const nextMin = Number(e.target.value || 0);
            dispatch({ type: "SET_DURATION_SEC", seconds: nextMin * 60 });
          }}
        />
        <span className="text-sm opacity-70">minutes</span>
      </div>

      {/* Labels*/}
      <div className="space-y-2">
        <div className="text-sm opacity-70">Label</div>

        {labelsLoading ? (
          <div className="text-sm opacity-70">Loading labels...</div>
        ) : labelsError ? (
          <div className="text-sm text-red-500">{labelsError}</div>
        ) : (
          <Select
            value={
              state.selectedLabelId == null
                ? "none"
                : String(state.selectedLabelId)
            }
            onValueChange={(v) => {
              dispatch({
                type: "SET_LABEL",
                labelId: v === "none" ? null : Number(v),
              });
            }}
            disabled={!canEditMeta}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="No label" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="none">No label</SelectItem>
              {labels.map((l) => (
                <SelectItem key={l.id} value={String(l.id)}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/*Custom Label */}
      <div className="flex items-center justify-between">
 

  <Dialog open={createOpen} onOpenChange={setCreateOpen}>
    <DialogTrigger asChild>
      <Button variant="outline" size="sm" disabled={!canEditMeta || creating}>
        + New label
      </Button>
    </DialogTrigger>

    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create label</DialogTitle>
      </DialogHeader>

      <div className="space-y-3">
        <Input
          placeholder="e.g., Deep Work"
          value={newLabelName}
          onChange={(e) => setNewLabelName(e.target.value)}
          disabled={creating}
          autoFocus
        />

        {createError && (
          <div className="text-sm text-red-500">{createError}</div>
        )}

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setCreateOpen(false)}
            disabled={creating}
          >
            Cancel
          </Button>

          <Button
            onClick={handleCreateLabel}
            disabled={creating || newLabelName.trim().length === 0}
          >
            {creating ? "Creating..." : "Create"}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</div>


      {/* Controls */}
      <div className="flex gap-2 justify-center">
        {(isIdle || isComplete) && (
          <Button
            onClick={() => {initSound(); dispatch({ type: "START", nowMs: Date.now() }) }}
          >
            Start
          </Button>
        )}
        {isRunning && (
          <Button
            variant="secondary"
            onClick={() => dispatch({ type: "PAUSE", nowMs: Date.now() })}
          >
            Pause
          </Button>
        )}

        <Button variant="outline" onClick={() => dispatch({ type: "RESET" })}>
          Reset
        </Button>
      </div>

      <div className="flex gap-2 justify-center flex-wrap">
        {(["FOCUS", "SHORT_BREAK", "LONG_BREAK"] as Mode[]).map((mode) => (
          <Button
            key={mode}
            variant={state.mode === mode ? "default" : "outline"}
            disabled={!(isIdle || isComplete)}
            onClick={() => dispatch({ type: "SET_MODE", mode })}
          >
            {mode === "FOCUS"
              ? "Focus"
              : mode === "SHORT_BREAK"
                ? "Short"
                : "Long"}
          </Button>
        ))}
      </div>
    </Card>
  );
}

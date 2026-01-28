"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type SessionItem = {
  id: number;
  type: "FOCUS" | "SHORT_BREAK" | "LONG_BREAK";
  startedAt: string;
  endedAt: string;
  durationSec: number;
  labelId: number | null;
  label?: { id: number; name: string } | null;
};

function toISODateLocal(d: Date): string {
  // YYYY-MM-DD in local time
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatTimeLocal(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function LogsPage() {
  const [date, setDate] = useState(() => toISODateLocal(new Date()));
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadSessions(nextDate: string) {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/sessions?date=${nextDate}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`GET /api/sessions failed (${res.status})`);

      const data = (await res.json()) as SessionItem[];
      setSessions(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load sessions");
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSessions(date);
  }, [date]);

  const totalMinutes = useMemo(() => {
    const totalSec = sessions.reduce((acc, s) => acc + (s.durationSec ?? 0), 0);
    return Math.round(totalSec / 60);
  }, [sessions]);

  async function handleDelete(id: number) {
    // optimistic UI: remove immediately, rollback if fails
    const prev = sessions;
    setSessions((cur) => cur.filter((s) => s.id !== id));

    try {
      const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      if (!res.ok) {
        // rollback
        setSessions(prev);
        throw new Error(`DELETE failed (${res.status})`);
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete session");
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Logs</h1>
          <div className="text-sm opacity-70">View focus sessions by day</div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm opacity-70">Date</div>
          <input
            className="border rounded-md px-3 py-2 bg-transparent"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      <Card className="p-4 flex items-center justify-between">
        <div className="text-sm opacity-70">Total focus minutes</div>
        <div className="text-xl font-semibold tabular-nums">{totalMinutes} min</div>
      </Card>

      {error && (
        <Card className="p-4 border border-red-500/30">
          <div className="text-sm text-red-500">{error}</div>
        </Card>
      )}

      <Card className="p-4">
        {loading ? (
          <div className="text-sm opacity-70">Loading sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="text-sm opacity-70">No sessions for this day.</div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => {
              const minutes = Math.round(s.durationSec / 60);
              const labelName = s.label?.name ?? "No label";

              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-4 border-b last:border-b-0 pb-3 last:pb-0"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      {labelName} <span className="opacity-60">·</span>{" "}
                      {formatTimeLocal(s.startedAt)}
                    </div>
                    <div className="text-sm opacity-70">
                      {minutes} min
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(s.id)}
                  >
                    Delete
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

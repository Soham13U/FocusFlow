"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { FocusPerDayChart } from "@/components/Reports/FocusPerDayChart";

import { Button } from "@/components/ui/button";

type ReportDTO = {
  totalMinutes: number;
  perDay: { date: string; minutes: number }[];
  perHour: { hour: number; minutes: number }[];
  topLabels: { label: string; minutes: number }[];
};

export default function ReportsPage() {
  const [range, setRange] = useState<7 | 30>(7);
  const [data, setData] = useState<ReportDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(nextRange: 7 | 30) {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/reports?range=${nextRange}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`GET /api/reports failed (${res.status})`);

      const json = (await res.json()) as ReportDTO;
      setData(json);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load reports");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(range);
  }, [range]);

  const avgPerDay = useMemo(() => {
    if (!data) return 0;
    return Math.round(data.totalMinutes / range);
  }, [data, range]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Reports</h1>
          <div className="text-sm opacity-70">Insights for the last {range} days</div>
        </div>

        <div className="flex gap-2">
          <Button
            variant={range === 7 ? "default" : "outline"}
            onClick={() => setRange(7)}
            disabled={loading}
          >
            7 days
          </Button>
          <Button
            variant={range === 30 ? "default" : "outline"}
            onClick={() => setRange(30)}
            disabled={loading}
          >
            30 days
          </Button>
        </div>
      </div>

      {error && (
        <Card className="p-4 border border-red-500/30">
          <div className="text-sm text-red-500">{error}</div>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4 flex items-center justify-between">
          <div className="text-sm opacity-70">Total focus minutes</div>
          <div className="text-xl font-semibold tabular-nums">
            {loading ? "…" : data?.totalMinutes ?? 0} min
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div className="text-sm opacity-70">Avg minutes/day</div>
          <div className="text-xl font-semibold tabular-nums">
            {loading ? "…" : avgPerDay} min
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Per day */}
        <Card className="p-4">
          <div className="font-medium mb-3">Minutes per day</div>
          {loading ? (
            <div className="text-sm opacity-70">Loading…</div>
          ) : !data ? (
            <div className="text-sm opacity-70">No data</div>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-auto pr-2">
              {data.perDay.slice().reverse().map((d) => (
                <div key={d.date} className="flex items-center justify-between text-sm">
                  <div className="opacity-70 tabular-nums">{d.date}</div>
                  <div className="font-medium tabular-nums">{d.minutes} min</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* By hour */}
        <Card className="p-4">
          <div className="font-medium mb-3">Minutes by hour</div>
          {loading ? (
            <div className="text-sm opacity-70">Loading…</div>
          ) : !data ? (
            <div className="text-sm opacity-70">No data</div>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-auto pr-2">
              {data.perHour.map((h) => (
                <div key={h.hour} className="flex items-center justify-between text-sm">
                  <div className="opacity-70 tabular-nums">
                    {String(h.hour).padStart(2, "0")}:00
                  </div>
                  <div className="font-medium tabular-nums">{h.minutes} min</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Top labels */}
        <Card className="p-4">
          <div className="font-medium mb-3">Top labels</div>
          {loading ? (
            <div className="text-sm opacity-70">Loading…</div>
          ) : !data ? (
            <div className="text-sm opacity-70">No data</div>
          ) : data.topLabels.length === 0 ? (
            <div className="text-sm opacity-70">No sessions yet.</div>
          ) : (
            <div className="space-y-2">
              {data.topLabels.map((x) => (
                <div key={x.label} className="flex items-center justify-between text-sm">
                  <div className="truncate opacity-70">{x.label}</div>
                  <div className="font-medium tabular-nums">{x.minutes} min</div>
                </div>
              ))}
            </div>
          )}
        </Card>
        {data && <FocusPerDayChart data={data.perDay} />}

      </div>
    </div>
  );
}

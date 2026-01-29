import { prisma } from "@/lib/db/prisma";

export async function getReports(rangeDays: 7 | 30) {
  const now = new Date();
  const start = new Date();
  start.setDate(start.getDate() - rangeDays + 1);
  start.setHours(0, 0, 0, 0);

  const sessions = await prisma.session.findMany({
    where: {
      type: "FOCUS",
      startedAt: { gte: start },
    },
    include: { label: true },
  });

  // ---- total minutes
  const totalMinutes = Math.round(
    sessions.reduce((acc, s) => acc + s.durationSec, 0) / 60
  );

  // ---- per day
  const perDayMap = new Map<string, number>();

  for (let i = 0; i < rangeDays; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    perDayMap.set(key, 0);
  }

  sessions.forEach((s) => {
    const key = s.startedAt.toISOString().slice(0, 10);
    perDayMap.set(key, (perDayMap.get(key) ?? 0) + s.durationSec);
  });

  const perDay = Array.from(perDayMap.entries()).map(([date, sec]) => ({
    date,
    minutes: Math.round(sec / 60),
  }));

  // ---- per hour
  const perHour = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    minutes: 0,
  }));

  sessions.forEach((s) => {
    const hour = s.startedAt.getHours();
    perHour[hour].minutes += s.durationSec / 60;
  });

  perHour.forEach((h) => {
    h.minutes = Math.round(h.minutes);
  });

  // ---- top labels
  const labelMap = new Map<string, number>();

  sessions.forEach((s) => {
    const name = s.label?.name ?? "No label";
    labelMap.set(name, (labelMap.get(name) ?? 0) + s.durationSec);
  });

  const topLabels = Array.from(labelMap.entries())
    .map(([label, sec]) => ({
      label,
      minutes: Math.round(sec / 60),
    }))
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 5);

  return {
    totalMinutes,
    perDay,
    perHour,
    topLabels,
  };
}

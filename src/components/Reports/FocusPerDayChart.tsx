"use client";

import * as React from "react";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

type Point = { date: string; minutes: number };

const chartConfig = {
  minutes: {
    label: "Focus (min)",
  },
} satisfies ChartConfig;

export function FocusPerDayChart({ data }: { data: Point[] }) {
  // recharts likes stable keys; also shorten the date for the axis
  const chartData = React.useMemo(
    () =>
      data.map((d) => ({
        ...d,
        day: d.date.slice(5), // "MM-DD"
      })),
    [data]
  );

  return (
    <ChartContainer config={chartConfig} className="h-44 w-full">
      <LineChart data={chartData} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="day" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} width={32} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line type="monotone" dataKey="minutes" dot={false} strokeWidth={2} />
      </LineChart>
    </ChartContainer>
  );
}

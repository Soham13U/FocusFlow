import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, getSessionsByDate } from "@/lib/services/sessions";
import { SessionType } from "@prisma/client";

const getSessionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
});

const createSessionSchema = z.object({
  type: z.nativeEnum(SessionType),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime(),
  durationSec: z.number().int().positive(),
  labelId: z.number().int().positive().nullable().optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = getSessionSchema.safeParse({
    date: url.searchParams.get("date"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid date query" }, { status: 400 });
  }

  try {
    const sessions = await getSessionsByDate(parsed.data.date);
    return NextResponse.json(sessions);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);

  const parsed = createSessionSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid Request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { type, startedAt, endedAt, durationSec, labelId } = parsed.data;

  const start = new Date(startedAt);
  const end = new Date(endedAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return NextResponse.json(
      { error: "endedAt must be after startedAt" },
      { status: 400 },
    );
  }

  try {
    const session = await createSession({
      type,
      startedAt: start,
      endedAt: end,
      durationSec,
      labelId: labelId ?? null,
    });
    return NextResponse.json(session, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

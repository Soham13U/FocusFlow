import { NextResponse } from "next/server";
import { z } from "zod";
import { getReports } from "@/lib/services/reports";

const schema = z.object({
  range: z.coerce.number().refine((v) => v === 7 || v === 30),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = schema.safeParse({
    range: url.searchParams.get("range"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "range must be 7 or 30" },
      { status: 400 }
    );
  }

  try {
    const data = await getReports(parsed.data.range as 7 | 30);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

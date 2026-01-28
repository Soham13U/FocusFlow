import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteSessionById } from "@/lib/services/sessions";

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  const parsed = paramsSchema.safeParse({ id });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    await deleteSessionById(parsed.data.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

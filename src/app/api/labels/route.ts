import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createLabel,getAllLabels } from "@/lib/services/labels";
import { z } from "zod";

export async function GET() {
  const labels = await getAllLabels();
  return NextResponse.json(labels);
}


const createLabelSchema = z.object({
  name: z.string().trim().min(1,"Label name is required").max(40,"Max 40 chars"),
});

export async function POST(req: Request)
{
  const json = await req.json().catch(()=>null);

  const parsed = createLabelSchema.safeParse(json);
  if(!parsed.success)
  {
    return NextResponse.json(
      {error: "Invalid request", details: parsed.error.flatten()},
      {status: 400}
    );
  }
  try{
    const label = await createLabel(parsed.data.name);

    return NextResponse.json(label, {status: 201});
     }
     catch(err: any)
     {
      // prisma unique constraint (dup name)
      if(err?.code === "P2002")
      {
        return NextResponse.json(
          {error: "Label already exists"},
          {status: 409}
        );
      }
     

     // service defensive error (empty after trim, etc.)
    if (err instanceof Error && err.message.includes("cannot be empty")) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

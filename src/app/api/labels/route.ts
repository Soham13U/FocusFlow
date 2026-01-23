import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const labels = await prisma.label.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(labels);
}

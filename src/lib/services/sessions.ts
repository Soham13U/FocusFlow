import { SessionType,Session } from "@prisma/client"
import { prisma } from "@/lib/db/prisma";
import { string } from "zod";



export type CreateSessionInput = {
    type: SessionType;
    startedAt: Date;
    endedAt: Date;
    durationSec: number;
    labelId?: number | null;
};

export async function createSession(input: CreateSessionInput): Promise<Session>{
    return prisma.session.create({
        data:{
            type: input.type,
            startedAt: input.startedAt,
            endedAt: input.endedAt,
            durationSec: input.durationSec,
            labelId: input.labelId ?? null,
        },
    });
}

export async function getSessionsByDate(dateISO: string) {
    //date ISO -> yyyy-mm-dd
    const start = new Date(`${dateISO}T00:00:00.000`);
    const end = new Date(`${dateISO}T23:59:59.999`);

    return prisma.session.findMany({
        where:{
            startedAt: {gte: start, lte: end},
            type: "FOCUS",
        },
        orderBy: {startedAt: "desc"},
        include: {label: true},
    });

}
export async function deleteSessionById(id: number) {
  return prisma.session.delete({
    where: { id },
  });
}
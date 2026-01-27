import { SessionType,Session } from "@prisma/client"
import { prisma } from "@/lib/db/prisma";



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
import {prisma} from "@/lib/db/prisma";
import type { Label } from "@prisma/client";


export async function getAllLabels(): Promise<Label[]>
{
    return prisma.label.findMany({
        orderBy: {createdAt: "desc"},
    });
}

export async function createLabel(name: string): Promise<Label>
{
    const clean = name.trim();

    if(!clean) throw new Error("Label cannot be empty");

    return prisma.label.create({
        data: {name: clean},
    });
}


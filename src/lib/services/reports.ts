import { prisma } from "@/lib/db/prisma";


export async function getReports(rangeDays: 7|30)
{
    const now = new Date();
    const start = new Date();
    start.setDate(start.getDate() - rangeDays + 1);
    start.setHours(0,0,0,0);

    const sessions = await prisma.session.findMany({
        where:{
            type: "FOCUS",
            startedAt:{gte: start},
        },
        include: {label: true},
    });
}
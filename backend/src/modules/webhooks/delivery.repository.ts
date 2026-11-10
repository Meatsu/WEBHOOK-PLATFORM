import { prisma } from '../../infrastructure/database/prisma';

const listFields = {
    id: true,
    webhookId: true,
    endpointName: true,
    status: true,
    responseStatus: true,
    durationMs: true,
    createdAt: true
} as const;

const detailFields = {
    ...listFields,
    targetUrl: true,
    payload: true,
    responseBody: true,
    error: true
} as const;

export const listDeliveries = (userId: string) =>
    prisma.delivery.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: listFields
    });

export const findDelivery = (id: string, userId: string) =>
    prisma.delivery.findFirst({
        where: { id, userId },
        select: detailFields
    });

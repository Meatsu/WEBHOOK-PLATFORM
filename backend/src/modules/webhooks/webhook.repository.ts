import { prisma } from '../../infrastructure/database/prisma';

const webhookFields = {
    id: true,
    name: true,
    targetUrl: true,
    createdAt: true,
    updatedAt: true
} as const;

export const listWebhooks = (userId: string) =>
    prisma.webhook.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: webhookFields
    });

export const findWebhook = (id: string, userId: string) =>
    prisma.webhook.findFirst({
        where: { id, userId },
        select: webhookFields
    });

export const createWebhook = (
    userId: string,
    data: { name: string; targetUrl: string }
) =>
    prisma.webhook.create({
        data: { ...data, userId },
        select: webhookFields
    });

export const updateWebhook = (
    id: string,
    userId: string,
    data: { name?: string; targetUrl?: string }
) =>
    prisma.webhook.updateMany({
        where: { id, userId },
        data
    });

export const deleteWebhook = (id: string, userId: string) =>
    prisma.webhook.deleteMany({
        where: { id, userId }
    });

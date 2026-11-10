import type { Prisma } from '../../../generated/prisma/client';
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
    error: true,
    attempts: {
        orderBy: { attemptNumber: 'asc' as const },
        select: {
            id: true,
            attemptNumber: true,
            status: true,
            responseStatus: true,
            responseBody: true,
            error: true,
            durationMs: true,
            createdAt: true
        }
    }
} as const;

export const listDeliveries = async (userId: string) => {
    const deliveries = await prisma.delivery.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
            ...listFields,
            _count: { select: { attempts: true } }
        }
    });
    return deliveries.map(({ _count, ...delivery }) => ({
        ...delivery,
        attemptCount: _count.attempts
    }));
};

export const findDelivery = async (id: string, userId: string) => {
    const delivery = await prisma.delivery.findFirst({
        where: { id, userId },
        select: {
            ...detailFields,
            _count: { select: { attempts: true } }
        }
    });
    if (!delivery) return null;
    const { _count, ...details } = delivery;
    return { ...details, attemptCount: _count.attempts };
};

export const findWebhookForDelivery = (id: string, userId: string) =>
    prisma.webhook.findFirst({
        where: { id, userId },
        select: { id: true, name: true, targetUrl: true }
    });

export const createDelivery = (data: {
    userId: string;
    webhookId: string;
    endpointName: string;
    targetUrl: string;
    payload: Prisma.InputJsonValue;
}) =>
    prisma.delivery.create({
        data,
        select: listFields
    });

export const markDeliveryQueueFailure = (id: string, error: string) =>
    prisma.delivery.update({
        where: { id },
        data: { status: 'FAILED', error: error.slice(0, 500) }
    });

export const prepareDeliveryRetry = (id: string, userId: string) =>
    prisma.delivery.updateMany({
        where: { id, userId, status: 'FAILED' },
        data: {
            status: 'PENDING',
            retryGeneration: { increment: 1 },
            responseStatus: null,
            responseBody: null,
            error: null,
            durationMs: 0
        }
    });

export const findDeliveryRetryGeneration = async (id: string) =>
    prisma.delivery.findUnique({
        where: { id },
        select: { retryGeneration: true }
    });

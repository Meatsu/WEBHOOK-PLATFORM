import type { Job } from 'bullmq';
import type { DeliveryJobData } from './delivery-queue';
import { prisma } from '../../infrastructure/database/prisma';
import { enqueueDelivery } from './delivery-queue';
import { DeliveryRequestError, attemptWebhookDelivery } from './webhook-delivery';

const isRetryableStatus = (status: number) =>
    status === 408 || status === 425 || status === 429 || status >= 500;

const recordFailure = async (
    deliveryId: string,
    attemptId: string,
    attemptNumber: number,
    error: string,
    durationMs: number,
    response?: { status: number; body: string },
    willRetry = false
) => {
    await prisma.$transaction([
        prisma.deliveryAttempt.update({
            where: { id: attemptId },
            data: {
                status: 'FAILED',
                responseStatus: response?.status,
                responseBody: response?.body.slice(0, 4_096),
                error: error.slice(0, 500),
                durationMs
            }
        }),
        prisma.delivery.update({
            where: { id: deliveryId },
            data: {
                status: willRetry ? 'PENDING' : 'FAILED',
                responseStatus: response?.status,
                responseBody: response?.body.slice(0, 4_096),
                error: error.slice(0, 500),
                durationMs
            }
        })
    ]);

    console.warn(
        `Webhook delivery ${deliveryId} attempt ${attemptNumber} failed: ${error}`
    );
};

export const processDelivery = async (job: Job<DeliveryJobData>) => {
    const delivery = await prisma.delivery.findUnique({
        where: { id: job.data.deliveryId }
    });
    if (!delivery || delivery.status !== 'PENDING') {
        return;
    }

    const attemptNumber = await prisma.deliveryAttempt.count({
        where: { deliveryId: delivery.id }
    }) + 1;
    const attempt = await prisma.deliveryAttempt.create({
        data: {
            deliveryId: delivery.id,
            attemptNumber,
            status: 'STARTED'
        },
        select: { id: true }
    });
    const startedAt = Date.now();

    let response: { status: number; body: string };
    try {
        response = await attemptWebhookDelivery(
            delivery.targetUrl,
            delivery.id,
            delivery.payload
        );
    } catch (error) {
        if (!(error instanceof DeliveryRequestError)) {
            throw error;
        }

        const willRetry = error.retryable &&
            job.attemptsMade + 1 < (job.opts.attempts ?? 1);
        await recordFailure(
            delivery.id,
            attempt.id,
            attemptNumber,
            error.message,
            Date.now() - startedAt,
            undefined,
            willRetry
        );
        if (willRetry) {
            throw error;
        }
        return;
    }

    const durationMs = Date.now() - startedAt;
    if (response.status >= 200 && response.status < 300) {
        await prisma.$transaction([
            prisma.deliveryAttempt.update({
                where: { id: attempt.id },
                data: {
                    status: 'SUCCEEDED',
                    responseStatus: response.status,
                    responseBody: response.body.slice(0, 4_096),
                    durationMs
                }
            }),
            prisma.delivery.update({
                where: { id: delivery.id },
                data: {
                    status: 'SUCCEEDED',
                    responseStatus: response.status,
                    responseBody: response.body.slice(0, 4_096),
                    error: null,
                    durationMs
                }
            })
        ]);
        return;
    }

    const retryable = isRetryableStatus(response.status);
    const error = `Endpoint returned HTTP ${response.status}.`;
    const willRetry = retryable &&
        job.attemptsMade + 1 < (job.opts.attempts ?? 1);
    await recordFailure(
        delivery.id,
        attempt.id,
        attemptNumber,
        error,
        durationMs,
        response,
        willRetry
    );
    if (willRetry) {
        throw new DeliveryRequestError(error, true);
    }
};

export const enqueuePendingDeliveries = async () => {
    let cursor: string | undefined;
    while (true) {
        const pending = await prisma.delivery.findMany({
            where: { status: 'PENDING' },
            orderBy: { id: 'asc' },
            take: 100,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            select: { id: true, retryGeneration: true }
        });
        if (pending.length === 0) return;

        await Promise.all(pending.map((delivery) =>
            enqueueDelivery(delivery.id, delivery.retryGeneration)
        ));
        cursor = pending[pending.length - 1].id;
    }
};

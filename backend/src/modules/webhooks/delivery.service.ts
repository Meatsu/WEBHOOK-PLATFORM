import type { Prisma } from '../../../generated/prisma/client';
import { prisma } from '../../infrastructure/database/prisma';
import { ApiError } from '../../middleware/error-handler';
import { enqueueDelivery } from './delivery-queue';
import {
    createDelivery,
    findDelivery,
    findDeliveryRetryGeneration,
    findWebhookForDelivery,
    markDeliveryQueueFailure,
    prepareDeliveryRetry
} from './delivery.repository';

const getErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : 'Redis rejected the delivery job.';

export const queueTestDelivery = async (
    userId: string,
    webhookId: string,
    payload: Prisma.InputJsonValue
) => {
    const webhook = await findWebhookForDelivery(webhookId, userId);
    if (!webhook) {
        throw new ApiError(404, 'Webhook endpoint not found.');
    }

    const delivery = await createDelivery({
        userId,
        webhookId: webhook.id,
        endpointName: webhook.name,
        targetUrl: webhook.targetUrl,
        payload
    });

    try {
        await enqueueDelivery(delivery.id);
    } catch (error) {
        const message = `Delivery could not be queued: ${getErrorMessage(error)}`;
        await markDeliveryQueueFailure(delivery.id, message);
        throw new ApiError(503, 'Delivery queue is unavailable. The failed event was recorded.');
    }

    return { ...delivery, attemptCount: 0 };
};

export const retryDelivery = async (deliveryId: string, userId: string) => {
    const existing = await findDelivery(deliveryId, userId);
    if (!existing) {
        throw new ApiError(404, 'Event not found.');
    }
    if (existing.status !== 'FAILED') {
        throw new ApiError(409, 'Only failed deliveries can be retried.');
    }

    const changed = await prepareDeliveryRetry(deliveryId, userId);
    if (changed.count === 0) {
        throw new ApiError(409, 'This delivery is no longer available to retry.');
    }

    const queueData = await findDeliveryRetryGeneration(deliveryId);
    if (!queueData) {
        throw new Error('Delivery disappeared after retry was claimed.');
    }

    try {
        await enqueueDelivery(deliveryId, queueData.retryGeneration);
    } catch (error) {
        const message = `Retry could not be queued: ${getErrorMessage(error)}`;
        await markDeliveryQueueFailure(deliveryId, message);
        throw new ApiError(503, 'Delivery queue is unavailable. The failed event can be retried again.');
    }

    const retriedDelivery = await findDelivery(deliveryId, userId);
    if (!retriedDelivery) {
        throw new ApiError(404, 'Event not found.');
    }
    return retriedDelivery;
};

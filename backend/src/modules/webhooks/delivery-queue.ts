import { Queue } from 'bullmq';
import { redisProducerConnection } from '../../infrastructure/queue/redis';

export const deliveryQueueName = 'webhook-deliveries';
export const maxDeliveryAttempts = 3;

export type DeliveryJobData = {
    deliveryId: string;
};

const deliveryQueue = new Queue<DeliveryJobData>(deliveryQueueName, {
    connection: redisProducerConnection,
    defaultJobOptions: {
        attempts: maxDeliveryAttempts,
        backoff: { type: 'exponential', delay: 1_000 },
        removeOnComplete: 1_000,
        removeOnFail: true
    }
});

deliveryQueue.on('error', (error) => {
    console.error('Redis delivery queue error:', error);
});

export const enqueueDelivery = async (
    deliveryId: string,
    retryGeneration = 0
): Promise<void> => {
    await deliveryQueue.add(
        'deliver',
        { deliveryId },
        { jobId: `delivery-${deliveryId}-${retryGeneration}` }
    );
};

export const closeDeliveryQueue = () => deliveryQueue.close();

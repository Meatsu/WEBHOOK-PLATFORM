import { Worker } from 'bullmq';
import { prisma } from './infrastructure/database/prisma';
import { redisConnection } from './infrastructure/queue/redis';
import {
    closeDeliveryQueue,
    deliveryQueueName,
    type DeliveryJobData
} from './modules/webhooks/delivery-queue';
import {
    enqueuePendingDeliveries,
    processDelivery
} from './modules/webhooks/delivery-worker';

const worker = new Worker<DeliveryJobData>(
    deliveryQueueName,
    processDelivery,
    { connection: redisConnection }
);

worker.on('failed', (job, error) => {
    console.error(`Delivery job ${job?.id ?? 'unknown'} failed:`, error);
});
worker.on('error', (error) => {
    console.error('Delivery worker error:', error);
});

console.log('Webhook delivery worker is running.');

let recoveryRunning = false;
let recoveryTask: Promise<void> = Promise.resolve();
const reconcilePendingDeliveries = async () => {
    if (recoveryRunning) return;
    recoveryRunning = true;
    recoveryTask = (async () => {
        try {
            await enqueuePendingDeliveries();
        } catch (error) {
            console.error('Could not reconcile pending deliveries:', error);
        } finally {
            recoveryRunning = false;
        }
    })();
    await recoveryTask;
};
const recoveryTimer = setInterval(
    () => void reconcilePendingDeliveries(),
    30_000
);
void reconcilePendingDeliveries();

let shuttingDown = false;
const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`Received ${signal}; shutting down delivery worker.`);
    clearInterval(recoveryTimer);
    try {
        await worker.close();
        await recoveryTask;
        await closeDeliveryQueue();
        await prisma.$disconnect();
    } catch (error) {
        console.error('Failed to shut down delivery worker cleanly:', error);
        process.exitCode = 1;
    }
};

process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));

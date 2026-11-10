import app from './app';
import { prisma } from './infrastructure/database/prisma';
import { closeDeliveryQueue } from './modules/webhooks/delivery-queue';

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

let shuttingDown = false;
const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`Received ${signal}; shutting down API.`);
    server.close(async (error) => {
        try {
            await closeDeliveryQueue();
            await prisma.$disconnect();
            if (error) {
                console.error('HTTP server shutdown failed:', error);
                process.exitCode = 1;
            }
        } catch (shutdownError) {
            console.error('Failed to shut down API cleanly:', shutdownError);
            process.exitCode = 1;
        }
    });
};

process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));

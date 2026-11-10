import type { ConnectionOptions } from 'bullmq';

const redisUrl = new URL(process.env.REDIS_URL ?? 'redis://127.0.0.1:6379');

if (!['redis:', 'rediss:'].includes(redisUrl.protocol) || !redisUrl.hostname) {
    throw new Error('REDIS_URL must be a valid redis:// or rediss:// URL.');
}

const database = redisUrl.pathname.length > 1
    ? Number(redisUrl.pathname.slice(1))
    : 0;
if (!Number.isSafeInteger(database) || database < 0) {
    throw new Error('REDIS_URL must use a non-negative integer database path.');
}

export const redisConnection: ConnectionOptions = {
    host: redisUrl.hostname,
    port: redisUrl.port ? Number(redisUrl.port) : 6379,
    username: redisUrl.username ? decodeURIComponent(redisUrl.username) : undefined,
    password: redisUrl.password ? decodeURIComponent(redisUrl.password) : undefined,
    db: database,
    maxRetriesPerRequest: null,
    ...(redisUrl.protocol === 'rediss:' ? { tls: {} } : {})
};

export const redisProducerConnection: ConnectionOptions = {
    ...redisConnection,
    maxRetriesPerRequest: 1
};

import { z } from 'zod';

const targetUrlSchema = z
    .url()
    .max(2048)
    .refine((value) => {
        const url = new URL(value);
        const standardPort = url.port === '' ||
            url.port === (url.protocol === 'https:' ? '443' : '80');
        return (
            (url.protocol === 'http:' || url.protocol === 'https:') &&
            !url.username &&
            !url.password &&
            standardPort
        );
    });

export const webhookIdSchema = z.object({
    id: z.uuid()
});

export const createWebhookSchema = z.object({
    name: z.string().trim().min(1).max(100),
    targetUrl: targetUrlSchema
});

export const updateWebhookSchema = createWebhookSchema
    .partial()
    .refine((value) => Object.keys(value).length > 0);

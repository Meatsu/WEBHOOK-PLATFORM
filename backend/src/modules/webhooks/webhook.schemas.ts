import { z } from 'zod';

const targetUrlSchema = z
    .url()
    .max(2048)
    .refine((value) => {
        const protocol = new URL(value).protocol;
        return protocol === 'http:' || protocol === 'https:';
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

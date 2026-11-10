import { z } from 'zod';

export const createDeliverySchema = z.object({
    payload: z.record(z.string(), z.json())
});

export const deliveryIdSchema = z.object({
    id: z.uuid()
});

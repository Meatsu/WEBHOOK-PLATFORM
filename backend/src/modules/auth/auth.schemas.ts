import { z } from 'zod';

const commonPasswords = new Set([
    '123456789012',
    '1234567890123',
    'password1234',
    'password12345',
    'qwerty123456',
    'letmein123456',
    'welcome12345',
    'iloveyou1234'
]);

const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(255));

export const registerSchema = z.object({
    email: emailSchema,
    password: z
        .string()
        .min(12)
        .max(128)
        .refine((password) => !commonPasswords.has(password.toLowerCase()))
});

export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1).max(128)
});

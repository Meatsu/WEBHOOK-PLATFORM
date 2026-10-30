import type { Request, RequestHandler } from 'express';
import { ApiError } from '../../middleware/error-handler';
import {
    createWebhookSchema,
    updateWebhookSchema,
    webhookIdSchema
} from './webhook.schemas';
import {
    createWebhook,
    deleteWebhook,
    findWebhook,
    listWebhooks,
    updateWebhook
} from './webhook.repository';

const getUserId = (req: Request): string => {
    if (!req.user) {
        throw new ApiError(401, 'Authentication required.');
    }
    return req.user.id;
};

export const list: RequestHandler = async (req, res) => {
    const webhooks = await listWebhooks(getUserId(req));
    return res.status(200).json({ status: true, data: webhooks });
};

export const get: RequestHandler = async (req, res, next) => {
    const id = webhookIdSchema.safeParse(req.params);
    if (!id.success) {
        return next(new ApiError(400, 'A valid webhook ID is required.'));
    }

    const webhook = await findWebhook(id.data.id, getUserId(req));
    if (!webhook) {
        return next(new ApiError(404, 'Webhook endpoint not found.'));
    }

    return res.status(200).json({ status: true, data: webhook });
};

export const create: RequestHandler = async (req, res, next) => {
    const parsed = createWebhookSchema.safeParse(req.body);
    if (!parsed.success) {
        return next(new ApiError(
            400,
            'Provide a name and a valid HTTP or HTTPS target URL.'
        ));
    }

    const webhook = await createWebhook(getUserId(req), parsed.data);
    return res.status(201).json({ status: true, data: webhook });
};

export const update: RequestHandler = async (req, res, next) => {
    const id = webhookIdSchema.safeParse(req.params);
    if (!id.success) {
        return next(new ApiError(400, 'A valid webhook ID is required.'));
    }

    const parsed = updateWebhookSchema.safeParse(req.body);
    if (!parsed.success) {
        return next(new ApiError(
            400,
            'Provide at least one valid field: name or targetUrl.'
        ));
    }

    const userId = getUserId(req);
    const result = await updateWebhook(id.data.id, userId, parsed.data);
    if (result.count === 0) {
        return next(new ApiError(404, 'Webhook endpoint not found.'));
    }

    const webhook = await findWebhook(id.data.id, userId);
    if (!webhook) {
        return next(new ApiError(404, 'Webhook endpoint not found.'));
    }

    return res.status(200).json({ status: true, data: webhook });
};

export const remove: RequestHandler = async (req, res, next) => {
    const id = webhookIdSchema.safeParse(req.params);
    if (!id.success) {
        return next(new ApiError(400, 'A valid webhook ID is required.'));
    }

    const result = await deleteWebhook(id.data.id, getUserId(req));
    if (result.count === 0) {
        return next(new ApiError(404, 'Webhook endpoint not found.'));
    }

    return res.status(200).json({
        status: true,
        message: 'Webhook endpoint deleted.'
    });
};

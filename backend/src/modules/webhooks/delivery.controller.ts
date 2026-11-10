import type { Request, RequestHandler } from 'express';
import { ApiError } from '../../middleware/error-handler';
import { findDelivery, listDeliveries } from './delivery.repository';
import { deliverTestEvent } from './webhook-delivery';
import { createDeliverySchema, deliveryIdSchema } from './delivery.schemas';

const getUserId = (req: Request): string => {
    if (!req.user) {
        throw new ApiError(401, 'Authentication required.');
    }
    return req.user.id;
};

export const listEvents: RequestHandler = async (req, res) => {
    const events = await listDeliveries(getUserId(req));
    return res.status(200).json({ status: true, data: events });
};

export const getEvent: RequestHandler = async (req, res, next) => {
    const parsedId = deliveryIdSchema.safeParse(req.params);
    if (!parsedId.success) {
        return next(new ApiError(400, 'A valid event ID is required.'));
    }
    const event = await findDelivery(parsedId.data.id, getUserId(req));
    if (!event) {
        return next(new ApiError(404, 'Event not found.'));
    }
    return res.status(200).json({ status: true, data: event });
};

export const sendTestEvent: RequestHandler = async (req, res, next) => {
    const parsedId = deliveryIdSchema.safeParse(req.params);
    if (!parsedId.success) {
        return next(new ApiError(400, 'A valid webhook ID is required.'));
    }
    const parsedBody = createDeliverySchema.safeParse(req.body);
    if (!parsedBody.success) {
        return next(new ApiError(400, 'The event payload must be a JSON object.'));
    }

    const delivery = await deliverTestEvent(
        getUserId(req),
        parsedId.data.id,
        parsedBody.data.payload
    );
    return res.status(201).json({ status: true, data: delivery });
};

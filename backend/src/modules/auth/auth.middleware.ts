import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from '../../middleware/error-handler';
import { findActiveSession } from './auth.repository';
import { getJwtSecret } from './auth.token';

declare global {
    namespace Express {
        interface Request {
            user?: { id: string; sessionId: string };
        }
    }
}

export const requireAuth: RequestHandler = async (req, _res, next) => {
    const authorization = req.get('authorization');
    const [scheme, token] = authorization?.split(' ') ?? [];
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
        return next(new ApiError(401, 'Authentication required.'));
    }

    let payload: string | jwt.JwtPayload;
    try {
        payload = jwt.verify(token, getJwtSecret(), {
            algorithms: ['HS256']
        });
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return next(new ApiError(401, 'Invalid or expired access token.'));
        }
        return next(error);
    }

    if (
        typeof payload !== 'object' ||
        payload === null ||
        typeof payload.sub !== 'string' ||
        typeof payload.jti !== 'string'
    ) {
        return next(new ApiError(401, 'Invalid or expired access token.'));
    }

    const session = await findActiveSession(payload.jti, payload.sub, token);
    if (!session) {
        return next(new ApiError(401, 'Invalid or expired access token.'));
    }

    req.user = { id: payload.sub, sessionId: payload.jti };
    return next();
};

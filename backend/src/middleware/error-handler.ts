import type { ErrorRequestHandler, RequestHandler } from 'express';

export class ApiError extends Error {
    constructor(
        public readonly statusCode: number,
        message: string
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

export const notFoundHandler: RequestHandler = (_req, _res, next) =>
    next(new ApiError(404, 'Route not found.'));

export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    if (
        error instanceof SyntaxError &&
        'status' in error &&
        error.status === 400
    ) {
        return res.status(400).json({
            status: false,
            message: 'Request body contains invalid JSON.'
        });
    }

    if (
        typeof error === 'object' &&
        error !== null &&
        'type' in error &&
        error.type === 'entity.too.large'
    ) {
        return res.status(413).json({
            status: false,
            message: 'Request body exceeds the 1 MB limit.'
        });
    }

    if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
            status: false,
            message: error.message
        });
    }

    console.error('Request failed:', error);
    return res.status(500).json({
        status: false,
        message: 'An unexpected error occurred.'
    });
};

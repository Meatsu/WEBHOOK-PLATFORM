import type { RequestHandler } from 'express';
import { ApiError } from '../../middleware/error-handler';
import { loginSchema, registerSchema } from './auth.schemas';
import {
    AccountAlreadyExistsError,
    loginUser,
    logoutUser,
    registerUser
} from './auth.service';

export const register: RequestHandler = async (req, res, next) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
        return next(new ApiError(
            400,
            'Provide a valid email and a password of at least 12 characters that is not commonly compromised.'
        ));
    }

    try {
        const result = await registerUser(parsed.data.email, parsed.data.password);
        return res.status(201).json({
            status: true,
            message: 'User registered successfully',
            ...result
        });
    } catch (error) {
        if (error instanceof AccountAlreadyExistsError) {
            return next(new ApiError(409, error.message));
        }
        return next(error);
    }
};

export const login: RequestHandler = async (req, res, next) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        return next(new ApiError(400, 'Email and password are required.'));
    }

    try {
        const result = await loginUser(parsed.data.email, parsed.data.password);
        if (!result) {
            return next(new ApiError(401, 'Invalid email or password.'));
        }

        return res.status(200).json({
            status: true,
            message: 'Login successful',
            ...result
        });
    } catch (error) {
        return next(error);
    }
};

export const logout: RequestHandler = async (req, res, next) => {
    if (!req.user) {
        return next(new ApiError(401, 'Authentication required.'));
    }
    await logoutUser(req.user.id, req.user.sessionId);
    return res.status(200).json({
        status: true,
        message: 'Logout successful.'
    });
};

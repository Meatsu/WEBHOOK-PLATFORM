import argon2 from 'argon2';
import type { RequestHandler } from 'express';

interface AuthRequestBody {
    email?: unknown;
    password?: unknown;
}

const getErrorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : String(error);

export const register: RequestHandler = async (req, res) => {
    const { email, password } = (req.body ?? {}) as AuthRequestBody;

    if (
        typeof email !== 'string' ||
        !email.trim() ||
        typeof password !== 'string' ||
        !password
    ) {
        return res.status(400).json({
            status: false,
            message: 'Email and password are required'
        });
    }

    try {
        const hashedPassword = await argon2.hash(password);

        res.status(201).json({
            status: true,
            message: 'User registered successfully',
            user: {
                email,
                passwordHash: hashedPassword
            }
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: 'Failed to register user',
            error: getErrorMessage(error)
        });
    }
};

export const login: RequestHandler = async (req, res) => {
    const { email, password } = (req.body ?? {}) as AuthRequestBody;

    if (
        typeof email !== 'string' ||
        !email.trim() ||
        typeof password !== 'string' ||
        !password
    ) {
        return res.status(400).json({
            status: false,
            message: 'Email and password are required'
        });
    }

    try {
        // TODO: Find the user by email in your database.
        // TODO: Verify the submitted password using argon2.verify().
        // TODO: Return an appropriate login response.
        return res.status(501).json({
            status: false,
            message: 'Login is not implemented yet'
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: 'Failed to login user',
            error: getErrorMessage(error)
        });
    }
};

export const logout: RequestHandler = (_req, res) => {
    res.status(200).json({
        status: true,
        message: 'User logged out successfully'
    });
};
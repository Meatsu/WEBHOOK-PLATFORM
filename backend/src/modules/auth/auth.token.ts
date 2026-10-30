import { createHash } from 'node:crypto';
import jwt from 'jsonwebtoken';

export const getJwtSecret = (): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
        throw new Error('JWT_SECRET must contain at least 32 bytes.');
    }
    return secret;
};

export const createAccessToken = (userId: string, sessionId: string): string =>
    jwt.sign({}, getJwtSecret(), {
        algorithm: 'HS256',
        subject: userId,
        jwtid: sessionId,
        expiresIn: '15m'
    });

export const hashAccessToken = (token: string): string =>
    createHash('sha256').update(token).digest('hex');

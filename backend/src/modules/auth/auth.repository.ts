import { prisma } from '../../infrastructure/database/prisma';
import { hashAccessToken } from './auth.token';

export const findUserIdByEmail = (email: string) =>
    prisma.user.findUnique({
        where: { email },
        select: { id: true }
    });

export const findUserCredentialsByEmail = (email: string) =>
    prisma.user.findUnique({
        where: { email }
    });

export const createUser = (email: string, passwordHash: string) =>
    prisma.user.create({
        data: { email, passwordHash },
        select: { id: true, email: true }
    });

export const createSession = (
    id: string,
    userId: string,
    token: string,
    expiresAt: Date
) =>
    prisma.session.create({
        data: {
            id,
            userId,
            accessTokenHash: hashAccessToken(token),
            expiresAt
        },
        select: { id: true }
    });

export const findActiveSession = (id: string, userId: string, token: string) =>
    prisma.session.findFirst({
        where: {
            id,
            userId,
            accessTokenHash: hashAccessToken(token),
            revokedAt: null,
            expiresAt: { gt: new Date() }
        },
        select: { id: true }
    });

export const revokeSession = (id: string, userId: string) =>
    prisma.session.updateMany({
        where: { id, userId, revokedAt: null },
        data: { revokedAt: new Date() }
    });

import { randomUUID } from 'node:crypto';
import argon2 from 'argon2';
import {
    createSession,
    createUser,
    findUserCredentialsByEmail,
    findUserIdByEmail,
    revokeSession
} from './auth.repository';
import { createAccessToken, getJwtSecret } from './auth.token';

export class AccountAlreadyExistsError extends Error {
    constructor() {
        super('An account with this email already exists.');
        this.name = 'AccountAlreadyExistsError';
    }
}

const issueAccessToken = async (userId: string): Promise<string> => {
    const sessionId = randomUUID();
    const token = createAccessToken(userId, sessionId);
    await createSession(
        sessionId,
        userId,
        token,
        new Date(Date.now() + 15 * 60 * 1000)
    );
    return token;
};

const isUniqueConstraintError = (error: unknown): boolean =>
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002';

export const registerUser = async (email: string, password: string) => {
    getJwtSecret();
    const existingUser = await findUserIdByEmail(email);
    if (existingUser) {
        throw new AccountAlreadyExistsError();
    }

    const passwordHash = await argon2.hash(password, {
        type: argon2.argon2id
    });

    let user: Awaited<ReturnType<typeof createUser>>;
    try {
        user = await createUser(email, passwordHash);
    } catch (error) {
        if (isUniqueConstraintError(error)) {
            throw new AccountAlreadyExistsError();
        }
        throw error;
    }

    return { user, token: await issueAccessToken(user.id) };
};

export const loginUser = async (email: string, password: string) => {
    getJwtSecret();
    const user = await findUserCredentialsByEmail(email);
    if (!user || !(await argon2.verify(user.passwordHash, password))) {
        return null;
    }

    return {
        user: { id: user.id, email: user.email },
        token: await issueAccessToken(user.id)
    };
};

export const logoutUser = (userId: string, sessionId: string) =>
    revokeSession(sessionId, userId);

import assert from 'node:assert/strict';
import test from 'node:test';
import { loginSchema, registerSchema } from './auth.schemas';

test('registration normalizes email and accepts a strong password', () => {
    const result = registerSchema.safeParse({
        email: '  USER@example.com ',
        password: 'a-unique-example-password'
    });

    assert.equal(result.success, true);
    if (result.success) {
        assert.equal(result.data.email, 'user@example.com');
    }
});

test('registration rejects common passwords and invalid email', () => {
    assert.equal(registerSchema.safeParse({
        email: 'user@example.com',
        password: 'password1234'
    }).success, false);
    assert.equal(registerSchema.safeParse({
        email: 'not-an-email',
        password: 'a-unique-example-password'
    }).success, false);
});

test('login accepts normalized email and a bounded non-empty password', () => {
    assert.equal(loginSchema.safeParse({
        email: 'USER@example.com',
        password: 'anything'
    }).success, true);
    assert.equal(loginSchema.safeParse({
        email: 'user@example.com',
        password: ''
    }).success, false);
});

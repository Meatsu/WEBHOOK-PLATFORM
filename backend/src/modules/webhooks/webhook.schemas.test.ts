import assert from 'node:assert/strict';
import test from 'node:test';
import {
    createWebhookSchema,
    updateWebhookSchema,
    webhookIdSchema
} from './webhook.schemas';

test('webhook creation validates and trims endpoint names', () => {
    const result = createWebhookSchema.safeParse({
        name: '  Deploy events ',
        targetUrl: 'https://hooks.example.com/deploy'
    });

    assert.equal(result.success, true);
    if (result.success) {
        assert.equal(result.data.name, 'Deploy events');
    }
});

test('webhook URLs must use HTTP or HTTPS', () => {
    assert.equal(createWebhookSchema.safeParse({
        name: 'Deploy events',
        targetUrl: 'ftp://hooks.example.com/deploy'
    }).success, false);
});

test('webhook updates require a valid UUID and at least one valid field', () => {
    assert.equal(webhookIdSchema.safeParse({
        id: 'not-a-uuid'
    }).success, false);
    assert.equal(updateWebhookSchema.safeParse({}).success, false);
    assert.equal(updateWebhookSchema.safeParse({
        name: 'Renamed'
    }).success, true);
});

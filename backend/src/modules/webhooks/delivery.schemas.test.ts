import assert from 'node:assert/strict';
import test from 'node:test';
import { createDeliverySchema } from './delivery.schemas';

test('delivery payload accepts nested JSON objects', () => {
    assert.equal(createDeliverySchema.safeParse({
        payload: {
            event: 'order.created',
            data: { orderId: 'ord_123', tags: ['new', 'paid'] }
        }
    }).success, true);
});

test('delivery payload must be a JSON object rather than an array or primitive', () => {
    for (const payload of [null, [], 'event', 42]) {
        assert.equal(createDeliverySchema.safeParse({ payload }).success, false);
    }
});

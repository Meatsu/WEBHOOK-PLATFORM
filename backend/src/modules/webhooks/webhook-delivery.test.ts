import assert from 'node:assert/strict';
import test from 'node:test';
import {
    hasOnlyPublicAddresses,
    isPublicAddress
} from './webhook-delivery';

test('public destination checks reject private, local, and reserved IPv4 addresses', () => {
    assert.equal(isPublicAddress('8.8.8.8', 4), true);
    for (const address of [
        '10.0.0.1',
        '127.0.0.1',
        '169.254.1.1',
        '192.0.2.12',
        '192.168.1.1',
        '224.0.0.1'
    ]) {
        assert.equal(isPublicAddress(address, 4), false, address);
    }
});

test('public destination checks allow global IPv6 and reject non-public ranges', () => {
    assert.equal(isPublicAddress('2606:4700:4700::1111', 6), true);
    for (const address of [
        '::1',
        '::ffff:127.0.0.1',
        '2001:db8::1',
        'fd00::1',
        'fe80::1'
    ]) {
        assert.equal(isPublicAddress(address, 6), false, address);
    }
});

test('every DNS answer must be public before an endpoint is accepted', () => {
    assert.equal(hasOnlyPublicAddresses([
        { address: '8.8.8.8', family: 4 },
        { address: '2606:4700:4700::1111', family: 6 }
    ]), true);
    assert.equal(hasOnlyPublicAddresses([
        { address: '8.8.8.8', family: 4 },
        { address: '127.0.0.1', family: 4 }
    ]), false);
    assert.equal(hasOnlyPublicAddresses([]), false);
});

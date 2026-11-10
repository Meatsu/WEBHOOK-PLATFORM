import { BlockList, isIP } from 'node:net';
import { lookup } from 'node:dns/promises';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import type { IncomingMessage, RequestOptions } from 'node:http';

const requestTimeoutMs = 8_000;
const responseLimitBytes = 4_096;
const blockedAddresses = new BlockList();

const addSubnets = (
    blockList: BlockList,
    ranges: string[],
    family: 'ipv4' | 'ipv6'
) => {
    for (const range of ranges) {
        const [address, prefix] = range.split('/');
        blockList.addSubnet(address, Number(prefix), family);
    }
};

addSubnets(blockedAddresses, [
    '0.0.0.0/8',
    '10.0.0.0/8',
    '100.64.0.0/10',
    '127.0.0.0/8',
    '169.254.0.0/16',
    '172.16.0.0/12',
    '192.0.0.0/24',
    '192.0.2.0/24',
    '192.88.99.0/24',
    '192.168.0.0/16',
    '198.18.0.0/15',
    '198.51.100.0/24',
    '203.0.113.0/24',
    '224.0.0.0/4',
    '240.0.0.0/4'
], 'ipv4');

addSubnets(blockedAddresses, [
    '::/128',
    '::1/128',
    '64:ff9b::/96',
    '100::/64',
    '2001::/23',
    '2001:db8::/32',
    '2002::/16',
    'fc00::/7',
    'fe80::/10',
    'ff00::/8'
], 'ipv6');

const allowedIpv6Addresses = new BlockList();
allowedIpv6Addresses.addSubnet('2000::', 3, 'ipv6');

export const isPublicAddress = (address: string, family: number) => {
    if (family === 4) {
        return !blockedAddresses.check(address, 'ipv4');
    }
    return family === 6 &&
        allowedIpv6Addresses.check(address, 'ipv6') &&
        !blockedAddresses.check(address, 'ipv6');
};

export const hasOnlyPublicAddresses = (
    addresses: readonly { address: string; family: number }[]
) =>
    addresses.length > 0 &&
    addresses.every((entry) => isPublicAddress(entry.address, entry.family));

const readResponse = (response: IncomingMessage): Promise<string> =>
    new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        let totalBytes = 0;
        response.on('data', (chunk: Buffer | string) => {
            const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            totalBytes += buffer.length;
            if (totalBytes > responseLimitBytes) {
                response.destroy(new Error('Response body exceeded the limit.'));
                return;
            }
            chunks.push(buffer);
        });
        response.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        response.on('error', reject);
    });

const sendRequest = (
    url: URL,
    address: string,
    family: number,
    deliveryId: string,
    payload: unknown
): Promise<{ status: number; body: string }> =>
    new Promise((resolve, reject) => {
        const transport = url.protocol === 'https:' ? httpsRequest : httpRequest;
        const body = JSON.stringify(payload);
        const options: RequestOptions = {
            protocol: url.protocol,
            hostname: url.hostname.replace(/^\[|\]$/g, ''),
            port: url.port || undefined,
            path: `${url.pathname}${url.search}`,
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'content-length': Buffer.byteLength(body),
                'user-agent': 'WebhookPlatform/1.0',
                'x-webhook-delivery-id': deliveryId
            },
            lookup: (_hostname, _options, callback) => {
                callback(null, address, family);
            },
            timeout: requestTimeoutMs,
            maxHeaderSize: 8_192
        };
        const request = transport(options, async (response) => {
            try {
                const responseBody = await readResponse(response);
                clearTimeout(totalTimeout);
                resolve({ status: response.statusCode ?? 0, body: responseBody });
            } catch (error) {
                clearTimeout(totalTimeout);
                reject(error);
            }
        });
        const totalTimeout = setTimeout(
            () => request.destroy(new Error('Request timed out.')),
            requestTimeoutMs
        );
        request.on('timeout', () => request.destroy(new Error('Request timed out.')));
        request.on('error', (error) => {
            clearTimeout(totalTimeout);
            reject(error);
        });
        request.end(body);
    });

const getErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : 'Delivery request failed.';

export class DeliveryRequestError extends Error {
    constructor(message: string, public readonly retryable: boolean) {
        super(message);
        this.name = 'DeliveryRequestError';
    }
}

export const attemptWebhookDelivery = async (
    targetUrl: string,
    deliveryId: string,
    payload: unknown
): Promise<{ status: number; body: string }> => {
    let url: URL;
    try {
        url = new URL(targetUrl);
    } catch {
        throw new DeliveryRequestError('The endpoint URL is invalid.', false);
    }

    if (
        !['http:', 'https:'].includes(url.protocol) ||
        url.username ||
        url.password ||
        (url.port && url.port !== (url.protocol === 'https:' ? '443' : '80'))
    ) {
        throw new DeliveryRequestError(
            'Only public HTTP(S) endpoints on standard ports are allowed.',
            false
        );
    }

    let addresses: { address: string; family: number }[];
    try {
        const hostname = url.hostname.replace(/^\[|\]$/g, '');
        const family = isIP(hostname);
        addresses = family
            ? [{ address: hostname, family }]
            : await lookup(hostname, { all: true, verbatim: true });
    } catch (error) {
        throw new DeliveryRequestError(getErrorMessage(error).slice(0, 500), true);
    }

    if (!hasOnlyPublicAddresses(addresses)) {
        throw new DeliveryRequestError(
            'The endpoint must resolve only to public IP addresses.',
            false
        );
    }

    try {
        return await sendRequest(
            url,
            addresses[0].address,
            addresses[0].family,
            deliveryId,
            payload
        );
    } catch (error) {
        throw new DeliveryRequestError(getErrorMessage(error).slice(0, 500), true);
    }
};

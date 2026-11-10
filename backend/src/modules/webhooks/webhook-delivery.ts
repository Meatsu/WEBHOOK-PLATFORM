import { BlockList, isIP } from 'node:net';
import { lookup } from 'node:dns/promises';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import type { IncomingMessage, RequestOptions } from 'node:http';
import type { Prisma } from '../../../generated/prisma/client';
import type { DeliveryStatus } from '../../../generated/prisma/enums';
import { ApiError } from '../../middleware/error-handler';
import { prisma } from '../../infrastructure/database/prisma';
import { findWebhook } from './webhook.repository';

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
    '::ffff:0:0/96',
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

const isPublicAddress = (address: string, family: number) => {
    if (family === 4) {
        return !blockedAddresses.check(address, 'ipv4');
    }
    return family === 6 &&
        allowedIpv6Addresses.check(address, 'ipv6') &&
        !blockedAddresses.check(address, 'ipv6');
};

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
            hostname: url.hostname,
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
                resolve({ status: response.statusCode ?? 0, body: responseBody });
            } catch (error) {
                reject(error);
            }
        });
        request.on('timeout', () => request.destroy(new Error('Request timed out.')));
        request.on('error', reject);
        request.end(body);
    });

const getErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : 'Delivery request failed.';

export const deliverTestEvent = async (
    userId: string,
    webhookId: string,
    payload: Prisma.InputJsonValue
) => {
    const webhook = await findWebhook(webhookId, userId);
    if (!webhook) {
        throw new ApiError(404, 'Webhook endpoint not found.');
    }

    const delivery = await prisma.delivery.create({
        data: {
            userId,
            webhookId: webhook.id,
            endpointName: webhook.name,
            targetUrl: webhook.targetUrl,
            payload
        }
    });
    const startedAt = Date.now();
    let update: {
        status: DeliveryStatus;
        responseStatus?: number;
        responseBody?: string;
        error?: string;
        durationMs: number;
    };

    try {
        const url = new URL(webhook.targetUrl);
        if (
            !['http:', 'https:'].includes(url.protocol) ||
            url.username ||
            url.password ||
            (url.port && url.port !== (url.protocol === 'https:' ? '443' : '80'))
        ) {
            throw new Error('Only public HTTP(S) endpoints on standard ports are allowed.');
        }

        const address = isIP(url.hostname)
            ? [{ address: url.hostname, family: isIP(url.hostname) }]
            : await lookup(url.hostname, { all: true, verbatim: true });

        if (address.length === 0 || address.some((entry) =>
            !isPublicAddress(entry.address, entry.family)
        )) {
            throw new Error('The endpoint must resolve only to public IP addresses.');
        }

        const response = await sendRequest(
            url,
            address[0].address,
            address[0].family,
            delivery.id,
            payload
        );
        update = {
            status: response.status >= 200 && response.status < 300
                ? 'SUCCEEDED'
                : 'FAILED',
            responseStatus: response.status,
            responseBody: response.body.slice(0, responseLimitBytes),
            error: response.status >= 300
                ? `Endpoint returned HTTP ${response.status}.`
                : undefined,
            durationMs: Date.now() - startedAt
        };
    } catch (error) {
        update = {
            status: 'FAILED',
            error: getErrorMessage(error).slice(0, 500),
            durationMs: Date.now() - startedAt
        };
    }

    return prisma.delivery.update({
        where: { id: delivery.id },
        data: update
    });
};

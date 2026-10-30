import 'dotenv/config';

import express from 'express';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import authModule from './modules/auth';
import webhooksModule from './modules/webhooks';

const app = express();

const trustedProxyHops = Number(process.env.TRUST_PROXY_HOPS ?? 0);
if (!Number.isSafeInteger(trustedProxyHops) || trustedProxyHops < 0) {
    throw new Error('TRUST_PROXY_HOPS must be a non-negative integer.');
}

app.set('trust proxy', trustedProxyHops);
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'production' && !req.secure) {
        return res.status(426).json({
            status: false,
            message: 'HTTPS is required.'
        });
    }
    return next();
});

app.use('/api/auth', authModule);
app.use('/api/webhooks', webhooksModule);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
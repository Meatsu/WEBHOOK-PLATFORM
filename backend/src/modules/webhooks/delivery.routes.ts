import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { requireAuth } from '../auth/auth.middleware';
import { getEvent, listEvents, retryEvent } from './delivery.controller';

const router = Router();
const retryLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        status: false,
        message: 'Too many retry attempts. Please try again later.'
    }
});

router.use(requireAuth);
router.get('/', listEvents);
router.post('/:id/retry', retryLimiter, retryEvent);
router.get('/:id', getEvent);

export default router;

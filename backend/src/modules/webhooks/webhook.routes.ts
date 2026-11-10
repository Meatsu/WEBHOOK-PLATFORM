import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { requireAuth } from '../auth/auth.middleware';
import { sendTestEvent } from './delivery.controller';
import { create, get, list, remove, update } from './webhook.controller';

const router = Router();

router.use(requireAuth);
router.get('/', list);
router.post('/', create);
router.post('/:id/test-events', rateLimit({
    windowMs: 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        status: false,
        message: 'Too many test events. Please try again later.'
    }
}), sendTestEvent);
router.get('/:id', get);
router.patch('/:id', update);
router.delete('/:id', remove);

export default router;

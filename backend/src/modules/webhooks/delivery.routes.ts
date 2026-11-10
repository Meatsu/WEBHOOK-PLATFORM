import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import { getEvent, listEvents } from './delivery.controller';

const router = Router();

router.use(requireAuth);
router.get('/', listEvents);
router.get('/:id', getEvent);

export default router;

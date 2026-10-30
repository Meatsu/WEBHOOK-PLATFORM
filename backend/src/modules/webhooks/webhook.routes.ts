import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import { create, get, list, remove, update } from './webhook.controller';

const router = Router();

router.use(requireAuth);
router.get('/', list);
router.post('/', create);
router.get('/:id', get);
router.patch('/:id', update);
router.delete('/:id', remove);

export default router;

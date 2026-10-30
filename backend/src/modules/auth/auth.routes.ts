import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { login, logout, register } from './auth.controller';
import { requireAuth } from './auth.middleware';

const router = Router();

const registrationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        status: false,
        message: 'Too many registration attempts. Please try again later.'
    }
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        status: false,
        message: 'Too many login attempts. Please try again later.'
    }
});

router.post('/register', registrationLimiter, register);
router.post('/login', loginLimiter, login);
router.post('/logout', requireAuth, logout);

export default router;

/*

{
  "email": "cj1@gmail.com",
  "password": "Lego@0825678"
}

*/

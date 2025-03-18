import { Router } from 'express';
import { sendStatus405 } from '../middleware/statusCodes';
import { permitRoles } from '../middleware/permitRoles';
import { Auth } from '../auth/auth';

const router: Router = Router();

// router.get(`${process.env.AUTH_NEO4J_USER_URI as string}`, permitRoles(Auth.ADMIN));
router.put(`${process.env.AUTH_NEO4J_USER_URI as string}`, sendStatus405('GET', 'POST'));
router.delete(`${process.env.AUTH_NEO4J_USER_URI as string}`, sendStatus405('GET', 'POST'));
// router.post(`${process.env.AUTH_NEO4J_USER_URI as string}`, permitRoles(Auth.ADMIN));

export default router;

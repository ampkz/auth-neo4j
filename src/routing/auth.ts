import { Router } from 'express';
import { sendStatus405 } from '../middleware/statusCodes';
import { login, logout } from './routes/auth';

const router: Router = Router();

router.get(process.env.AUTH_NEO4J_LOGIN_URI as string, sendStatus405('POST'));
router.put(process.env.AUTH_NEO4J_LOGIN_URI as string, sendStatus405('POST'));
router.delete(process.env.AUTH_NEO4J_LOGIN_URI as string, sendStatus405('POST'));
router.post(process.env.AUTH_NEO4J_LOGIN_URI as string, login);

router.get(process.env.AUTH_NEO4J_LOGOUT_URI as string, logout);
router.put(process.env.AUTH_NEO4J_LOGOUT_URI as string, sendStatus405('GET'));
router.delete(process.env.AUTH_NEO4J_LOGOUT_URI as string, sendStatus405('GET'));
router.post(process.env.AUTH_NEO4J_LOGOUT_URI as string, sendStatus405('GET'));

export default router;

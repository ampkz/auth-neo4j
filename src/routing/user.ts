import { Router } from 'express';
import { sendStatus405 } from '../middleware/statusCodes';
import { permitRoles } from '../middleware/permitRoles';
import { Auth } from '../auth/auth';
import { getUsers, createUser } from './routes/user';

const router: Router = Router();

router.get(`${process.env.AUTH_NEO4J_USER_URI as string}`, permitRoles(Auth.ADMIN), getUsers);
router.put(`${process.env.AUTH_NEO4J_USER_URI as string}`, sendStatus405('GET', 'POST'));
router.delete(`${process.env.AUTH_NEO4J_USER_URI as string}`, sendStatus405('GET', 'POST'));
router.post(`${process.env.AUTH_NEO4J_USER_URI as string}`, permitRoles(Auth.ADMIN), createUser);

// router.get(`${process.env.AUTH_NEO4J_USER_URI as string}/:userId`, permitRoles(Auth.ADMIN), getUsers);
// router.put(`${process.env.AUTH_NEO4J_USER_URI as string}/:userId`, sendStatus405('GET', 'POST'));
// router.delete(`${process.env.AUTH_NEO4J_USER_URI as string}/:userId`, );
router.post(`${process.env.AUTH_NEO4J_USER_URI as string}/:userId`, sendStatus405('GET', 'PUT', 'DELETE'));

export default router;

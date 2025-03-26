import { Router } from 'express';
import { sendStatus405 } from '../middleware/statusCodes';
import { permitRoles } from '../middleware/permitRoles';
import { Auth } from '../auth/auth';
import { getUsers, createUser, deleteUser, updateUser, getUser } from './routes/user';

export default function userRouter(userURI: string): Router {
	const router: Router = Router();

	router.get(userURI, permitRoles(Auth.ADMIN), getUsers);
	router.put(userURI, sendStatus405('GET', 'POST'));
	router.delete(userURI, sendStatus405('GET', 'POST'));
	router.post(userURI, permitRoles(Auth.ADMIN), createUser);

	router.get(`${userURI}/:userId`, permitRoles(Auth.ADMIN, Auth.SELF), getUser);
	router.put(`${userURI}/:userId`, permitRoles(Auth.ADMIN, Auth.SELF), updateUser);
	router.delete(`${userURI}/:userId`, permitRoles(Auth.ADMIN, Auth.SELF), deleteUser);
	router.post(`${userURI}/:userId`, sendStatus405('GET', 'PUT', 'DELETE'));

	return router;
}

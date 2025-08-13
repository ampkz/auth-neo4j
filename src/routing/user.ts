import { Router } from 'express';
import { sendStatus405 } from '../middleware/statusCodes';
import { permitRoles } from '../middleware/permitRoles';
import { Auth } from '../auth/auth';
import { getUsers, createUser, deleteUser, updateUser, getUser } from './routes/user';

export default function userRouter(userURI: string): Router {
	const router: Router = Router();

	router.get(userURI, permitRoles(Auth.ADMIN), getUsers);
	router.put(userURI, sendStatus405('GET', 'POST'));
	router.patch(userURI, sendStatus405('GET', 'POST'));
	router.delete(userURI, sendStatus405('GET', 'POST'));
	router.post(userURI, permitRoles(Auth.ADMIN), createUser);

	router.get(`${userURI}/:id`, permitRoles(Auth.ADMIN, Auth.SELF), getUser);
	router.patch(`${userURI}/:id`, permitRoles(Auth.ADMIN, Auth.SELF), updateUser);
	router.delete(`${userURI}/:id`, permitRoles(Auth.ADMIN, Auth.SELF), deleteUser);
	router.post(`${userURI}/:id`, sendStatus405('GET', 'PATCH', 'DELETE'));
	router.put(`${userURI}/:id`, sendStatus405('GET', 'PATCH', 'DELETE'));

	return router;
}

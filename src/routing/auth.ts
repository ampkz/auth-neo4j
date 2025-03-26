import { Router } from 'express';
import { sendStatus405 } from '../middleware/statusCodes';
import { login, logout } from './routes/auth';

export default function authRouter(loginURI: string, logoutURI: string): Router {
	const router: Router = Router();

	router.get(loginURI, sendStatus405('POST'));
	router.put(loginURI, sendStatus405('POST'));
	router.delete(loginURI, sendStatus405('POST'));
	router.post(loginURI, login);

	router.get(logoutURI, logout);
	router.put(logoutURI, sendStatus405('GET'));
	router.delete(logoutURI, sendStatus405('GET'));
	router.post(logoutURI, sendStatus405('GET'));

	return router;
}

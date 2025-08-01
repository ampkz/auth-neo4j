import authRouter from './routing/auth';
import userRouter from './routing/user';
import cookieParser from 'cookie-parser';
import express, { Express } from 'express';

import Config from './config/config';

export function authNeo4j() {
	const app: Express = express();

	app.use(cookieParser());
	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));

	app.use(authRouter(Config.LOGIN_URI, Config.LOGOUT_URI));
	app.use(userRouter(Config.USER_URI));

	return app;
}

export default authNeo4j;

import authRouter from './routing/auth';
import cookieParser from 'cookie-parser';
import express, { Express } from 'express';

export type AuthNeo4jConfig = {
	SALT_ROUNDS: string;
	TOKEN_SECRET: string;
	TOKEN_EXPIRATION: string;
	COOKIE_EXPIRATION: string;
	AUTH_REALM: string;
	LOGIN_URI: string;
	LOGOUT_URI: string;
	USER_URI: string;
	NEO4J_HOST: string;
	NEO4J_PORT: string;
	NEO4J_USER: string;
	NEO4J_PWD: string;
	USERS_DB: string;
};

async function authNeo4j(config?: AuthNeo4jConfig) {
	/* istanbul ignore next line */
	if (config) {
		process.env.AUTH_NEO4J_SALT_ROUNDS = config.SALT_ROUNDS;
		process.env.AUTH_NEO4J_TOKEN_SECRET = config.TOKEN_SECRET;
		process.env.AUTH_NEO4J_TOKEN_EXPIRATION = config.TOKEN_EXPIRATION;
		process.env.AUTH_NEO4J_COOKIE_EXPIRATION = config.COOKIE_EXPIRATION;
		process.env.AUTH_NEO4J_AUTH_REALM = config.AUTH_REALM;
		process.env.AUTH_NEO4J_LOGIN_URI = config.LOGIN_URI;
		process.env.AUTH_NEO4J_LOGOUT_URI = config.LOGOUT_URI;
		process.env.AUTH_NEO4J_USER_URI = config.USER_URI;
		process.env.AUTH_NEO4J_NEO4J_HOST = config.NEO4J_HOST;
		process.env.AUTH_NEO4J_NEO4J_PORT = config.NEO4J_PORT;
		process.env.AUTH_NEO4J_NEO4J_USER = config.NEO4J_USER;
		process.env.AUTH_NEO4J_NEO4J_PWD = config.NEO4J_PWD;
		process.env.AUTH_NEO4J_USERS_DB = config.USERS_DB;
	} else if (!config && process.env.NODE_ENV !== 'test') {
		process.exit(9);
	}

	const app: Express = express();

	app.use(cookieParser());
	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));

	app.use(authRouter);

	return app;
}

export default authNeo4j;

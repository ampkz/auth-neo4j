import dotenv from 'dotenv';

dotenv.config();

export default class Config {
	static SALT_ROUNDS: number = parseInt(process.env.SALT_ROUNDS as string);
	static TOKEN_SECRET: string = process.env.TOKEN_SECRET as string;
	static TOKEN_EXPIRATION: number = parseInt(process.env.TOKEN_EXPIRATION as string);
	static COOKIE_EXPIRATION: number = parseInt(process.env.COOKIE_EXPIRATION as string);
	static AUTH_REALM: string = process.env.AUTH_REALM as string;
	static LOGIN_URI: string = process.env.LOGIN_URI as string;
	static LOGOUT_URI: string = process.env.LOGOUT_URI as string;
	static USER_URI: string = process.env.USER_URI as string;
	static NEO4J_HOST: string = process.env.NEO4J_HOST as string;
	static NEO4J_PORT: string = process.env.NEO4J_PORT as string;
	static NEO4J_USER: string = process.env.NEO4J_USER as string;
	static NEO4J_PWD: string = process.env.NEO4J_PWD as string;
	/* istanbul ignore next line */
	static USERS_DB: string = `${process.env.USERS_DB as string}${process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : ``}`;
}

import dotenv from 'dotenv';

dotenv.config({ quiet: true });

export default class Config {
	static SALT_ROUNDS: number = parseInt(process.env.SALT_ROUNDS as string);
	static SESSION_EXPIRATION: number = parseInt(process.env.SESSION_EXPIRATION as string);
	static COOKIE_EXPIRATION: number = parseInt(process.env.COOKIE_EXPIRATION as string) * 1000;
	static AUTH_REALM: string = process.env.AUTH_REALM as string;
	static LOGIN_URI: string = process.env.LOGIN_URI as string;
	static LOGOUT_URI: string = process.env.LOGOUT_URI as string;
	static USER_URI: string = process.env.USER_URI as string;
	static NEO4J_HOST: string = process.env.NEO4J_HOST as string;
	static NEO4J_PORT: string = process.env.NEO4J_PORT as string;
	static NEO4J_USER: string = process.env.NEO4J_USER as string;
	static NEO4J_PWD: string = process.env.NEO4J_PWD as string;
	/* istanbul ignore next line */
	static IS_NOT_PROD: boolean = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
	/* istanbul ignore next line */
	static USERS_DB: string = `${process.env.USERS_DB as string}${process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : ``}`;
	/* istanbul ignore next line */
	static SAME_SITE: boolean | 'lax' | 'strict' | 'none' | undefined = `${Config.IS_NOT_PROD ? 'lax' : 'none'}`;
	/* istanbul ignore next line */
	static SECURE: boolean = !Config.IS_NOT_PROD;
}

import authRouter from './routing/auth';
import userRouter from './routing/user';
import cookieParser from 'cookie-parser';
import express from 'express';
async function authNeo4j(config) {
    /* istanbul ignore next line */
    if (config) {
        process.env.AUTH_NEO4J_SALT_ROUNDS = config.saltRounds;
        process.env.AUTH_NEO4J_TOKEN_SECRET = config.tokenSecret;
        process.env.AUTH_NEO4J_TOKEN_EXPIRATION = config.tokenExpiration;
        process.env.AUTH_NEO4J_COOKIE_EXPIRATION = config.cookieExpiration;
        process.env.AUTH_NEO4J_AUTH_REALM = config.authRealm;
        process.env.AUTH_NEO4J_LOGIN_URI = config.loginURI;
        process.env.AUTH_NEO4J_LOGOUT_URI = config.logoutURI;
        process.env.AUTH_NEO4J_USER_URI = config.userURI;
        process.env.AUTH_NEO4J_NEO4J_HOST = config.neo4jHost;
        process.env.AUTH_NEO4J_NEO4J_PORT = config.noe4jPort;
        process.env.AUTH_NEO4J_NEO4J_USER = config.neo4jUser;
        process.env.AUTH_NEO4J_NEO4J_PWD = config.neo4jPwd;
        process.env.AUTH_NEO4J_USERS_DB = config.usersDB;
    }
    else if (!config && process.env.NODE_ENV !== 'test') {
        process.exit(9);
    }
    const app = express();
    app.use(cookieParser());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(authRouter);
    app.use(userRouter);
    return app;
}
export default authNeo4j;

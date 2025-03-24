"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = __importDefault(require("./routing/auth"));
const user_1 = __importDefault(require("./routing/user"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_1 = __importDefault(require("express"));
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
    const app = (0, express_1.default)();
    app.use((0, cookie_parser_1.default)());
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use(auth_1.default);
    app.use(user_1.default);
    return app;
}
exports.default = authNeo4j;

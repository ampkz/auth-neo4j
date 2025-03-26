import express from 'express';

type AuthNeo4jConfig = {
    saltRounds: string;
    tokenSecret: string;
    tokenExpiration: string;
    cookieExpiration: string;
    authRealm: string;
    loginURI: string;
    logoutURI: string;
    userURI: string;
    neo4jHost: string;
    noe4jPort: string;
    neo4jUser: string;
    neo4jPwd: string;
    usersDB: string;
};
declare function authNeo4j(config?: AuthNeo4jConfig): express.Express;

export { type AuthNeo4jConfig, authNeo4j as default };

import { hashToken } from './session';
import { connect } from '../db/connection';
import { InternalError } from '../errors/errors';
import { User } from '../users/user';
export var Errors;
(function (Errors) {
    Errors["COULD_NOT_CREATE_SESSION"] = "There was an error creating a session";
    Errors["COULD_NOT_VALIDATE_SESSION"] = "There was an error validating a session";
    Errors["COULD_NOT_INVALIDATE_SESSION"] = "There was an error invalidating a session";
    Errors["COULD_NOT_INVALIDATE_ALL_SESSIONS"] = "There was an error invalidating all sessions";
})(Errors || (Errors = {}));
export async function createSession(token, email) {
    const sessionId = hashToken(token);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(process.env.AUTH_NEO4J_TOKEN_EXPIRATION));
    const driver = await connect();
    const neoSession = driver.session({ database: process.env.AUTH_NEO4J_USERS_DB });
    let match;
    try {
        match = await neoSession.run(`MATCH (u:User {email: $email}) CREATE (u)-[:HAS_SESSION {sessionId: $sessionId}]->(s:Session {expiresAt: $expiresAt}) RETURN u`, { email, sessionId, expiresAt: expiresAt.toISOString() });
    }
    catch (error) {
        await neoSession.close();
        await driver.close();
        throw new InternalError(Errors.COULD_NOT_CREATE_SESSION, { cause: error });
    }
    await neoSession.close();
    await driver.close();
    if (match.records.length === 0) {
        return undefined;
    }
    const user = new User(match.records[0].get('u').properties);
    const session = {
        id: sessionId,
        userID: user.id,
        expiresAt,
    };
    return session;
}
export async function validateSessionToken(token) {
    if (!token) {
        return { session: null, user: null };
    }
    const sessionId = hashToken(token);
    const driver = await connect();
    const neoSession = driver.session({ database: process.env.AUTH_NEO4J_USERS_DB });
    let match;
    try {
        match = await neoSession.run(`MATCH(u:User)-[r:HAS_SESSION {sessionId: $sessionId}]->(s:Session) RETURN u, r, s`, { sessionId });
    }
    catch (error) {
        await neoSession.close();
        await driver.close();
        throw new InternalError(Errors.COULD_NOT_VALIDATE_SESSION, { cause: error });
    }
    await neoSession.close();
    await driver.close();
    if (match.records.length === 0) {
        return { session: null, user: null };
    }
    const user = new User(match.records[0].get('u').properties);
    const session = match.records[0].get('s').properties;
    session.id = match.records[0].get('r').properties.sessionId;
    session.userID = user.id;
    session.expiresAt = new Date(session.expiresAt);
    //TODO invalidate/update based on time
    if (Date.now() >= session.expiresAt.getTime()) {
        await invalidateSession(session.id);
        return { session: null, user: null };
    }
    return { session, user };
}
export async function invalidateSession(sessionId) {
    const driver = await connect();
    const neoSession = driver.session({ database: process.env.AUTH_NEO4J_USERS_DB });
    try {
        await neoSession.run(`MATCH (u:User)-[r:HAS_SESSION {sessionId: $sessionId}]->(s:Session) DETACH DELETE s`, { sessionId });
    }
    catch (error) {
        await neoSession.close();
        await driver.close();
        throw new InternalError(Errors.COULD_NOT_INVALIDATE_SESSION, { cause: error });
    }
    await neoSession.close();
    await driver.close();
}
export async function invalidateAllSessions(email) {
    const driver = await connect();
    const neoSession = driver.session({ database: process.env.AUTH_NEO4J_USERS_DB });
    try {
        await neoSession.run(`MATCH (u:User {email: $email})-[r:HAS_SESSION]->(s:Session) DETACH DELETE s`, { email });
    }
    catch (error) {
        await neoSession.close();
        await driver.close();
        throw new InternalError(Errors.COULD_NOT_INVALIDATE_ALL_SESSIONS, { cause: error });
    }
    await neoSession.close();
    await driver.close();
}

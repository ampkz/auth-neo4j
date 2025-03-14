import { Driver, RecordShape } from 'neo4j-driver-core';
import { hashToken, Session, SessionValidationResult } from './session';
import { Session as NeoSession } from 'neo4j-driver';
import { connect } from '../db/connection';
import { InternalError } from '../errors/errors';
import { User } from '../users/user';

export enum Errors {
	COULD_NOT_CREATE_SESSION = 'There was an error creating a session',
	COULD_NOT_VALIDATE_SESSION = 'There was an error vvalidating a session',
}

export async function createSession(token: string, email: string): Promise<Session | undefined> {
	const sessionId: string = hashToken(token);
	const expiresAt: Date = new Date();
	expiresAt.setDate(expiresAt.getDate() + parseInt(process.env.AUTH_NEO4J_TOKEN_EXPIRATION as string));

	const driver: Driver = await connect();
	const neoSession: NeoSession = driver.session({ database: process.env.AUTH_NEO4J_USERS_DB });

	let match: RecordShape;

	try {
		match = await neoSession.run(
			`MATCH (u:User {email: $email}) CREATE (u)-[:HAS_SESSION {sessionId: $sessionId}]->(s:Session {expiresAt: $expiresAt}) RETURN u`,
			{ email, sessionId, expiresAt: expiresAt.toISOString() }
		);
	} catch (error) {
		await neoSession.close();
		await driver.close();

		throw new InternalError(Errors.COULD_NOT_CREATE_SESSION, { cause: error });
	}

	await neoSession.close();
	await driver.close();

	if (match.records.length === 0) {
		return undefined;
	}

	const user: User = new User(match.records[0].get('u').properties);

	const session: Session = {
		id: sessionId,
		userID: user.id as string,
		expiresAt,
	};

	return session;
}

export async function validateSessionToken(token?: string): Promise<SessionValidationResult> {
	if (!token) {
		return { session: null, user: null };
	}

	const sessionId: string = hashToken(token);

	const driver: Driver = await connect();
	const neoSession: NeoSession = driver.session({ database: process.env.AUTH_NEO4J_USERS_DB });

	let match: RecordShape;

	try {
		match = await neoSession.run(`MATCH(u:User)-[r:HAS_SESSION {sessionId: $sessionId}]->(s:Session) RETURN u, r, s`, { sessionId });
	} catch (error) {
		await neoSession.close();
		await driver.close();

		throw new InternalError(Errors.COULD_NOT_VALIDATE_SESSION, { cause: error });
	}

	await neoSession.close();
	await driver.close();

	if (match.records.length === 0) {
		return { session: null, user: null };
	}

	//TODO invalidate/update based on time

	const user: User = new User(match.records[0].get('u').properties);
	const session: Session = match.records[0].get('s').properties;
	session.id = match.records[0].get('r').properties.sessionId;
	session.userID = user.id as string;
	session.expiresAt = new Date(session.expiresAt);

	return { session, user };
}

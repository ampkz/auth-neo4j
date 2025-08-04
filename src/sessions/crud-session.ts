import { Driver, RecordShape } from 'neo4j-driver-core';
import crypto from 'node:crypto';
import { Session, SessionValidationResult } from './session';
import { Session as NeoSession } from 'neo4j-driver';
import { connect } from '../db/connection';
import { InternalError } from '../errors/errors';
import { User } from '../users/user';

import Config from '../config/config';

export enum Errors {
	COULD_NOT_CREATE_SESSION = 'There was an error creating a session',
	COULD_NOT_VALIDATE_SESSION = 'There was an error validating a session',
	COULD_NOT_INVALIDATE_SESSION = 'There was an error invalidating a session',
	COULD_NOT_INVALIDATE_ALL_SESSIONS = 'There was an error invalidating all sessions',
}

export async function createSession(token: string, email: string): Promise<Session | undefined> {
	const sessionId: string = hashToken(token);
	const expiresAt: Date = new Date();
	expiresAt.setDate(expiresAt.getDate() + Config.SESSION_EXPIRATION);

	const driver: Driver = await connect();
	const neoSession: NeoSession = driver.session({ database: Config.USERS_DB });

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
	const neoSession: NeoSession = driver.session({ database: Config.USERS_DB });

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

	const user: User = new User(match.records[0].get('u').properties);
	const session: Session = match.records[0].get('s').properties;
	session.id = match.records[0].get('r').properties.sessionId;
	session.userID = user.id as string;
	session.expiresAt = new Date(session.expiresAt);

	//TODO invalidate/update based on time
	if (Date.now() >= session.expiresAt.getTime()) {
		await invalidateSession(session.id);
		return { session: null, user: null };
	}

	return { session, user };
}

export async function invalidateSession(sessionId: string): Promise<void> {
	const driver = await connect();
	const neoSession: NeoSession = driver.session({ database: Config.USERS_DB });

	try {
		await neoSession.run(`MATCH (u:User)-[r:HAS_SESSION {sessionId: $sessionId}]->(s:Session) DETACH DELETE s`, { sessionId });
	} catch (error) {
		await neoSession.close();
		await driver.close();

		throw new InternalError(Errors.COULD_NOT_INVALIDATE_SESSION, { cause: error });
	}

	await neoSession.close();
	await driver.close();
}

export async function invalidateAllSessions(email: string): Promise<void> {
	const driver = await connect();
	const neoSession: NeoSession = driver.session({ database: Config.USERS_DB });

	try {
		await neoSession.run(`MATCH (u:User {email: $email})-[r:HAS_SESSION]->(s:Session) DETACH DELETE s`, { email });
	} catch (error) {
		await neoSession.close();
		await driver.close();

		throw new InternalError(Errors.COULD_NOT_INVALIDATE_ALL_SESSIONS, { cause: error });
	}

	await neoSession.close();
	await driver.close();
}

export function generateSessionToken(bytes: number = 32): string {
	return crypto.randomBytes(bytes).toString('hex');
}

export function hashToken(token: string): string {
	return crypto.createHash('sha256').update(token).digest('hex');
}

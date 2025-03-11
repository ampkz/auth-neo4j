import { connect } from './connection';
import { Driver, Session, RecordShape, Record } from 'neo4j-driver';
import { InternalError } from '../errors/errors';

export enum ErrorMsgs {
	COULD_NOT_CREATE_DB = 'Could Not Create Database',
	COULD_NOT_CREATE_CONSTRAINT = 'Could Not Create Constraint',
	CONSTRAINT_ALREADY_EXISTS = 'Constrain Already Exists',
}

export async function initializeDB(): Promise<boolean> {
	const driver: Driver = await connect();
	let session: Session = driver.session();

	const match: RecordShape = await session.run(`CREATE DATABASE ${process.env.AUTH_NEO4J_USERS_DB} IF NOT EXISTS WAIT`);

	if ((match.records[0] as Record).get(`address`) != `${process.env.AUTH_NEO4J_NEO4J_HOST}:${process.env.AUTH_NEO4J_NEO4J_PORT}`) {
		await session.close();
		await driver.close();
		throw new InternalError(ErrorMsgs.COULD_NOT_CREATE_DB);
	}

	await session.close();

	session = driver.session({ database: process.env.AUTH_NEO4J_USERS_DB as string });

	try {
		await initializeConstraint(session, 'User', 'email');
		await initializeConstraint(session, 'User', 'id');
		await initializeConstraint(session, 'Session', 'id');
	} catch (error) {
		await session.close();
		await driver.close();
		throw error;
	}

	await session.close();
	await driver.close();

	return true;
}

export async function initializeConstraint(session: Session, node: string, property: string): Promise<boolean> {
	const constraintNameBase: string = `${node.toLowerCase()}_${property.toLowerCase()}`;

	const match: RecordShape = await session.run(
		`CREATE CONSTRAINT ${constraintNameBase}_unique IF NOT EXISTS FOR (n:${node}) REQUIRE n.${property} IS UNIQUE`
	);

	if (match.summary.counters._stats.constraintsAdded !== 1) {
		throw new InternalError(ErrorMsgs.COULD_NOT_CREATE_CONSTRAINT, {
			cause: { issue: ErrorMsgs.CONSTRAINT_ALREADY_EXISTS, constraintName: constraintNameBase + '_unique' },
		});
	}
	return true;
}

export async function destroyDB(): Promise<boolean> {
	const driver: Driver = await connect();
	const session: Session = driver.session();
	await session.run(`DROP DATABASE ${process.env.AUTH_NEO4J_USERS_DB} IF EXISTS DESTROY DATA WAIT`);
	await session.close();
	await driver.close();

	return true;
}

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
	const session: Session = driver.session();

	const match: RecordShape = await session.run(`CREATE DATABASE ${process.env.AUTH_NEO4J_USERS_DB} IF NOT EXISTS WAIT`);

	if ((match.records[0] as Record).get(`address`) != `${process.env.AUTH_NEO4J_NEO4J_HOST}:${process.env.AUTH_NEO4J_NEO4J_PORT}`) {
		await session.close();
		await driver.close();
		throw new InternalError(ErrorMsgs.COULD_NOT_CREATE_DB);
	}

	await session.close();
	await driver.close();

	await initializeConstraint(process.env.USERS_DB as string, 'User', 'email');
	await initializeConstraint(process.env.USERS_DB as string, 'User', 'id');
	await initializeConstraint(process.env.USERS_DB as string, 'Session', 'id');

	return true;
}

export async function initializeConstraint(dbName: string, node: string, property: string): Promise<boolean> {
	const driver: Driver = await connect();
	const session: Session = driver.session({ database: process.env.AUTH_NEO4J_USERS_DB });

	const constraintNameBase: string = `${node.toLowerCase()}_${property.toLowerCase()}`;

	const match: RecordShape = await session.run(
		`CREATE CONSTRAINT ${constraintNameBase}_unique IF NOT EXISTS FOR (n:${node}) REQUIRE n.${property} IS UNIQUE`
	);

	if (match.summary.counters._stats.constraintsAdded !== 1) {
		session.close();
		driver.close();
		throw new InternalError(ErrorMsgs.COULD_NOT_CREATE_CONSTRAINT, {
			cause: { issue: ErrorMsgs.CONSTRAINT_ALREADY_EXISTS, constraintName: constraintNameBase + '_unique' },
		});
	}

	await session.close();
	await driver.close();
	return true;
}

export async function verifyDB(dbName: string): Promise<boolean> {
	const driver: Driver = await connect();
	const session: Session = driver.session();
	const match: RecordShape = await session.run(`SHOW DATABASE ${dbName}`);
	await session.close();
	await driver.close();
	return match.records.length === 1;
}

export async function destroyDB(): Promise<void> {
	const driver: Driver = await connect();
	const session: Session = driver.session();
	await session.run(`DROP DATABASE ${process.env.AUTH_NEO4J_USERS_DB} IF EXISTS DESTROY DATA WAIT`);
	await session.close();
	await driver.close();
}

import * as bcrypt from 'bcrypt';
import { UserUpdates, User } from './user';
import { Driver, Record, RecordShape, Session } from 'neo4j-driver';
import { connect } from '../db/connection';
import { InternalError } from '../errors/errors';

export enum Errors {
	COULD_NOT_CREATE_USER = 'There was an error trying to create user.',
	COULD_NOT_GET_USER = 'There was an error trying to search for user.',
	COULD_NOT_DELETE_USER = 'There was an error trying to delete user.',
	COULD_NOT_UPDATE_USER = 'There was an error trying to update user.',
}

export async function createUser(user: User, password: string): Promise<User | undefined> {
	const pwdHash: string = await bcrypt.hash(password, parseInt(process.env.AUTH_NEO4J_SALT_ROUNDS as string));

	const driver: Driver = await connect();
	const session: Session = driver.session({ database: process.env.AUTH_NEO4J_USERS_DB });

	const props: string[] = ['id:apoc.create.uuid()', 'email: $email', 'auth: $auth', 'pwd: $pwdHash'];

	if (user.firstName) props.push('firstName: $firstName');
	if (user.lastName) props.push('lastName: $lastName');
	if (user.secondName) props.push('secondName: $secondName');

	let match: RecordShape;

	try {
		match = await session.run(`CREATE(u:User { ${props.join(',')}}) RETURN u`, { ...user, pwdHash });
	} catch (error) {
		await session.close();
		await driver.close();
		throw new InternalError(Errors.COULD_NOT_CREATE_USER, { cause: error });
	}

	await session.close();
	await driver.close();

	if (match.records.length !== 1) {
		return undefined;
	}

	return new User(match.records[0].get('u').properties);
}

export async function getUser(id: string): Promise<User | undefined> {
	const driver: Driver = await connect();
	const session: Session = driver.session({ database: process.env.AUTH_NEO4J_USERS_DB });

	let match: RecordShape;

	try {
		match = await session.run(`MATCH (u:User {id: $id}) RETURN u`, { id });
	} catch (error) {
		await session.close();
		await driver.close();
		throw new InternalError(Errors.COULD_NOT_GET_USER, { cause: error });
	}

	await driver.close();
	await session.close();

	if (match.records.length !== 1) {
		return undefined;
	}

	return new User(match.records[0].get('u').properties);
}

export async function deleteUser(id: string): Promise<User | undefined> {
	const driver: Driver = await connect();
	const session: Session = driver.session({ database: process.env.AUTH_NEO4J_USERS_DB });

	let match: RecordShape;

	try {
		match = await session.run(`MATCH (u:User {id: $id}) WITH u, properties(u) as p DETACH DELETE u RETURN p`, { id });
	} catch (error) {
		await session.close();
		await driver.close();
		throw new InternalError(Errors.COULD_NOT_DELETE_USER, { cause: error });
	}

	await session.close();
	await driver.close();

	if (match.records.length !== 1) {
		return undefined;
	}

	return new User(match.records[0].get('p'));
}

export async function updateUser(email: string, userUpdates: UserUpdates): Promise<User | undefined> {
	const props: string[] = [];

	if (userUpdates.updatedPassword) {
		userUpdates.updatedPassword = await bcrypt.hash(userUpdates.updatedPassword, parseInt(process.env.SALT_ROUNDS as string));
		props.push(`u.password = $updatedPassword`);
	}

	if (userUpdates.updatedEmail) props.push(`u.email = $updatedEmail`);
	if (userUpdates.updatedFirstName) props.push(`u.firstName = $updatedFirstName`);
	if (userUpdates.updatedLastName) props.push(`u.lastName = $updatedLastName`);
	if (userUpdates.updatedAuth) props.push(`u.auth = $updatedAuth`);
	if (userUpdates.updatedSecondName) props.push(`u.secondName = $updatedSecondName`);

	const driver: Driver = await connect();
	const session: Session = driver.session({ database: process.env.AUTH_NEO4J_USERS_DB });

	let match: RecordShape;

	try {
		match = await session.run(`MATCH (u:User {email: $email}) SET ${props.join(',')} RETURN u`, { email, ...userUpdates });
	} catch (error) {
		await session.close();
		await driver.close();
		throw new InternalError(Errors.COULD_NOT_UPDATE_USER, { cause: error });
	}

	await session.close();
	await driver.close();

	if (match.records.length !== 1) {
		return undefined;
	}

	return new User(match.records[0].get('u').properties);
}

export async function getAllUsers(): Promise<Array<User>> {
	const users: Array<User> = [];

	const driver: Driver = await connect();
	const session: Session = driver.session({ database: process.env.AUTH_NEO4J_USERS_DB });

	let match: RecordShape;

	try {
		match = await session.run(`MATCH (u:User) RETURN u`);
	} catch (error) {
		await session.close();
		await driver.close();
		throw new InternalError(Errors.COULD_NOT_GET_USER, { cause: error });
	}

	await session.close();
	await driver.close();

	match.records.map((record: Record) => {
		users.push(new User(record.get('u').properties));
	});

	return users;
}

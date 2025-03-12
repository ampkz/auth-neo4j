import * as bcrypt from 'bcrypt';
import { User } from '../../users/user';
import { Driver, RecordShape, Session } from 'neo4j-driver';
import { connect } from '../connection';
import { InternalError } from '../../errors/errors';

export enum Errors {
	COULD_NOT_CREATE_USER = 'Could Not Create User',
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

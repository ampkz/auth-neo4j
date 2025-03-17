import { Driver, RecordShape, Session } from 'neo4j-driver';
import { Auth } from '../auth/auth';
import { connect } from '../db/connection';
import * as bcrypt from 'bcrypt';

export interface IUser {
	id?: string;
	email: string;
	auth: Auth;
	firstName?: string;
	lastName?: string;
	secondName?: string;
}

export type UserUpdates = {
	updatedEmail?: string;
	updatedFirstName?: string;
	updatedSecondName?: string;
	updatedLastName?: string;
	updatedAuth?: string;
	updatedPassword?: string;
};

export class User implements IUser {
	public id?: string;
	public email: string;
	public auth: Auth;
	public firstName?: string;
	public lastName?: string;
	public secondName?: string;

	constructor(user: IUser) {
		this.id = user.id;
		this.email = user.email;
		this.auth = user.auth;
		this.firstName = user.firstName;
		this.lastName = user.lastName;
		this.secondName = user.secondName;
	}
}

export async function checkPassword(email: string, password: string): Promise<User | undefined> {
	const driver: Driver = await connect();
	const session: Session = driver.session({ database: process.env.AUTH_NEO4J_USERS_DB });

	let user: User | undefined = undefined;

	const match: RecordShape = await session.run(`MATCH (u:User {email: $email}) RETURN u`, { email });

	if (match.records.length === 1) {
		const matchedUser = match.records[0].get(0).properties;
		const pwdMatch = await bcrypt.compare(password, matchedUser.pwd);

		if (pwdMatch) {
			user = new User(matchedUser);
		}
	}

	await driver.close();
	await session.close();

	return user;
}

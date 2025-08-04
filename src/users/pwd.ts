import { Driver, RecordShape, Session } from 'neo4j-driver';
import { connect } from '../db/connection';
import * as bcrypt from 'bcrypt';
import { User } from './user';
import Config from '../config/config';

export async function checkPassword(email: string, password: string): Promise<User | undefined> {
	const driver: Driver = await connect();
	const session: Session = driver.session({ database: Config.USERS_DB });

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

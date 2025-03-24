import { connect } from '../db/connection';
import * as bcrypt from 'bcrypt';
export class User {
    id;
    email;
    auth;
    firstName;
    lastName;
    secondName;
    constructor(user) {
        this.id = user.id;
        this.email = user.email;
        this.auth = user.auth;
        this.firstName = user.firstName;
        this.lastName = user.lastName;
        this.secondName = user.secondName;
    }
}
export async function checkPassword(email, password) {
    const driver = await connect();
    const session = driver.session({ database: process.env.AUTH_NEO4J_USERS_DB });
    let user = undefined;
    const match = await session.run(`MATCH (u:User {email: $email}) RETURN u`, { email });
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

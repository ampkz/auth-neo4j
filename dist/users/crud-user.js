import * as bcrypt from 'bcrypt';
import { User } from './user';
import { connect } from '../db/connection';
import { InternalError } from '../errors/errors';
export var Errors;
(function (Errors) {
    Errors["COULD_NOT_CREATE_USER"] = "There was an error trying to create user.";
    Errors["COULD_NOT_GET_USER"] = "There was an error trying to search for user.";
    Errors["COULD_NOT_DELETE_USER"] = "There was an error trying to delete user.";
    Errors["COULD_NOT_UPDATE_USER"] = "There was an error trying to update user.";
})(Errors || (Errors = {}));
export async function createUser(user, password) {
    const pwdHash = await bcrypt.hash(password, parseInt(process.env.AUTH_NEO4J_SALT_ROUNDS));
    const driver = await connect();
    const session = driver.session({ database: process.env.AUTH_NEO4J_USERS_DB });
    const props = ['id:apoc.create.uuid()', 'email: $email', 'auth: $auth', 'pwd: $pwdHash'];
    if (user.firstName)
        props.push('firstName: $firstName');
    if (user.lastName)
        props.push('lastName: $lastName');
    if (user.secondName)
        props.push('secondName: $secondName');
    let match;
    try {
        match = await session.run(`CREATE(u:User { ${props.join(',')}}) RETURN u`, { ...user, pwdHash });
    }
    catch (error) {
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
export async function getUser(id) {
    const driver = await connect();
    const session = driver.session({ database: process.env.AUTH_NEO4J_USERS_DB });
    let match;
    try {
        match = await session.run(`MATCH (u:User {id: $id}) RETURN u`, { id });
    }
    catch (error) {
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
export async function deleteUser(id) {
    const driver = await connect();
    const session = driver.session({ database: process.env.AUTH_NEO4J_USERS_DB });
    let match;
    try {
        match = await session.run(`MATCH (u:User {id: $id}) WITH u, properties(u) as p DETACH DELETE u RETURN p`, { id });
    }
    catch (error) {
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
export async function updateUser(id, userUpdates) {
    const props = [];
    if (userUpdates.updatedPassword) {
        userUpdates.updatedPassword = await bcrypt.hash(userUpdates.updatedPassword, parseInt(process.env.SALT_ROUNDS));
        props.push(`u.password = $updatedPassword`);
    }
    if (userUpdates.updatedEmail)
        props.push(`u.email = $updatedEmail`);
    if (userUpdates.updatedFirstName)
        props.push(`u.firstName = $updatedFirstName`);
    if (userUpdates.updatedLastName)
        props.push(`u.lastName = $updatedLastName`);
    if (userUpdates.updatedAuth)
        props.push(`u.auth = $updatedAuth`);
    if (userUpdates.updatedSecondName)
        props.push(`u.secondName = $updatedSecondName`);
    const driver = await connect();
    const session = driver.session({ database: process.env.AUTH_NEO4J_USERS_DB });
    let match;
    try {
        match = await session.run(`MATCH (u:User {id: $id}) SET ${props.join(',')} RETURN u`, { id, ...userUpdates });
    }
    catch (error) {
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
export async function getAllUsers() {
    const users = [];
    const driver = await connect();
    const session = driver.session({ database: process.env.AUTH_NEO4J_USERS_DB });
    let match;
    try {
        match = await session.run(`MATCH (u:User) RETURN u`);
    }
    catch (error) {
        await session.close();
        await driver.close();
        throw new InternalError(Errors.COULD_NOT_GET_USER, { cause: error });
    }
    await session.close();
    await driver.close();
    match.records.map((record) => {
        users.push(new User(record.get('u').properties));
    });
    return users;
}

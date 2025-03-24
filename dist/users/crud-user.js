"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Errors = void 0;
exports.createUser = createUser;
exports.getUser = getUser;
exports.deleteUser = deleteUser;
exports.updateUser = updateUser;
exports.getAllUsers = getAllUsers;
const bcrypt = __importStar(require("bcrypt"));
const user_1 = require("./user");
const connection_1 = require("../db/connection");
const errors_1 = require("../errors/errors");
var Errors;
(function (Errors) {
    Errors["COULD_NOT_CREATE_USER"] = "There was an error trying to create user.";
    Errors["COULD_NOT_GET_USER"] = "There was an error trying to search for user.";
    Errors["COULD_NOT_DELETE_USER"] = "There was an error trying to delete user.";
    Errors["COULD_NOT_UPDATE_USER"] = "There was an error trying to update user.";
})(Errors || (exports.Errors = Errors = {}));
async function createUser(user, password) {
    const pwdHash = await bcrypt.hash(password, parseInt(process.env.AUTH_NEO4J_SALT_ROUNDS));
    const driver = await (0, connection_1.connect)();
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
        throw new errors_1.InternalError(Errors.COULD_NOT_CREATE_USER, { cause: error });
    }
    await session.close();
    await driver.close();
    if (match.records.length !== 1) {
        return undefined;
    }
    return new user_1.User(match.records[0].get('u').properties);
}
async function getUser(id) {
    const driver = await (0, connection_1.connect)();
    const session = driver.session({ database: process.env.AUTH_NEO4J_USERS_DB });
    let match;
    try {
        match = await session.run(`MATCH (u:User {id: $id}) RETURN u`, { id });
    }
    catch (error) {
        await session.close();
        await driver.close();
        throw new errors_1.InternalError(Errors.COULD_NOT_GET_USER, { cause: error });
    }
    await driver.close();
    await session.close();
    if (match.records.length !== 1) {
        return undefined;
    }
    return new user_1.User(match.records[0].get('u').properties);
}
async function deleteUser(id) {
    const driver = await (0, connection_1.connect)();
    const session = driver.session({ database: process.env.AUTH_NEO4J_USERS_DB });
    let match;
    try {
        match = await session.run(`MATCH (u:User {id: $id}) WITH u, properties(u) as p DETACH DELETE u RETURN p`, { id });
    }
    catch (error) {
        await session.close();
        await driver.close();
        throw new errors_1.InternalError(Errors.COULD_NOT_DELETE_USER, { cause: error });
    }
    await session.close();
    await driver.close();
    if (match.records.length !== 1) {
        return undefined;
    }
    return new user_1.User(match.records[0].get('p'));
}
async function updateUser(id, userUpdates) {
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
    const driver = await (0, connection_1.connect)();
    const session = driver.session({ database: process.env.AUTH_NEO4J_USERS_DB });
    let match;
    try {
        match = await session.run(`MATCH (u:User {id: $id}) SET ${props.join(',')} RETURN u`, { id, ...userUpdates });
    }
    catch (error) {
        await session.close();
        await driver.close();
        throw new errors_1.InternalError(Errors.COULD_NOT_UPDATE_USER, { cause: error });
    }
    await session.close();
    await driver.close();
    if (match.records.length !== 1) {
        return undefined;
    }
    return new user_1.User(match.records[0].get('u').properties);
}
async function getAllUsers() {
    const users = [];
    const driver = await (0, connection_1.connect)();
    const session = driver.session({ database: process.env.AUTH_NEO4J_USERS_DB });
    let match;
    try {
        match = await session.run(`MATCH (u:User) RETURN u`);
    }
    catch (error) {
        await session.close();
        await driver.close();
        throw new errors_1.InternalError(Errors.COULD_NOT_GET_USER, { cause: error });
    }
    await session.close();
    await driver.close();
    match.records.map((record) => {
        users.push(new user_1.User(record.get('u').properties));
    });
    return users;
}

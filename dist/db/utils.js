"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorMsgs = void 0;
exports.initializeDB = initializeDB;
exports.destroyDB = destroyDB;
const connection_1 = require("./connection");
const errors_1 = require("../errors/errors");
var ErrorMsgs;
(function (ErrorMsgs) {
    ErrorMsgs["COULD_NOT_CREATE_DB"] = "Could Not Create Database";
    ErrorMsgs["COULD_NOT_CREATE_CONSTRAINT"] = "Could Not Create Constraint";
    ErrorMsgs["CONSTRAINT_ALREADY_EXISTS"] = "Constrain Already Exists";
})(ErrorMsgs || (exports.ErrorMsgs = ErrorMsgs = {}));
async function initializeDB() {
    const driver = await (0, connection_1.connect)();
    let session = driver.session();
    const match = await session.run(`CREATE DATABASE ${process.env.AUTH_NEO4J_USERS_DB} IF NOT EXISTS WAIT`);
    if (match.records[0].get(`address`) != `${process.env.AUTH_NEO4J_NEO4J_HOST}:${process.env.AUTH_NEO4J_NEO4J_PORT}`) {
        await session.close();
        await driver.close();
        throw new errors_1.InternalError(ErrorMsgs.COULD_NOT_CREATE_DB);
    }
    await session.close();
    session = driver.session({ database: process.env.AUTH_NEO4J_USERS_DB });
    try {
        await initializeConstraint(session, 'User', 'email');
        await initializeConstraint(session, 'User', 'id');
        await initializeConstraint(session, 'HAS_SESSION', 'sessionId', true);
    }
    catch (error) {
        await session.close();
        await driver.close();
        throw error;
    }
    await session.close();
    await driver.close();
    return true;
}
async function initializeConstraint(session, identifier, property, isRelationship = false) {
    const constraintName = `${identifier.toLowerCase()}_${property.toLowerCase()}`;
    let query;
    if (isRelationship) {
        query = `CREATE CONSTRAINT ${constraintName} IF NOT EXISTS FOR ()-[r:${identifier}]-() REQUIRE r.${property} IS RELATIONSHIP KEY`;
    }
    else {
        query = `CREATE CONSTRAINT ${constraintName} IF NOT EXISTS FOR (n:${identifier}) REQUIRE n.${property} IS NODE KEY`;
    }
    const match = await session.run(query);
    if (match.summary.counters._stats.constraintsAdded !== 1) {
        throw new errors_1.InternalError(ErrorMsgs.COULD_NOT_CREATE_CONSTRAINT, {
            cause: { issue: ErrorMsgs.CONSTRAINT_ALREADY_EXISTS, constraintName },
        });
    }
    return true;
}
async function destroyDB() {
    const driver = await (0, connection_1.connect)();
    const session = driver.session();
    await session.run(`DROP DATABASE ${process.env.AUTH_NEO4J_USERS_DB} IF EXISTS DESTROY DATA WAIT`);
    await session.close();
    await driver.close();
    return true;
}

import neo4j from 'neo4j-driver';
import { InternalError } from '../errors/errors';
export var Errors;
(function (Errors) {
    Errors["DB_CONNECTION_UNAUTHORIZED"] = "Unauthorized Connection to Driver";
})(Errors || (Errors = {}));
export async function connect(username = process.env.AUTH_NEO4J_NEO4J_USER, password = process.env.AUTH_NEO4J_NEO4J_PWD) {
    const driver = neo4j.driver(`bolt://${process.env.AUTH_NEO4J_NEO4J_HOST}:${process.env.AUTH_NEO4J_NEO4J_PORT}`, neo4j.auth.basic(username, password));
    try {
        // Will throw an error if not authenticated
        await driver.getServerInfo();
    }
    catch (error) {
        throw new InternalError(Errors.DB_CONNECTION_UNAUTHORIZED, { cause: error });
    }
    return driver;
}

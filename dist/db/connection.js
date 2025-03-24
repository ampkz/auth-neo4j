"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Errors = void 0;
exports.connect = connect;
const neo4j_driver_1 = __importDefault(require("neo4j-driver"));
const errors_1 = require("../errors/errors");
var Errors;
(function (Errors) {
    Errors["DB_CONNECTION_UNAUTHORIZED"] = "Unauthorized Connection to Driver";
})(Errors || (exports.Errors = Errors = {}));
async function connect(username = process.env.AUTH_NEO4J_NEO4J_USER, password = process.env.AUTH_NEO4J_NEO4J_PWD) {
    const driver = neo4j_driver_1.default.driver(`bolt://${process.env.AUTH_NEO4J_NEO4J_HOST}:${process.env.AUTH_NEO4J_NEO4J_PORT}`, neo4j_driver_1.default.auth.basic(username, password));
    try {
        // Will throw an error if not authenticated
        await driver.getServerInfo();
    }
    catch (error) {
        throw new errors_1.InternalError(Errors.DB_CONNECTION_UNAUTHORIZED, { cause: error });
    }
    return driver;
}

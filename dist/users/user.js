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
exports.User = void 0;
exports.checkPassword = checkPassword;
const connection_1 = require("../db/connection");
const bcrypt = __importStar(require("bcrypt"));
class User {
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
exports.User = User;
async function checkPassword(email, password) {
    const driver = await (0, connection_1.connect)();
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

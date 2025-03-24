"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSessionToken = generateSessionToken;
exports.hashToken = hashToken;
const node_crypto_1 = __importDefault(require("node:crypto"));
function generateSessionToken(bytes = 32) {
    return node_crypto_1.default.randomBytes(bytes).toString('hex');
}
function hashToken(token) {
    return node_crypto_1.default.createHash('sha256').update(token).digest('hex');
}

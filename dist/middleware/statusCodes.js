"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendStatus401 = sendStatus401;
exports.sendStatus405 = sendStatus405;
function sendStatus401(res) {
    return res.set('WWW-Authenticate', `xBasic realm="${process.env.AUTH_NEO4J_AUTH_REALM}"`).status(401).end();
}
function sendStatus405(...allow) {
    return (req, res) => {
        res.set('Allow', allow).status(405).end();
    };
}

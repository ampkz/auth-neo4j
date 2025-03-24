"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.logout = logout;
const errors_1 = require("../../errors/errors");
const user_1 = require("../../users/user");
const statusCodes_1 = require("../../middleware/statusCodes");
const session_1 = require("../../sessions/session");
const crud_session_1 = require("../../sessions/crud-session");
async function login(req, res) {
    const { email, password } = req.body;
    const required = new errors_1.FieldErrors(errors_1.RoutingErrors.INVALID_REQUEST);
    if (!email)
        required.addFieldError(new errors_1.FieldError('email', errors_1.FieldError.REQUIRED));
    if (!password)
        required.addFieldError(new errors_1.FieldError('password', errors_1.FieldError.REQUIRED));
    if (required.hasFieldErrors()) {
        return res.status(required.getCode()).json({ message: required.message, data: required.getFields() }).end();
    }
    const user = await (0, user_1.checkPassword)(email, password);
    if (user === undefined) {
        return (0, statusCodes_1.sendStatus401)(res);
    }
    const token = (0, session_1.generateSessionToken)();
    await (0, crud_session_1.createSession)(token, email);
    return res
        .status(204)
        .cookie(`token`, token, { httpOnly: true, maxAge: parseInt(process.env.AUTH_NEO4J_COOKIE_EXPIRATION), sameSite: 'strict' })
        .end();
}
async function logout(req, res) {
    const token = req.cookies.token;
    if (!token) {
        return res.status(204).end();
    }
    const svr = await (0, crud_session_1.validateSessionToken)(token);
    if (svr.session) {
        await (0, crud_session_1.invalidateSession)(svr.session.id);
    }
    return res.status(204).clearCookie('token').end();
}

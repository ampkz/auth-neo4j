"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.permitRoles = permitRoles;
const auth_1 = require("../auth/auth");
const statusCodes_1 = require("./statusCodes");
const crud_session_1 = require("../sessions/crud-session");
function permitRoles(...rolesPermitted) {
    return async (req, res, next) => {
        const token = req.cookies.token;
        if (!token) {
            return (0, statusCodes_1.sendStatus401)(res);
        }
        const svr = await (0, crud_session_1.validateSessionToken)(token);
        if (!svr.user) {
            return res.status(403).end();
        }
        if (rolesPermitted.includes(svr.user.auth) || (svr.user.id && svr.user.id === req.params.userId && rolesPermitted.includes(auth_1.Auth.SELF))) {
            return next();
        }
        return (0, statusCodes_1.sendStatus401)(res);
    };
}

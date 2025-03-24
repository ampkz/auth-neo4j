import { Auth } from '../auth/auth';
import { sendStatus401 } from './statusCodes';
import { validateSessionToken } from '../sessions/crud-session';
export function permitRoles(...rolesPermitted) {
    return async (req, res, next) => {
        const token = req.cookies.token;
        if (!token) {
            return sendStatus401(res);
        }
        const svr = await validateSessionToken(token);
        if (!svr.user) {
            return res.status(403).end();
        }
        if (rolesPermitted.includes(svr.user.auth) || (svr.user.id && svr.user.id === req.params.userId && rolesPermitted.includes(Auth.SELF))) {
            return next();
        }
        return sendStatus401(res);
    };
}

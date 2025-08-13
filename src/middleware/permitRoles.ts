import { NextFunction, Request, Response } from 'express';
import { Auth } from '../auth/auth';
import { sendStatus401 } from './statusCodes';
import { SessionValidationResult } from '../sessions/session';
import { validateSessionToken } from '../sessions/crud-session';

export function permitRoles(...rolesPermitted: Array<Auth>) {
	return async (req: Request, res: Response, next: NextFunction) => {
		const token = req.cookies.token;

		if (!token) {
			return sendStatus401(res);
		}

		const svr: SessionValidationResult = await validateSessionToken(token);

		if (!svr.user) {
			return res.status(403).end();
		}

		if (rolesPermitted.includes(svr.user.auth) || (svr.user.id && svr.user.id === req.params.id && rolesPermitted.includes(Auth.SELF))) {
			return next();
		}

		return sendStatus401(res);
	};
}

import { NextFunction, Request, Response } from 'express';
import { Auth } from '../auth/auth';
import { sendStatus401 } from './statusCodes';
import { SessionValidationResult } from '../sessions/session';
import { validateSessionToken } from '../sessions/crud-session';
import logger from '../api/utils/logger';

export function permitRoles(...rolesPermitted: Array<Auth>) {
	return async (req: Request, res: Response, next: NextFunction) => {
		const token = req.cookies.token;
		/*istanbul ignore next line*/
		const host = req.headers['host'] || '';
		const userAgent = req.headers['user-agent'] || '';

		if (!token) {
			logger.warn(`Unauthorized access attempt.`, { host, 'user-agent': userAgent });
			return sendStatus401(res);
		}

		const svr: SessionValidationResult = await validateSessionToken(token);

		if (!svr.user) {
			logger.warn(`Invalid session token.`, { host, 'user-agent': userAgent });
			return res.status(403).end();
		}

		if (rolesPermitted.includes(svr.user.auth) || (svr.user.id && svr.user.id === req.params.id && rolesPermitted.includes(Auth.SELF))) {
			res.locals.authorizedUserEmail = svr.user.email;
			res.locals.authorizedAuth = svr.user.auth;
			return next();
		}

		logger.warn(`Unauthorized access attempt.`, { host, 'user-agent': userAgent });

		return sendStatus401(res);
	};
}

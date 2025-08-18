import { Request, Response } from 'express';
import { FieldError, FieldErrors, RoutingErrors } from '../../errors/errors';
import { checkPassword } from '../../users/pwd';
import { User } from '../../users/user';
import { sendStatus401 } from '../../middleware/statusCodes';
import { SessionValidationResult } from '../../sessions/session';
import {
	generateSessionToken,
	createSession,
	invalidateSession,
	validateSessionToken,
	invalidateAllSessions as sessionInvalidateAll,
	hasSession,
} from '../../sessions/crud-session';

import Config from '../../config/config';
import logger from '../../api/utils/logger';

export async function login(req: Request, res: Response) {
	const { email, password } = req.body;
	/*istanbul ignore next line*/
	const host = req.headers['host'] || '';
	const userAgent = req.headers['user-agent'] || '';

	const required: FieldErrors = new FieldErrors(RoutingErrors.INVALID_REQUEST);

	if (!email) required.addFieldError(new FieldError('email', FieldError.REQUIRED));
	if (!password) required.addFieldError(new FieldError('password', FieldError.REQUIRED));

	if (required.hasFieldErrors()) {
		return res.status(required.getCode()).json({ message: required.message, data: required.getFields() }).end();
	}

	const user: User | undefined = await checkPassword(email, password);

	if (user === undefined) {
		logger.warn(`Unauthorized access attempt for email: ${email} from host: ${host} with user-agent: ${userAgent}`);
		return sendStatus401(res);
	}

	const existingSessionId = await hasSession(email, host, userAgent);

	if (existingSessionId) await invalidateSession(existingSessionId);

	const token: string = generateSessionToken();

	await createSession(token, email, host, userAgent);

	logger.info(`User ${email} logged in from host: ${host} with user-agent: ${userAgent}`);

	return res
		.status(200)
		.cookie(`token`, token, { httpOnly: true, maxAge: Config.COOKIE_EXPIRATION, sameSite: Config.SAME_SITE, secure: Config.SECURE })
		.json({ id: user.id })
		.end();
}

export async function logout(req: Request, res: Response) {
	const token = req.cookies.token;
	/*istanbul ignore next line*/
	const host = req.headers['host'] || '';
	const userAgent = req.headers['user-agent'] || '';

	if (!token) {
		return res.status(204).end();
	}

	const svr: SessionValidationResult = await validateSessionToken(token);

	if (svr.session) {
		await invalidateSession(svr.session.id);
		logger.info(`User ${svr.session.userID} logged out from host: ${host} with user-agent: ${userAgent}`);
	}

	return res.status(204).clearCookie('token').end();
}

export async function invalidateAllSessions(req: Request, res: Response) {
	const token = req.cookies.token;
	/*istanbul ignore next line*/
	const host = req.headers['host'] || '';
	const userAgent = req.headers['user-agent'] || '';

	if (!token) {
		logger.warn(`Unauthorized access attempt to invalidate all sessions from host: ${host} with user-agent: ${userAgent}`);
		return sendStatus401(res);
	}

	const { email } = req.body;

	const required: FieldErrors = new FieldErrors(RoutingErrors.INVALID_REQUEST);

	if (!email) required.addFieldError(new FieldError('email', FieldError.REQUIRED));

	if (required.hasFieldErrors()) {
		return res.status(required.getCode()).json({ message: required.message, data: required.getFields() }).end();
	}

	const svr: SessionValidationResult = await validateSessionToken(token);

	if (svr.session) {
		await sessionInvalidateAll(email);
		logger.info(`All sessions for user ${email} invalidated from host: ${host} with user-agent: ${userAgent}`);
	}

	return res.status(204).clearCookie('token').end();
}

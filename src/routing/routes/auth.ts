import { Request, Response } from 'express';
import { FieldError, FieldErrors, RoutingErrors } from '../../errors/errors';
import { checkPassword } from '../../users/pwd';
import { User } from '../../users/user';
import { sendStatus401 } from '../../middleware/statusCodes';
import { SessionValidationResult } from '../../sessions/session';
import { generateSessionToken, createSession, invalidateSession, validateSessionToken } from '../../sessions/crud-session';

import Config from '../../config/config';

export async function login(req: Request, res: Response) {
	const { email, password } = req.body;

	const required: FieldErrors = new FieldErrors(RoutingErrors.INVALID_REQUEST);

	if (!email) required.addFieldError(new FieldError('email', FieldError.REQUIRED));
	if (!password) required.addFieldError(new FieldError('password', FieldError.REQUIRED));

	if (required.hasFieldErrors()) {
		return res.status(required.getCode()).json({ message: required.message, data: required.getFields() }).end();
	}

	const user: User | undefined = await checkPassword(email, password);

	if (user === undefined) {
		return sendStatus401(res);
	}

	const token: string = generateSessionToken();

	await createSession(token, email);

	return res
		.status(204)
		.cookie(`token`, token, { httpOnly: true, maxAge: Config.COOKIE_EXPIRATION, sameSite: Config.SAME_SITE, secure: Config.SECURE })
		.end();
}

export async function logout(req: Request, res: Response) {
	const token = req.cookies.token;

	if (!token) {
		return res.status(204).end();
	}

	const svr: SessionValidationResult = await validateSessionToken(token);

	if (svr.session) {
		await invalidateSession(svr.session.id);
	}

	return res.status(204).clearCookie('token').end();
}

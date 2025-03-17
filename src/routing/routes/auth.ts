import { Request, Response } from 'express';
import { FieldError, FieldErrors, RoutingErrors } from '../../errors/errors';
import { checkPassword, User } from '../../users/user';
import { sendStatus401 } from '../../middleware/statusCodes';
import { generateSessionToken } from '../../sessions/session';
import { createSession } from '../../sessions/crud-session';

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
		.cookie(`token`, token, { httpOnly: true, maxAge: parseInt(process.env.AUTH_NEO4J_COOKIE_EXPIRATION as string), sameSite: 'strict' })
		.end();
}

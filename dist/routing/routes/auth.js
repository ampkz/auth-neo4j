import { FieldError, FieldErrors, RoutingErrors } from '../../errors/errors';
import { checkPassword } from '../../users/user';
import { sendStatus401 } from '../../middleware/statusCodes';
import { generateSessionToken } from '../../sessions/session';
import { createSession, invalidateSession, validateSessionToken } from '../../sessions/crud-session';
export async function login(req, res) {
    const { email, password } = req.body;
    const required = new FieldErrors(RoutingErrors.INVALID_REQUEST);
    if (!email)
        required.addFieldError(new FieldError('email', FieldError.REQUIRED));
    if (!password)
        required.addFieldError(new FieldError('password', FieldError.REQUIRED));
    if (required.hasFieldErrors()) {
        return res.status(required.getCode()).json({ message: required.message, data: required.getFields() }).end();
    }
    const user = await checkPassword(email, password);
    if (user === undefined) {
        return sendStatus401(res);
    }
    const token = generateSessionToken();
    await createSession(token, email);
    return res
        .status(204)
        .cookie(`token`, token, { httpOnly: true, maxAge: parseInt(process.env.AUTH_NEO4J_COOKIE_EXPIRATION), sameSite: 'strict' })
        .end();
}
export async function logout(req, res) {
    const token = req.cookies.token;
    if (!token) {
        return res.status(204).end();
    }
    const svr = await validateSessionToken(token);
    if (svr.session) {
        await invalidateSession(svr.session.id);
    }
    return res.status(204).clearCookie('token').end();
}

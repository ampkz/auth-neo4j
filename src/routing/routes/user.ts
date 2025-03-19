import { Request, Response } from 'express';
import { User } from '../../users/user';
import { getAllUsers, createUser as dbCreateUser } from '../../users/crud-user';
import { FieldError, FieldErrors, RoutingErrors } from '../../errors/errors';
import { isValidAuth } from '../../auth/auth';

export async function getUsers(req: Request, res: Response) {
	const users: Array<User> = await getAllUsers();

	return res.status(200).json(users);
}

export async function createUser(req: Request, res: Response) {
	const { email, auth, firstName, lastName, secondName, password } = req.body;

	const required: FieldErrors = new FieldErrors(RoutingErrors.INVALID_REQUEST);

	if (!email) required.addFieldError(new FieldError(`email`, FieldError.REQUIRED));
	if (!auth) required.addFieldError(new FieldError(`auth`, FieldError.REQUIRED));
	if (!password) required.addFieldError(new FieldError(`password`, FieldError.REQUIRED));
	if (!isValidAuth(auth)) required.addFieldError(new FieldError(`auth`, FieldError.INVALID_AUTH));

	if (required.hasFieldErrors()) {
		return res.status(required.getCode()).json({ message: required.message, data: required.getFields() }).end();
	}

	const user: User | undefined = await dbCreateUser(new User({ email, auth, firstName, lastName, secondName }), password);

	if (user) {
		return res.set('Location', `/${user.id}`).status(201).json(user).end();
	} else {
		return res.status(422).end();
	}
}

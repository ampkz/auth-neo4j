import { Request, Response } from 'express';
import { User } from '../../users/user';
import {
	getAllUsers,
	createUser as dbCreateUser,
	deleteUser as dbDeleteUser,
	getUser as dbGetUser,
	updateUser as dbUpdateUser,
} from '../../users/crud-user';
import { FieldError, FieldErrors, RoutingErrors } from '../../errors/errors';
import { isRoleEscalation, isValidAuth } from '../../auth/auth';
import logger from '../../api/utils/logger';
import { isValidPassword } from '../../api/utils/validators';

export async function getUsers(req: Request, res: Response) {
	/*istanbul ignore next line*/
	const host = req.headers['host'] || '';
	const userAgent = req.headers['user-agent'] || '';

	const users: Array<User> = await getAllUsers();

	const authorizedUserEmail = res.locals.authorizedUserEmail;

	logger.info(`Retrieved ${users.length} users.`, { authorizedUserEmail, host, 'user-agent': userAgent });

	return res.status(200).json(users);
}

export async function getUser(req: Request, res: Response) {
	const { id } = req.params;
	/*istanbul ignore next line*/
	const host = req.headers['host'] || '';
	const userAgent = req.headers['user-agent'] || '';

	const authorizedUserEmail = res.locals.authorizedUserEmail;

	const user: User | undefined = await dbGetUser(id);

	if (!user) {
		logger.warn(`User not found.`, { authorizedUserEmail, id, host, 'user-agent': userAgent });
		return res.status(404).end();
	}

	logger.info(`Retrieved user.`, { authorizedUserEmail, id, host, 'user-agent': userAgent });

	return res.status(200).json(user).end();
}

export async function createUser(req: Request, res: Response) {
	const { email, auth, firstName, lastName, secondName, password } = req.body;

	/*istanbul ignore next line*/
	const host = req.headers['host'] || '';
	const userAgent = req.headers['user-agent'] || '';

	const required: FieldErrors = new FieldErrors(RoutingErrors.INVALID_REQUEST);

	if (!email) required.addFieldError(new FieldError(`email`, FieldError.REQUIRED));
	if (!auth) required.addFieldError(new FieldError(`auth`, FieldError.REQUIRED));
	if (!password) required.addFieldError(new FieldError(`password`, FieldError.REQUIRED));
	if (!isValidAuth(auth)) required.addFieldError(new FieldError(`auth`, FieldError.INVALID_AUTH));

	const passwordValidation = isValidPassword(password);

	if (passwordValidation.length > 0) required.addFieldError(new FieldError(`password`, FieldError.INVALID_PASSWORD, passwordValidation));

	if (required.hasFieldErrors()) {
		return res.status(required.getCode()).json({ message: required.message, data: required.getFields() }).end();
	}

	const authorizedUserEmail = res.locals.authorizedUserEmail;

	const user: User | undefined = await dbCreateUser(new User({ email, auth, firstName, lastName, secondName }), password);

	if (user) {
		logger.info(`User created successfully.`, { authorizedUserEmail, id: user.id, email, host, 'user-agent': userAgent });
		return res.set('Location', `/${user.id}`).status(201).json(user).end();
	} else {
		logger.warn(`Failed to create user.`, { authorizedUserEmail, email, host, 'user-agent': userAgent });
		return res.status(422).end();
	}
}

export async function deleteUser(req: Request, res: Response) {
	const { id } = req.params;
	/*istanbul ignore next line*/
	const host = req.headers['host'] || '';
	const userAgent = req.headers['user-agent'] || '';

	const authorizedUserEmail = res.locals.authorizedUserEmail;

	const deletedUser: User | undefined = await dbDeleteUser(id);

	if (deletedUser) {
		logger.info(`User deleted successfully.`, { authorizedUserEmail, id, host, 'user-agent': userAgent });
		return res.status(204).end();
	} else {
		logger.warn(`Failed to delete user.`, { authorizedUserEmail, id, host, 'user-agent': userAgent });
		return res.status(422).end();
	}
}

export async function updateUser(req: Request, res: Response) {
	const { id } = req.params;
	const {
		auth: updatedAuth,
		email: updatedEmail,
		firstName: updatedFirstName,
		lastName: updatedLastName,
		secondName: updatedSecondName,
		password: updatedPassword,
	} = req.body;
	/*istanbul ignore next line*/
	const host = req.headers['host'] || '';
	const userAgent = req.headers['user-agent'] || '';

	const required: FieldErrors = new FieldErrors(RoutingErrors.INVALID_REQUEST);

	if (updatedAuth && !isValidAuth(updatedAuth)) required.addFieldError(new FieldError(`auth`, FieldError.INVALID_AUTH));

	if (updatedPassword) {
		const passwordValidation = isValidPassword(updatedPassword);

		if (passwordValidation.length > 0) required.addFieldError(new FieldError(`password`, FieldError.INVALID_PASSWORD, passwordValidation));
	}

	if (required.hasFieldErrors()) {
		return res.status(required.getCode()).json({ message: required.message, data: required.getFields() }).end();
	}

	const authorizedUserEmail = res.locals.authorizedUserEmail;
	const authorizedUserAuth = res.locals.authorizedAuth;

	const user: User | undefined = await dbGetUser(id);

	if (!user) {
		logger.warn(`User not found.`, { authorizedUserEmail, id, host, 'user-agent': userAgent });
		return res.status(404).end();
	}

	if (updatedAuth && isRoleEscalation(authorizedUserEmail, user.email, authorizedUserAuth, updatedAuth)) {
		logger.warn(`User attempted role escalation.`, {
			authorizedUserEmail,
			id,
			email: user.email,
			auth: user.auth,
			updatedAuth,
			host,
			'user-agent': userAgent,
		});
		return res.status(403).end();
	}

	const updatedUser: User | undefined = await dbUpdateUser(id, {
		updatedAuth,
		updatedEmail,
		updatedFirstName,
		updatedLastName,
		updatedPassword,
		updatedSecondName,
	});

	if (!updatedUser) {
		logger.warn(`Failed to update user.`, { authorizedUserEmail, id, host, 'user-agent': userAgent });
		return res.status(422).end();
	}

	logger.info(`User updated successfully.`, { authorizedUserEmail, id, host, 'user-agent': userAgent });

	return res.status(200).json(updatedUser).end();
}

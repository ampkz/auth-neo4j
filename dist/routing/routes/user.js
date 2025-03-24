import { User } from '../../users/user';
import { getAllUsers, createUser as dbCreateUser, deleteUser as dbDeleteUser, getUser as dbGetUser, updateUser as dbUpdateUser, } from '../../users/crud-user';
import { FieldError, FieldErrors, RoutingErrors } from '../../errors/errors';
import { isRoleEscalation, isValidAuth } from '../../auth/auth';
export async function getUsers(req, res) {
    const users = await getAllUsers();
    return res.status(200).json(users);
}
export async function getUser(req, res) {
    const { id } = req.params;
    const user = await dbGetUser(id);
    if (!user) {
        return res.status(404).end();
    }
    return res.status(200).json(user).end();
}
export async function createUser(req, res) {
    const { email, auth, firstName, lastName, secondName, password } = req.body;
    const required = new FieldErrors(RoutingErrors.INVALID_REQUEST);
    if (!email)
        required.addFieldError(new FieldError(`email`, FieldError.REQUIRED));
    if (!auth)
        required.addFieldError(new FieldError(`auth`, FieldError.REQUIRED));
    if (!password)
        required.addFieldError(new FieldError(`password`, FieldError.REQUIRED));
    if (!isValidAuth(auth))
        required.addFieldError(new FieldError(`auth`, FieldError.INVALID_AUTH));
    if (required.hasFieldErrors()) {
        return res.status(required.getCode()).json({ message: required.message, data: required.getFields() }).end();
    }
    const user = await dbCreateUser(new User({ email, auth, firstName, lastName, secondName }), password);
    if (user) {
        return res.set('Location', `/${user.id}`).status(201).json(user).end();
    }
    else {
        return res.status(422).end();
    }
}
export async function deleteUser(req, res) {
    const { id } = req.params;
    const deletedUser = await dbDeleteUser(id);
    if (deletedUser) {
        return res.status(204).end();
    }
    else {
        return res.status(422).end();
    }
}
export async function updateUser(req, res) {
    const { id } = req.params;
    const { updatedAuth, updatedEmail, updatedFirstName, updatedLastName, updatedSecondName, updatedPassword } = req.body;
    const required = new FieldErrors(RoutingErrors.INVALID_REQUEST);
    if (updatedAuth && !isValidAuth(updatedAuth))
        required.addFieldError(new FieldError(`updatedAuth`, FieldError.INVALID_AUTH));
    if (required.hasFieldErrors()) {
        return res.status(required.getCode()).json({ message: required.message, data: required.getFields() }).end();
    }
    const user = await dbGetUser(id);
    if (!user) {
        return res.status(404).end();
    }
    if (isRoleEscalation(user.auth, updatedAuth)) {
        return res.status(403).end();
    }
    const updatedUser = await dbUpdateUser(id, {
        updatedAuth,
        updatedEmail,
        updatedFirstName,
        updatedLastName,
        updatedPassword,
        updatedSecondName,
    });
    if (!updatedUser) {
        return res.status(422).end();
    }
    return res.status(200).json(updatedUser).end();
}

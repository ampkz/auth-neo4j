"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = getUsers;
exports.getUser = getUser;
exports.createUser = createUser;
exports.deleteUser = deleteUser;
exports.updateUser = updateUser;
const user_1 = require("../../users/user");
const crud_user_1 = require("../../users/crud-user");
const errors_1 = require("../../errors/errors");
const auth_1 = require("../../auth/auth");
async function getUsers(req, res) {
    const users = await (0, crud_user_1.getAllUsers)();
    return res.status(200).json(users);
}
async function getUser(req, res) {
    const { id } = req.params;
    const user = await (0, crud_user_1.getUser)(id);
    if (!user) {
        return res.status(404).end();
    }
    return res.status(200).json(user).end();
}
async function createUser(req, res) {
    const { email, auth, firstName, lastName, secondName, password } = req.body;
    const required = new errors_1.FieldErrors(errors_1.RoutingErrors.INVALID_REQUEST);
    if (!email)
        required.addFieldError(new errors_1.FieldError(`email`, errors_1.FieldError.REQUIRED));
    if (!auth)
        required.addFieldError(new errors_1.FieldError(`auth`, errors_1.FieldError.REQUIRED));
    if (!password)
        required.addFieldError(new errors_1.FieldError(`password`, errors_1.FieldError.REQUIRED));
    if (!(0, auth_1.isValidAuth)(auth))
        required.addFieldError(new errors_1.FieldError(`auth`, errors_1.FieldError.INVALID_AUTH));
    if (required.hasFieldErrors()) {
        return res.status(required.getCode()).json({ message: required.message, data: required.getFields() }).end();
    }
    const user = await (0, crud_user_1.createUser)(new user_1.User({ email, auth, firstName, lastName, secondName }), password);
    if (user) {
        return res.set('Location', `/${user.id}`).status(201).json(user).end();
    }
    else {
        return res.status(422).end();
    }
}
async function deleteUser(req, res) {
    const { id } = req.params;
    const deletedUser = await (0, crud_user_1.deleteUser)(id);
    if (deletedUser) {
        return res.status(204).end();
    }
    else {
        return res.status(422).end();
    }
}
async function updateUser(req, res) {
    const { id } = req.params;
    const { updatedAuth, updatedEmail, updatedFirstName, updatedLastName, updatedSecondName, updatedPassword } = req.body;
    const required = new errors_1.FieldErrors(errors_1.RoutingErrors.INVALID_REQUEST);
    if (updatedAuth && !(0, auth_1.isValidAuth)(updatedAuth))
        required.addFieldError(new errors_1.FieldError(`updatedAuth`, errors_1.FieldError.INVALID_AUTH));
    if (required.hasFieldErrors()) {
        return res.status(required.getCode()).json({ message: required.message, data: required.getFields() }).end();
    }
    const user = await (0, crud_user_1.getUser)(id);
    if (!user) {
        return res.status(404).end();
    }
    if ((0, auth_1.isRoleEscalation)(user.auth, updatedAuth)) {
        return res.status(403).end();
    }
    const updatedUser = await (0, crud_user_1.updateUser)(id, {
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

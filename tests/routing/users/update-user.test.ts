import { Express } from 'express';
import authNeo4j from '../../../src';
import request from 'supertest';
import { generateSessionToken } from '../../../src/sessions/session';
import * as crudSession from '../../../src/sessions/crud-session';
import * as crudUser from '../../../src/users/crud-user';
import { Auth } from '../../../src/auth/auth';
import { User } from '../../../src/users/user';
import { faker } from '@faker-js/faker';
import { FieldError, RoutingErrors } from '../../../src/errors/errors';

describe(`Update User Route Tests`, () => {
	let app: Express;

	beforeAll(async () => {
		app = await authNeo4j();
	});

	beforeEach(() => {
		jest.restoreAllMocks();
	});

	test(`${process.env.AUTH_NEO4J_USER_URI}/:userId should send 403 status if the session couldn't be validated`, async () => {
		const token = generateSessionToken();

		const validateSessionTokenSpy = jest.spyOn(crudSession, 'validateSessionToken');
		validateSessionTokenSpy.mockResolvedValueOnce({
			session: null,
			user: null,
		});

		await request(app).put(`${process.env.AUTH_NEO4J_USER_URI}/${faker.database.mongodbObjectId()}`).set('Cookie', `token=${token}`).expect(403);
	});

	test(`${process.env.AUTH_NEO4J_USER_URI}/:userId should send 401 status with contributor auth`, async () => {
		const token = generateSessionToken();

		const validateSessionTokenSpy = jest.spyOn(crudSession, 'validateSessionToken');
		validateSessionTokenSpy.mockResolvedValueOnce({
			session: { id: '', userID: '', expiresAt: new Date() },
			user: { id: '', email: '', auth: Auth.CONTRIBUTOR },
		});

		await request(app).put(`${process.env.AUTH_NEO4J_USER_URI}/${faker.database.mongodbObjectId()}`).set('Cookie', `token=${token}`).expect(401);
	});

	test(`${process.env.AUTH_NEO4J_USER_URI} should send 401 status without token cookie`, async () => {
		await request(app).put(`${process.env.AUTH_NEO4J_USER_URI}/${faker.database.mongodbObjectId()}`).expect(401);
	});

	test(`${process.env.AUTH_NEO4J_USER_URI}/:userId should send 400 status with invalid updatedAuth type`, async () => {
		const token = generateSessionToken();

		const validateSessionTokenSpy = jest.spyOn(crudSession, 'validateSessionToken');
		validateSessionTokenSpy.mockResolvedValueOnce({
			session: { id: '', userID: '', expiresAt: new Date() },
			user: { id: '', email: '', auth: Auth.ADMIN },
		});

		await request(app)
			.put(`${process.env.AUTH_NEO4J_USER_URI}/${faker.database.mongodbObjectId()}`)
			.set('Cookie', `token=${token}`)
			.send({ updatedAuth: 'not auth' })
			.expect(400)
			.then(response => {
				expect(response.body.message).toBe(RoutingErrors.INVALID_REQUEST);
				expect(response.body.data).toContainEqual({ field: 'updatedAuth', message: FieldError.INVALID_AUTH });
			});
	});

	test(`${process.env.AUTH_NEO4J_USER_URI}/:userId should send 404 status if no user was found`, async () => {
		const token = generateSessionToken();

		const validateSessionTokenSpy = jest.spyOn(crudSession, 'validateSessionToken');
		validateSessionTokenSpy.mockResolvedValueOnce({
			session: { id: '', userID: '', expiresAt: new Date() },
			user: { id: '', email: '', auth: Auth.ADMIN },
		});

		const getUserSpy = jest.spyOn(crudUser, 'getUser');
		getUserSpy.mockResolvedValue(undefined);

		await request(app).put(`${process.env.AUTH_NEO4J_USER_URI}/${faker.database.mongodbObjectId()}`).set('Cookie', `token=${token}`).expect(404);
	});

	test(`${process.env.AUTH_NEO4J_USER_URI}/:userId should send 403 status if a contributor is trying to escalate their role to admin`, async () => {
		const token = generateSessionToken();

		const validateSessionTokenSpy = jest.spyOn(crudSession, 'validateSessionToken');
		validateSessionTokenSpy.mockResolvedValueOnce({
			session: { id: '', userID: '', expiresAt: new Date() },
			user: { id: '', email: '', auth: Auth.ADMIN },
		});

		const getUserSpy = jest.spyOn(crudUser, 'getUser');
		getUserSpy.mockResolvedValue(new User({ email: faker.internet.email(), auth: Auth.CONTRIBUTOR }));

		await request(app)
			.put(`${process.env.AUTH_NEO4J_USER_URI}/${faker.database.mongodbObjectId()}`)
			.set('Cookie', `token=${token}`)
			.send({ updatedAuth: Auth.ADMIN })
			.expect(403);
	});

	test(`${process.env.AUTH_NEO4J_USER_URI}/:userId should send 422 status if no user was updated`, async () => {
		const token = generateSessionToken();

		const validateSessionTokenSpy = jest.spyOn(crudSession, 'validateSessionToken');
		validateSessionTokenSpy.mockResolvedValueOnce({
			session: { id: '', userID: '', expiresAt: new Date() },
			user: { id: '', email: '', auth: Auth.ADMIN },
		});

		const getUserSpy = jest.spyOn(crudUser, 'getUser');
		getUserSpy.mockResolvedValue(new User({ email: faker.internet.email(), auth: Auth.ADMIN }));

		const updateUserSpy = jest.spyOn(crudUser, 'updateUser');
		updateUserSpy.mockResolvedValue(undefined);

		await request(app).put(`${process.env.AUTH_NEO4J_USER_URI}/${faker.database.mongodbObjectId()}`).set('Cookie', `token=${token}`).expect(422);
	});

	test(`${process.env.AUTH_NEO4J_USER_URI}/:userId should send 200 status with updated user on a successful update as admin`, async () => {
		const token = generateSessionToken(),
			updatedAuth = Auth.CONTRIBUTOR,
			updatedEmail = faker.internet.email(),
			updatedFirstName = faker.person.firstName(),
			updatedLastName = faker.person.lastName(),
			updatedSecondName = faker.person.middleName(),
			updatedPassword = faker.internet.password();

		const validateSessionTokenSpy = jest.spyOn(crudSession, 'validateSessionToken');
		validateSessionTokenSpy.mockResolvedValueOnce({
			session: { id: '', userID: '', expiresAt: new Date() },
			user: { id: '', email: '', auth: Auth.ADMIN },
		});

		const getUserSpy = jest.spyOn(crudUser, 'getUser');
		getUserSpy.mockResolvedValue(new User({ email: faker.internet.email(), auth: Auth.ADMIN }));

		const updatedUser = new User({
			auth: updatedAuth,
			email: updatedEmail,
			firstName: updatedFirstName,
			lastName: updatedLastName,
			secondName: updatedSecondName,
		});

		const updateUserSpy = jest.spyOn(crudUser, 'updateUser');
		updateUserSpy.mockResolvedValue(updatedUser);

		await request(app)
			.put(`${process.env.AUTH_NEO4J_USER_URI}/${faker.database.mongodbObjectId()}`)
			.set('Cookie', `token=${token}`)
			.send({ updatedAuth, updatedEmail, updatedFirstName, updatedPassword, updatedLastName, updatedSecondName })
			.expect(200)
			.then(response => {
				expect(response.body).toEqual(updatedUser);
			});
	});

	test(`${process.env.AUTH_NEO4J_USER_URI}/:userId should send 200 status with updated user on a successful update as self contributor`, async () => {
		const token = generateSessionToken(),
			updatedAuth = Auth.CONTRIBUTOR,
			updatedEmail = faker.internet.email(),
			updatedFirstName = faker.person.firstName(),
			updatedLastName = faker.person.lastName(),
			updatedSecondName = faker.person.middleName(),
			updatedPassword = faker.internet.password(),
			id = faker.database.mongodbObjectId();

		const validateSessionTokenSpy = jest.spyOn(crudSession, 'validateSessionToken');
		validateSessionTokenSpy.mockResolvedValueOnce({
			session: { id: '', userID: '', expiresAt: new Date() },
			user: { id, email: '', auth: Auth.CONTRIBUTOR },
		});

		const getUserSpy = jest.spyOn(crudUser, 'getUser');
		getUserSpy.mockResolvedValue(new User({ id, email: faker.internet.email(), auth: Auth.ADMIN }));

		const updatedUser = new User({
			auth: updatedAuth,
			email: updatedEmail,
			firstName: updatedFirstName,
			lastName: updatedLastName,
			secondName: updatedSecondName,
			id,
		});

		const updateUserSpy = jest.spyOn(crudUser, 'updateUser');
		updateUserSpy.mockResolvedValue(updatedUser);

		await request(app)
			.put(`${process.env.AUTH_NEO4J_USER_URI}/${id}`)
			.set('Cookie', `token=${token}`)
			.send({ updatedAuth, updatedEmail, updatedFirstName, updatedPassword, updatedLastName, updatedSecondName })
			.expect(200)
			.then(response => {
				expect(response.body).toEqual(updatedUser);
			});
	});
});

import { Express } from 'express';
import authNeo4j from '../../../src';
import request from 'supertest';
import { generateSessionToken } from '../../../src/sessions/session';
import * as crudSession from '../../../src/sessions/crud-session';
import * as crudUser from '../../../src/users/crud-user';
import { Auth } from '../../../src/auth/auth';
import { User } from '../../../src/users/user';
import { faker } from '@faker-js/faker';

describe(`Auth Route Tests`, () => {
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

		await request(app)
			.delete(`${process.env.AUTH_NEO4J_USER_URI}/${faker.database.mongodbObjectId()}`)
			.set('Cookie', `token=${token}`)
			.expect(403);
	});

	test(`${process.env.AUTH_NEO4J_USER_URI}/:userId should send 401 status without token cookie`, async () => {
		await request(app).delete(`${process.env.AUTH_NEO4J_USER_URI}/${faker.database.mongodbObjectId()}`).expect(401);
	});

	test(`${process.env.AUTH_NEO4J_USER_URI}/:userId should send 422 status if no user was deleted`, async () => {
		const token = generateSessionToken();

		const validateSessionTokenSpy = jest.spyOn(crudSession, 'validateSessionToken');
		validateSessionTokenSpy.mockResolvedValueOnce({
			session: { id: '', userID: '', expiresAt: new Date() },
			user: { id: '', email: '', auth: Auth.ADMIN },
		});

		const deleteUserSpy = jest.spyOn(crudUser, 'deleteUser');
		deleteUserSpy.mockResolvedValue(undefined);

		await request(app)
			.delete(`${process.env.AUTH_NEO4J_USER_URI}/${faker.database.mongodbObjectId()}`)
			.set('Cookie', `token=${token}`)
			.expect(422);
	});

	test(`${process.env.AUTH_NEO4J_USER_URI}/:userId should send 401 status as contributor`, async () => {
		const token = generateSessionToken();

		const validateSessionTokenSpy = jest.spyOn(crudSession, 'validateSessionToken');
		validateSessionTokenSpy.mockResolvedValueOnce({
			session: { id: '', userID: '', expiresAt: new Date() },
			user: { id: '', email: '', auth: Auth.CONTRIBUTOR },
		});

		await request(app)
			.delete(`${process.env.AUTH_NEO4J_USER_URI}/${faker.database.mongodbObjectId()}`)
			.set('Cookie', `token=${token}`)
			.expect(401);
	});

	test(`${process.env.AUTH_NEO4J_USER_URI}/:userId should send 204 status if user was deleted as admin`, async () => {
		const token = generateSessionToken(),
			email = faker.internet.email(),
			id = faker.database.mongodbObjectId(),
			auth = Auth.ADMIN,
			firstName = faker.person.firstName(),
			lastName = faker.person.lastName(),
			secondName = faker.person.middleName();

		const validateSessionTokenSpy = jest.spyOn(crudSession, 'validateSessionToken');
		validateSessionTokenSpy.mockResolvedValueOnce({
			session: { id: '', userID: '', expiresAt: new Date() },
			user: { id: '', email: '', auth: Auth.ADMIN },
		});

		const user: User = new User({ email, id, auth, firstName, lastName, secondName });

		const deleteUserSpy = jest.spyOn(crudUser, 'deleteUser');
		deleteUserSpy.mockResolvedValue(user);

		await request(app).delete(`${process.env.AUTH_NEO4J_USER_URI}/${user.id}`).set('Cookie', `token=${token}`).expect(204);
	});

	test(`${process.env.AUTH_NEO4J_USER_URI}/:userId should send 204 status if user was deleted as self contributor`, async () => {
		const token = generateSessionToken(),
			id = faker.database.mongodbObjectId();

		const validateSessionTokenSpy = jest.spyOn(crudSession, 'validateSessionToken');
		validateSessionTokenSpy.mockResolvedValueOnce({
			session: { id: '', userID: '', expiresAt: new Date() },
			user: { id, email: '', auth: Auth.CONTRIBUTOR },
		});

		const deleteUserSpy = jest.spyOn(crudUser, 'deleteUser');
		deleteUserSpy.mockResolvedValue(new User({ email: faker.internet.email(), id, auth: Auth.CONTRIBUTOR }));

		await request(app).delete(`${process.env.AUTH_NEO4J_USER_URI}/${id}`).set('Cookie', `token=${token}`).expect(204);
	});
});

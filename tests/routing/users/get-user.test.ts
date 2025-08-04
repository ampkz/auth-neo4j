import { Express } from 'express';
import authNeo4j from '../../../src';
import request from 'supertest';
import { generateSessionToken } from '../../../src/sessions/crud-session';
import * as crudSession from '../../../src/sessions/crud-session';
import * as crudUser from '../../../src/users/crud-user';
import { Auth } from '../../../src/auth/auth';
import { User } from '../../../src/users/user';
import { faker } from '@faker-js/faker';

import Config from '../../../src/config/config';

describe(`Get User Route Tests`, () => {
	let app: Express;

	beforeAll(async () => {
		app = await authNeo4j();
	});

	beforeEach(() => {
		jest.restoreAllMocks();
	});

	test(`${Config.USER_URI}/:userId should send 200 status with a user on GET as admin`, async () => {
		const token = generateSessionToken(),
			id = faker.database.mongodbObjectId();

		const user = new User({ id, email: faker.internet.email(), auth: Auth.ADMIN });

		const validateSessionTokenSpy = jest.spyOn(crudSession, 'validateSessionToken');
		validateSessionTokenSpy.mockResolvedValueOnce({
			session: { id: '', userID: '', expiresAt: new Date() },
			user: { id: '', email: '', auth: Auth.ADMIN },
		});

		const getUserSpy = jest.spyOn(crudUser, 'getUser');
		getUserSpy.mockResolvedValueOnce(user);

		await request(app)
			.get(`${Config.USER_URI}/${id}`)
			.set('Cookie', `token=${token}`)
			.expect(200)
			.then(response => {
				expect(response.body).toEqual(user);
			});
	});

	test(`${Config.USER_URI}/:userId should send 404 status if no user was found on GET as admin`, async () => {
		const token = generateSessionToken(),
			id = faker.database.mongodbObjectId();

		const validateSessionTokenSpy = jest.spyOn(crudSession, 'validateSessionToken');
		validateSessionTokenSpy.mockResolvedValueOnce({
			session: { id: '', userID: '', expiresAt: new Date() },
			user: { id: '', email: '', auth: Auth.ADMIN },
		});

		const getUserSpy = jest.spyOn(crudUser, 'getUser');
		getUserSpy.mockResolvedValueOnce(undefined);

		await request(app).get(`${Config.USER_URI}/${id}`).set('Cookie', `token=${token}`).expect(404);
	});

	test(`${Config.USER_URI}/:userId should send 200 status with a user on GET as self contirbutor`, async () => {
		const token = generateSessionToken(),
			id = faker.database.mongodbObjectId();

		const user = new User({ id, email: faker.internet.email(), auth: Auth.ADMIN });

		const validateSessionTokenSpy = jest.spyOn(crudSession, 'validateSessionToken');
		validateSessionTokenSpy.mockResolvedValueOnce({
			session: { id: '', userID: '', expiresAt: new Date() },
			user: { id, email: '', auth: Auth.CONTRIBUTOR },
		});

		const getUserSpy = jest.spyOn(crudUser, 'getUser');
		getUserSpy.mockResolvedValueOnce(user);

		await request(app)
			.get(`${Config.USER_URI}/${id}`)
			.set('Cookie', `token=${token}`)
			.expect(200)
			.then(response => {
				expect(response.body).toEqual(user);
			});
	});

	test(`${Config.USER_URI}/:userId should send 401 status without token cookie`, async () => {
		await request(app).get(`${Config.USER_URI}/${faker.database.mongodbObjectId()}`).expect(401);
	});

	test(`${Config.USER_URI}/:userId should send 403 status if the session couldn't be validated`, async () => {
		const token = generateSessionToken();

		const validateSessionTokenSpy = jest.spyOn(crudSession, 'validateSessionToken');
		validateSessionTokenSpy.mockResolvedValueOnce({
			session: null,
			user: null,
		});

		await request(app).get(`${Config.USER_URI}/${faker.database.mongodbObjectId()}`).set('Cookie', `token=${token}`).expect(403);
	});

	test(`${Config.USER_URI}/:userId should send 401 status as non-self contributor`, async () => {
		const token = generateSessionToken();

		const validateSessionTokenSpy = jest.spyOn(crudSession, 'validateSessionToken');
		validateSessionTokenSpy.mockResolvedValueOnce({
			session: { id: '', userID: '', expiresAt: new Date() },
			user: { id: '', email: '', auth: Auth.CONTRIBUTOR },
		});

		await request(app).get(`${Config.USER_URI}/${faker.database.mongodbObjectId()}`).set('Cookie', `token=${token}`).expect(401);
	});
});

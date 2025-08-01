import { Express } from 'express';
import authNeo4j from '../../../src';
import request from 'supertest';
import { generateSessionToken } from '../../../src/sessions/session';
import * as crudSession from '../../../src/sessions/crud-session';
import * as crudUser from '../../../src/users/crud-user';
import { Auth } from '../../../src/auth/auth';
import { User } from '../../../src/users/user';
import { faker } from '@faker-js/faker';

import Config from '../../../src/config/config';

describe(`Get Users Route Tests`, () => {
	let app: Express;

	beforeAll(async () => {
		app = await authNeo4j();
	});

	beforeEach(() => {
		jest.restoreAllMocks();
	});

	test(`${Config.USER_URI} should send 200 status with list of users on GET with admin auth`, async () => {
		const token = generateSessionToken();

		const userOne = new User({ email: faker.internet.email(), auth: Auth.ADMIN });
		const userTwo = new User({ email: faker.internet.email(), auth: Auth.ADMIN });
		const userThree = new User({ email: faker.internet.email(), auth: Auth.ADMIN });

		const validateSessionTokenSpy = jest.spyOn(crudSession, 'validateSessionToken');
		validateSessionTokenSpy.mockResolvedValueOnce({
			session: { id: '', userID: '', expiresAt: new Date() },
			user: { id: '', email: '', auth: Auth.ADMIN },
		});

		const getAllusersSpy = jest.spyOn(crudUser, 'getAllUsers');
		getAllusersSpy.mockResolvedValueOnce([userOne, userTwo, userThree]);

		await request(app)
			.get(Config.USER_URI)
			.set('Cookie', `token=${token}`)
			.expect(200)
			.then(response => {
				expect(response.body).toContainEqual(userOne);
				expect(response.body).toContainEqual(userTwo);
				expect(response.body).toContainEqual(userThree);
			});
	});

	test(`${Config.USER_URI} should send 401 status without token cookie`, async () => {
		await request(app).get(Config.USER_URI).expect(401);
	});

	test(`${Config.USER_URI} should send 403 status if the session couldn't be validated`, async () => {
		const token = generateSessionToken();

		const validateSessionTokenSpy = jest.spyOn(crudSession, 'validateSessionToken');
		validateSessionTokenSpy.mockResolvedValueOnce({
			session: null,
			user: null,
		});

		await request(app).get(Config.USER_URI).set('Cookie', `token=${token}`).expect(403);
	});

	test(`${Config.USER_URI} should send 401 status with contributor auth`, async () => {
		const token = generateSessionToken();

		const validateSessionTokenSpy = jest.spyOn(crudSession, 'validateSessionToken');
		validateSessionTokenSpy.mockResolvedValueOnce({
			session: { id: '', userID: '', expiresAt: new Date() },
			user: { id: '', email: '', auth: Auth.CONTRIBUTOR },
		});

		await request(app).get(Config.USER_URI).set('Cookie', `token=${token}`).expect(401);
	});
});

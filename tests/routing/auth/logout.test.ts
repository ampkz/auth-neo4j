import { Express } from 'express';
import authNeo4j from '../../../src';
import request from 'supertest';
import { faker } from '@faker-js/faker';
import * as pwd from '../../../src/users/pwd';
import { User } from '../../../src/users/user';
import * as crudSession from '../../../src/sessions/crud-session';
import { Auth } from '../../../src/auth/auth';

import Config from '../../../src/config/config';

describe(`Logout Route Tests`, () => {
	let app: Express;

	beforeAll(async () => {
		app = await authNeo4j();
	});

	beforeEach(() => {
		jest.restoreAllMocks();
	});

	test(`${Config.LOGOUT_URI} should send 405 status on PUT with Allow header 'GET'`, async () => {
		await request(app)
			.put(Config.LOGOUT_URI)
			.expect(405)
			.then(response => {
				expect(response.headers.allow).toBe('GET');
			});
	});

	test(`${Config.LOGOUT_URI} should send 405 status on POST with Allow header 'GET'`, async () => {
		await request(app)
			.post(Config.LOGOUT_URI)
			.expect(405)
			.then(response => {
				expect(response.headers.allow).toBe('GET');
			});
	});

	test(`${Config.LOGOUT_URI} should send 405 status on DELETE with Allow header 'GET'`, async () => {
		await request(app)
			.delete(Config.LOGOUT_URI)
			.expect(405)
			.then(response => {
				expect(response.headers.allow).toBe('GET');
			});
	});

	test(`${Config.LOGOUT_URI} should send 200 status if no cookie exists`, async () => {
		await request(app)
			.get(Config.LOGOUT_URI)
			.expect(204)
			.then(response => {
				expect(response.body).toEqual({});
				expect(response.header['set-cookie']).toBeUndefined();
			});
	});

	test(`${Config.LOGOUT_URI} should send 204 status and delete session cookie`, async () => {
		const checkPasswordSpy = jest.spyOn(pwd, 'checkPassword');
		checkPasswordSpy.mockResolvedValueOnce(new User({ email: faker.internet.email(), auth: Auth.ADMIN }));

		const createSessionSpy = jest.spyOn(crudSession, 'createSession');
		createSessionSpy.mockResolvedValueOnce({ id: '', userID: '', expiresAt: new Date() });

		const validateSessionTokenSpy = jest.spyOn(crudSession, 'validateSessionToken');
		validateSessionTokenSpy.mockResolvedValueOnce({
			session: { id: '', userID: '', expiresAt: new Date() },
			user: new User({ email: faker.internet.email(), auth: Auth.ADMIN }),
		});

		const invalidateSessionSpy = jest.spyOn(crudSession, 'invalidateSession');
		invalidateSessionSpy.mockResolvedValueOnce();

		const agent = request.agent(app);

		await agent
			.post(Config.LOGIN_URI)
			.send({ email: faker.internet.email(), password: faker.internet.password() })
			.expect(204)
			.then(response => {
				expect(response.body).toEqual({});
				expect(response.header['set-cookie']).toBeDefined();
				expect(response.header['set-cookie'][0]).toContain('token');
			});

		await agent
			.get(Config.LOGOUT_URI)
			.expect(204)
			.then(response => {
				expect(response.body).toEqual({});
				expect(response.header['set-cookie'][0]).toContain('token=;');
			});
	});
});

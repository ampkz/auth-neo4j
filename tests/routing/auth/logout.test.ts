import { Express } from 'express';
import authNeo4j from '../../../src';
import request from 'supertest';
import { faker } from '@faker-js/faker';
import * as user from '../../../src/users/user';
import * as crudSession from '../../../src/sessions/crud-session';
import { Auth } from '../../../src/auth/auth';

describe(`Logout Route Tests`, () => {
	let app: Express;

	beforeAll(async () => {
		app = await authNeo4j();
	});

	beforeEach(() => {
		jest.restoreAllMocks();
	});

	test(`${process.env.AUTH_NEO4J_LOGOUT_URI} should send 405 status on PUT with Allow header 'GET'`, async () => {
		await request(app)
			.put(process.env.AUTH_NEO4J_LOGOUT_URI as string)
			.expect(405)
			.then(response => {
				expect(response.headers.allow).toBe('GET');
			});
	});

	test(`${process.env.AUTH_NEO4J_LOGOUT_URI} should send 405 status on POST with Allow header 'GET'`, async () => {
		await request(app)
			.post(process.env.AUTH_NEO4J_LOGOUT_URI as string)
			.expect(405)
			.then(response => {
				expect(response.headers.allow).toBe('GET');
			});
	});

	test(`${process.env.AUTH_NEO4J_LOGOUT_URI} should send 405 status on DELETE with Allow header 'GET'`, async () => {
		await request(app)
			.delete(process.env.AUTH_NEO4J_LOGOUT_URI as string)
			.expect(405)
			.then(response => {
				expect(response.headers.allow).toBe('GET');
			});
	});

	test(`${process.env.AUTH_NEO4J_LOGOUT_URI} should send 200 status if no cookie exists`, async () => {
		await request(app)
			.get(process.env.AUTH_NEO4J_LOGOUT_URI as string)
			.expect(204)
			.then(response => {
				expect(response.body).toEqual({});
				expect(response.header['set-cookie']).toBeUndefined();
			});
	});

	test(`${process.env.AUTH_NEO4J_LOGOUT_URI} should send 204 status and delete session cookie`, async () => {
		const checkPasswordSpy = jest.spyOn(user, 'checkPassword');
		checkPasswordSpy.mockResolvedValueOnce(new user.User({ email: faker.internet.email(), auth: Auth.ADMIN }));

		const createSessionSpy = jest.spyOn(crudSession, 'createSession');
		createSessionSpy.mockResolvedValueOnce({ id: '', userID: '', expiresAt: new Date() });

		const validateSessionTokenSpy = jest.spyOn(crudSession, 'validateSessionToken');
		validateSessionTokenSpy.mockResolvedValueOnce({
			session: { id: '', userID: '', expiresAt: new Date() },
			user: new user.User({ email: faker.internet.email(), auth: Auth.ADMIN }),
		});

		const invalidateSessionSpy = jest.spyOn(crudSession, 'invalidateSession');
		invalidateSessionSpy.mockResolvedValueOnce();

		const agent = request.agent(app);

		await agent
			.post(process.env.AUTH_NEO4J_LOGIN_URI as string)
			.send({ email: faker.internet.email(), password: faker.internet.password() })
			.expect(204)
			.then(response => {
				expect(response.body).toEqual({});
				expect(response.header['set-cookie']).toBeDefined();
				expect(response.header['set-cookie'][0]).toContain('token');
			});

		await agent
			.get(process.env.AUTH_NEO4J_LOGOUT_URI as string)
			.expect(204)
			.then(response => {
				expect(response.body).toEqual({});
				expect(response.header['set-cookie'][0]).toContain('token=;');
			});
	});
});

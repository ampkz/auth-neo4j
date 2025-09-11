import { Express } from 'express';
import authNeo4j from '../../../src';
import request from 'supertest';
import { faker } from '@faker-js/faker';
import * as pwd from '../../../src/users/pwd';
import { User } from '../../../src/users/user';
import * as crudSession from '../../../src/sessions/crud-session';
import { Auth } from '../../../src/auth/auth';

import Config from '../../../src/config/config';
import { FieldError, RoutingErrors } from '../../../src/errors/errors';

import logger from '../../../src/api/utils/logger';

jest.mock('../../../src/api/utils/logger');

describe(`Logout Route Tests`, () => {
	let app: Express;

	beforeAll(() => {
		app = authNeo4j();
	});

	beforeEach(() => {
		jest.restoreAllMocks();
	});

	test(`${Config.LOGOUT_URI} should send 405 status on PUT with Allow header 'GET, POST'`, async () => {
		await request(app)
			.put(Config.LOGOUT_URI)
			.expect(405)
			.then(response => {
				expect(response.headers.allow).toBe('GET, POST');
			});
	});

	test(`${Config.LOGOUT_URI} should send 405 status on DELETE with Allow header 'GET, POST'`, async () => {
		await request(app)
			.delete(Config.LOGOUT_URI)
			.expect(405)
			.then(response => {
				expect(response.headers.allow).toBe('GET, POST');
			});
	});

	test(`${Config.LOGOUT_URI} GET should send 200 status if no cookie exists`, async () => {
		await request(app)
			.get(Config.LOGOUT_URI)
			.expect(204)
			.then(response => {
				expect(response.body).toEqual({});
				expect(response.header['set-cookie']).toBeUndefined();
			});
	});

	test(`${Config.LOGOUT_URI} GET should send 204 status and delete session cookie`, async () => {
		const checkPasswordSpy = jest.spyOn(pwd, 'checkPassword');
		checkPasswordSpy.mockResolvedValueOnce(new User({ email: faker.internet.email(), auth: Auth.ADMIN }));

		const createSessionSpy = jest.spyOn(crudSession, 'createSession');
		createSessionSpy.mockResolvedValueOnce({ id: '', userID: '', expiresAt: new Date(), clientIp: '', userAgent: '' });

		const validateSessionTokenSpy = jest.spyOn(crudSession, 'validateSessionToken');
		validateSessionTokenSpy.mockResolvedValueOnce({
			session: { id: '', userID: '', expiresAt: new Date(), clientIp: '', userAgent: '' },
			user: new User({ email: faker.internet.email(), auth: Auth.ADMIN }),
		});

		const invalidateSessionSpy = jest.spyOn(crudSession, 'invalidateSession');
		invalidateSessionSpy.mockResolvedValueOnce();

		const agent = request.agent(app);

		await agent
			.post(Config.LOGIN_URI)
			.send({ email: faker.internet.email(), password: faker.internet.password() })
			.expect(200)
			.then(response => {
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

		expect(logger.info).toHaveBeenCalledTimes(2);
	});

	test(`${Config.LOGOUT_URI} POST should send 401 status on POST without cookie`, async () => {
		await request(app)
			.post(Config.LOGOUT_URI)
			.send({ email: faker.internet.email() })
			.expect(401)
			.then(response => {
				expect(response.headers['www-authenticate']).toBe(`xBasic realm="${Config.AUTH_REALM}"`);
			});

		expect(logger.warn).toHaveBeenCalled();
	});

	test(`${Config.LOGOUT_URI} should send 400 status on POST without email`, async () => {
		const checkPasswordSpy = jest.spyOn(pwd, 'checkPassword');
		checkPasswordSpy.mockResolvedValueOnce(new User({ email: faker.internet.email(), auth: Auth.ADMIN }));

		const createSessionSpy = jest.spyOn(crudSession, 'createSession');
		createSessionSpy.mockResolvedValueOnce({ id: '', userID: '', expiresAt: new Date(), clientIp: '', userAgent: '' });

		const validateSessionTokenSpy = jest.spyOn(crudSession, 'validateSessionToken');
		validateSessionTokenSpy.mockResolvedValueOnce({
			session: { id: '', userID: '', expiresAt: new Date(), clientIp: '', userAgent: '' },
			user: new User({ email: faker.internet.email(), auth: Auth.ADMIN }),
		});

		const agent = request.agent(app);

		await agent
			.post(Config.LOGIN_URI)
			.send({ email: faker.internet.email(), password: faker.internet.password() })
			.expect(200)
			.then(response => {
				expect(response.header['set-cookie']).toBeDefined();
				expect(response.header['set-cookie'][0]).toContain('token');
			});

		await agent
			.post(Config.LOGOUT_URI)
			.send({})
			.expect(400)
			.then(response => {
				expect(response.body.message).toBe(RoutingErrors.INVALID_REQUEST);
				expect(response.body.data).toContainEqual({ field: 'email', message: FieldError.REQUIRED });
			});
	});

	test(`${Config.LOGOUT_URI} should send 204 status on POST with email`, async () => {
		const checkPasswordSpy = jest.spyOn(pwd, 'checkPassword');
		checkPasswordSpy.mockResolvedValueOnce(new User({ email: faker.internet.email(), auth: Auth.ADMIN }));

		const createSessionSpy = jest.spyOn(crudSession, 'createSession');
		createSessionSpy.mockResolvedValueOnce({ id: '', userID: '', expiresAt: new Date(), clientIp: '', userAgent: '' });

		const validateSessionTokenSpy = jest.spyOn(crudSession, 'validateSessionToken');
		validateSessionTokenSpy.mockResolvedValueOnce({
			session: { id: '', userID: '', expiresAt: new Date(), clientIp: '', userAgent: '' },
			user: new User({ email: faker.internet.email(), auth: Auth.ADMIN }),
		});

		const invalidateAllSessionsSpy = jest.spyOn(crudSession, 'invalidateAllSessions');
		invalidateAllSessionsSpy.mockResolvedValueOnce();

		const agent = request.agent(app);

		const email = faker.internet.email();

		await agent
			.post(Config.LOGIN_URI)
			.send({ email, password: faker.internet.password() })
			.expect(200)
			.then(response => {
				expect(response.header['set-cookie']).toBeDefined();
				expect(response.header['set-cookie'][0]).toContain('token');
			});

		await agent
			.post(Config.LOGOUT_URI)
			.send({ email })
			.expect(204)
			.then(response => {
				expect(response.body).toEqual({});
				expect(response.header['set-cookie'][0]).toContain('token=;');
			});

		expect(logger.info).toHaveBeenCalled();
	});
});

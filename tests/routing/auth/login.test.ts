import { Express } from 'express';
import authNeo4j from '../../../src';
import request from 'supertest';
import { faker } from '@faker-js/faker';
import { FieldError, RoutingErrors } from '../../../src/errors/errors';
import * as pwd from '../../../src/users/pwd';
import { User } from '../../../src/users/user';
import * as crudSession from '../../../src/sessions/crud-session';
import { Auth } from '../../../src/auth/auth';

import Config from '../../../src/config/config';

import logger from '../../../src/api/utils/logger';

jest.mock('../../../src/api/utils/logger');

describe(`Login Route Tests`, () => {
	let app: Express;

	beforeAll(() => {
		app = authNeo4j();
	});

	beforeEach(() => {
		jest.restoreAllMocks();
	});

	test(`${Config.LOGIN_URI} should send 405 status on PUT with Allow header 'POST'`, async () => {
		await request(app)
			.put(Config.LOGIN_URI)
			.expect(405)
			.then(response => {
				expect(response.headers.allow).toBe('POST');
			});
	});

	test(`${Config.LOGIN_URI} should send 405 status on GET with Allow header 'POST'`, async () => {
		await request(app)
			.get(Config.LOGIN_URI)
			.expect(405)
			.then(response => {
				expect(response.headers.allow).toBe('POST');
			});
	});

	test(`${Config.LOGIN_URI} should send 405 status on DELETE with Allow header 'POST'`, async () => {
		await request(app)
			.delete(Config.LOGIN_URI)
			.expect(405)
			.then(response => {
				expect(response.headers.allow).toBe('POST');
			});
	});

	test(`${Config.LOGIN_URI} should send 400 status on POST without password`, async () => {
		await request(app)
			.post(Config.LOGIN_URI)
			.send({ email: faker.internet.email() })
			.expect(400)
			.then(response => {
				expect(response.body.message).toBe(RoutingErrors.INVALID_REQUEST);
				expect(response.body.data).toContainEqual({ field: 'password', message: FieldError.REQUIRED });
			});
	});

	test(`${Config.LOGIN_URI} should send 400 status on POST without email`, async () => {
		await request(app)
			.post(Config.LOGIN_URI)
			.send({ password: faker.internet.password() })
			.expect(400)
			.then(response => {
				expect(response.body.message).toBe(RoutingErrors.INVALID_REQUEST);
				expect(response.body.data).toContainEqual({ field: 'email', message: FieldError.REQUIRED });
			});
	});

	test(`${Config.LOGIN_URI} should send 401 status with incorrect password`, async () => {
		const checkPasswordSpy = jest.spyOn(pwd, 'checkPassword');
		checkPasswordSpy.mockResolvedValueOnce(undefined);

		const email = faker.internet.email();

		await request(app)
			.post(Config.LOGIN_URI)
			.send({ email, password: faker.internet.password() })
			.expect(401)
			.then(response => {
				expect(response.headers['www-authenticate']).toBe(`xBasic realm="${Config.AUTH_REALM}"`);
			});

		expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining(`Unauthorized access attempt.`), expect.objectContaining({ email }));
	});

	test(`${Config.LOGIN_URI} should send 200 status with userId and session cookie using correct password`, async () => {
		const id = faker.database.mongodbObjectId();

		const user = new User({ id, email: faker.internet.email(), auth: Auth.ADMIN });

		const checkPasswordSpy = jest.spyOn(pwd, 'checkPassword');
		checkPasswordSpy.mockResolvedValueOnce(user);

		const hasSessionSpy = jest.spyOn(crudSession, 'hasSession');
		hasSessionSpy.mockResolvedValue(undefined);

		const createSessionSpy = jest.spyOn(crudSession, 'createSession');
		createSessionSpy.mockResolvedValueOnce({ id: '', userID: '', expiresAt: new Date(), host: '', userAgent: '' });

		await request(app)
			.post(Config.LOGIN_URI)
			.send({ email: faker.internet.email(), password: faker.internet.password() })
			.expect(200)
			.then(response => {
				expect(response.body).toEqual({ id });
				expect(response.header['set-cookie']).toBeDefined();
				expect(response.header['set-cookie'][0]).toContain('token');
			});

		expect(logger.info).toHaveBeenCalled();
	});

	test(`${Config.LOGIN_URI} should invalidate an existing session before creating a new session`, async () => {
		const id = faker.database.mongodbObjectId();

		const user = new User({ id, email: faker.internet.email(), auth: Auth.ADMIN });

		const checkPasswordSpy = jest.spyOn(pwd, 'checkPassword');
		checkPasswordSpy.mockResolvedValueOnce(user);

		const hasSessionSpy = jest.spyOn(crudSession, 'hasSession');
		hasSessionSpy.mockResolvedValue(faker.database.mongodbObjectId());

		const invalidateSessionSpy = jest.spyOn(crudSession, 'invalidateSession');
		invalidateSessionSpy.mockResolvedValue();

		const createSessionSpy = jest.spyOn(crudSession, 'createSession');
		createSessionSpy.mockResolvedValueOnce({ id: '', userID: '', expiresAt: new Date(), host: '', userAgent: '' });

		await request(app)
			.post(Config.LOGIN_URI)
			.send({ email: faker.internet.email(), password: faker.internet.password() })
			.expect(200)
			.then(response => {
				expect(response.body).toEqual({ id });
				expect(response.header['set-cookie']).toBeDefined();
				expect(response.header['set-cookie'][0]).toContain('token');
			});

		expect(logger.info).toHaveBeenCalled();
	});
});

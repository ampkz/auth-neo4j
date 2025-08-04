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

describe(`Login Route Tests`, () => {
	let app: Express;

	beforeAll(async () => {
		app = await authNeo4j();
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

		await request(app)
			.post(Config.LOGIN_URI)
			.send({ email: faker.internet.email(), password: faker.internet.password() })
			.expect(401)
			.then(response => {
				expect(response.headers['www-authenticate']).toBe(`xBasic realm="${Config.AUTH_REALM}"`);
			});
	});

	test(`${Config.LOGIN_URI} should send 204 status with session cookie using correct password`, async () => {
		const checkPasswordSpy = jest.spyOn(pwd, 'checkPassword');
		checkPasswordSpy.mockResolvedValueOnce(new User({ email: faker.internet.email(), auth: Auth.ADMIN }));

		const createSessionSpy = jest.spyOn(crudSession, 'createSession');
		createSessionSpy.mockResolvedValueOnce({ id: '', userID: '', expiresAt: new Date() });

		await request(app)
			.post(Config.LOGIN_URI)
			.send({ email: faker.internet.email(), password: faker.internet.password() })
			.expect(204)
			.then(response => {
				expect(response.body).toEqual({});
				expect(response.header['set-cookie']).toBeDefined();
				expect(response.header['set-cookie'][0]).toContain('token');
			});
	});
});

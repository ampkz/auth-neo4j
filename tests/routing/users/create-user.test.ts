import { Express } from 'express';
import authNeo4j from '../../../src';
import request from 'supertest';
import { generateSessionToken } from '../../../src/sessions/crud-session';
import * as crudSession from '../../../src/sessions/crud-session';
import * as crudUser from '../../../src/users/crud-user';
import { Auth } from '../../../src/auth/auth';
import { User } from '../../../src/users/user';
import { faker } from '@faker-js/faker';
import { FieldError, RoutingErrors } from '../../../src/errors/errors';

import Config from '../../../src/config/config';

import logger from '../../../src/api/utils/logger';
import { isValidPassword } from '../../../src/api/utils/validators';

jest.mock('../../../src/api/utils/logger');

describe(`Create User Route Tests`, () => {
	let app: Express;

	beforeAll(() => {
		app = authNeo4j();
	});

	beforeEach(() => {
		jest.restoreAllMocks();
	});

	test(`${Config.USER_URI} should send 403 status if the session couldn't be validated`, async () => {
		const token = generateSessionToken();

		const validateSessionTokenSpy = jest.spyOn(crudSession, 'validateSessionToken');
		validateSessionTokenSpy.mockResolvedValueOnce({
			session: null,
			user: null,
		});

		await request(app).post(Config.USER_URI).set('Cookie', `token=${token}`).expect(403);

		expect(logger.warn).toHaveBeenCalled();
	});

	test(`${Config.USER_URI} should send 401 status with contributor auth`, async () => {
		const token = generateSessionToken();

		const validateSessionTokenSpy = jest.spyOn(crudSession, 'validateSessionToken');
		validateSessionTokenSpy.mockResolvedValueOnce({
			session: { id: '', userID: '', expiresAt: new Date(), host: '', userAgent: '' },
			user: { id: '', email: '', auth: Auth.CONTRIBUTOR },
		});

		await request(app).post(Config.USER_URI).set('Cookie', `token=${token}`).expect(401);

		expect(logger.warn).toHaveBeenCalled();
	});

	test(`${Config.USER_URI} should send 401 status without token cookie`, async () => {
		await request(app).post(Config.USER_URI).expect(401);
		expect(logger.warn).toHaveBeenCalled();
	});

	test(`${Config.USER_URI} should send 400 status on POST without email, auth, or password`, async () => {
		const token = generateSessionToken();

		const validateSessionTokenSpy = jest.spyOn(crudSession, 'validateSessionToken');
		validateSessionTokenSpy.mockResolvedValueOnce({
			session: { id: '', userID: '', expiresAt: new Date(), host: '', userAgent: '' },
			user: { id: '', email: '', auth: Auth.ADMIN },
		});

		await request(app)
			.post(Config.USER_URI)
			.set('Cookie', `token=${token}`)
			.send({})
			.expect(400)
			.then(response => {
				expect(response.body.message).toBe(RoutingErrors.INVALID_REQUEST);
				expect(response.body.data).toContainEqual({ field: 'email', message: FieldError.REQUIRED });
				expect(response.body.data).toContainEqual({ field: 'password', message: FieldError.REQUIRED });
				expect(response.body.data).toContainEqual({ field: 'auth', message: FieldError.REQUIRED });
			});
	});

	test(`${Config.USER_URI} should send 400 status with invalid auth type`, async () => {
		const token = generateSessionToken();

		const validateSessionTokenSpy = jest.spyOn(crudSession, 'validateSessionToken');
		validateSessionTokenSpy.mockResolvedValueOnce({
			session: { id: '', userID: '', expiresAt: new Date(), host: '', userAgent: '' },
			user: { id: '', email: '', auth: Auth.ADMIN },
		});

		await request(app)
			.post(Config.USER_URI)
			.set('Cookie', `token=${token}`)
			.send({ email: faker.internet.email(), auth: 'not auth', password: faker.internet.password() })
			.expect(400)
			.then(response => {
				expect(response.body.message).toBe(RoutingErrors.INVALID_REQUEST);
				expect(response.body.data).toContainEqual({ field: 'auth', message: FieldError.INVALID_AUTH });
			});
	});

	test(`${Config.USER_URI} should send 400 status with invalid password`, async () => {
		const token = generateSessionToken();

		const validateSessionTokenSpy = jest.spyOn(crudSession, 'validateSessionToken');
		validateSessionTokenSpy.mockResolvedValueOnce({
			session: { id: '', userID: '', expiresAt: new Date(), host: '', userAgent: '' },
			user: { id: '', email: '', auth: Auth.ADMIN },
		});

		const invalidPassword = 'invalid password';
		const validationErrors = isValidPassword(invalidPassword);

		await request(app)
			.post(Config.USER_URI)
			.set('Cookie', `token=${token}`)
			.send({ email: faker.internet.email(), auth: 'invalid auth', password: invalidPassword })
			.expect(400)
			.then(response => {
				expect(response.body.message).toBe(RoutingErrors.INVALID_REQUEST);
				expect(response.body.data).toContainEqual({ field: 'password', message: FieldError.INVALID_PASSWORD, validationErrors });
			});
	});

	test(`${Config.USER_URI} should send 422 status if no user was created`, async () => {
		const token = generateSessionToken();

		const validateSessionTokenSpy = jest.spyOn(crudSession, 'validateSessionToken');
		validateSessionTokenSpy.mockResolvedValueOnce({
			session: { id: '', userID: '', expiresAt: new Date(), host: '', userAgent: '' },
			user: { id: '', email: '', auth: Auth.ADMIN },
		});

		const createUserSpy = jest.spyOn(crudUser, 'createUser');
		createUserSpy.mockResolvedValue(undefined);

		await request(app)
			.post(Config.USER_URI)
			.set('Cookie', `token=${token}`)
			.send({ email: faker.internet.email(), auth: Auth.ADMIN, password: 'Val1dPassw0rd!' })
			.expect(422);

		expect(logger.warn).toHaveBeenCalled();
	});

	test(`${Config.USER_URI} should send 201 status with created user`, async () => {
		const token = generateSessionToken(),
			email = faker.internet.email(),
			id = faker.database.mongodbObjectId(),
			auth = Auth.ADMIN,
			firstName = faker.person.firstName(),
			lastName = faker.person.lastName(),
			secondName = faker.person.middleName();

		const validateSessionTokenSpy = jest.spyOn(crudSession, 'validateSessionToken');
		validateSessionTokenSpy.mockResolvedValueOnce({
			session: { id: '', userID: '', expiresAt: new Date(), host: '', userAgent: '' },
			user: { id: '', email: '', auth: Auth.ADMIN },
		});

		const user: User = new User({ email, id, auth, firstName, lastName, secondName });

		const createUserSpy = jest.spyOn(crudUser, 'createUser');
		createUserSpy.mockResolvedValue(user);

		await request(app)
			.post(Config.USER_URI)
			.set('Cookie', `token=${token}`)
			.send({ email, auth, password: 'Val1dPassw0rd!' })
			.expect(201)
			.then(response => {
				expect(response.headers.location).toEqual(`/${user.id}`);
				expect(response.body).toEqual(user);
			});

		expect(logger.info).toHaveBeenCalled();
	});
});

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

jest.mock('../../../src/api/utils/logger');

describe(`Update User Route Tests`, () => {
	let app: Express;

	beforeAll(() => {
		app = authNeo4j();
	});

	beforeEach(() => {
		jest.restoreAllMocks();
	});

	test(`${Config.USER_URI}/:id should send 403 status if the session couldn't be validated`, async () => {
		const token = generateSessionToken();

		const validateSessionTokenSpy = jest.spyOn(crudSession, 'validateSessionToken');
		validateSessionTokenSpy.mockResolvedValueOnce({
			session: null,
			user: null,
		});

		await request(app).patch(`${Config.USER_URI}/${faker.database.mongodbObjectId()}`).set('Cookie', `token=${token}`).expect(403);

		expect(logger.warn).toHaveBeenCalled();
	});

	test(`${Config.USER_URI}/:id should send 401 status with contributor auth`, async () => {
		const token = generateSessionToken();

		const validateSessionTokenSpy = jest.spyOn(crudSession, 'validateSessionToken');
		validateSessionTokenSpy.mockResolvedValueOnce({
			session: { id: '', userID: '', expiresAt: new Date(), host: '', userAgent: '' },
			user: { id: '', email: '', auth: Auth.CONTRIBUTOR },
		});

		await request(app).patch(`${Config.USER_URI}/${faker.database.mongodbObjectId()}`).set('Cookie', `token=${token}`).expect(401);

		expect(logger.warn).toHaveBeenCalled();
	});

	test(`${Config.USER_URI} should send 401 status without token cookie`, async () => {
		await request(app).patch(`${Config.USER_URI}/${faker.database.mongodbObjectId()}`).expect(401);
		expect(logger.warn).toHaveBeenCalled();
	});

	test(`${Config.USER_URI}/:id should send 400 status with invalid updatedAuth type`, async () => {
		const token = generateSessionToken();

		const validateSessionTokenSpy = jest.spyOn(crudSession, 'validateSessionToken');
		validateSessionTokenSpy.mockResolvedValueOnce({
			session: { id: '', userID: '', expiresAt: new Date(), host: '', userAgent: '' },
			user: { id: '', email: '', auth: Auth.ADMIN },
		});

		await request(app)
			.patch(`${Config.USER_URI}/${faker.database.mongodbObjectId()}`)
			.set('Cookie', `token=${token}`)
			.send({ auth: 'not auth' })
			.expect(400)
			.then(response => {
				expect(response.body.message).toBe(RoutingErrors.INVALID_REQUEST);
				expect(response.body.data).toContainEqual({ field: 'auth', message: FieldError.INVALID_AUTH });
			});

		expect(logger.warn).toHaveBeenCalled();
	});

	test(`${Config.USER_URI}/:id should send 404 status if no user was found`, async () => {
		const token = generateSessionToken();

		const validateSessionTokenSpy = jest.spyOn(crudSession, 'validateSessionToken');
		validateSessionTokenSpy.mockResolvedValueOnce({
			session: { id: '', userID: '', expiresAt: new Date(), host: '', userAgent: '' },
			user: { id: '', email: '', auth: Auth.ADMIN },
		});

		const getUserSpy = jest.spyOn(crudUser, 'getUser');
		getUserSpy.mockResolvedValue(undefined);

		await request(app).patch(`${Config.USER_URI}/${faker.database.mongodbObjectId()}`).set('Cookie', `token=${token}`).send({}).expect(404);

		expect(logger.warn).toHaveBeenCalled();
	});

	test(`${Config.USER_URI}/:id should send 403 status if a user is trying to change their own auth role`, async () => {
		const token = generateSessionToken();
		const email = faker.internet.email();

		const validateSessionTokenSpy = jest.spyOn(crudSession, 'validateSessionToken');
		validateSessionTokenSpy.mockResolvedValueOnce({
			session: { id: '', userID: '', expiresAt: new Date(), host: '', userAgent: '' },
			user: { id: '', email, auth: Auth.ADMIN },
		});

		const getUserSpy = jest.spyOn(crudUser, 'getUser');
		getUserSpy.mockResolvedValue(new User({ email, auth: Auth.ADMIN }));

		await request(app)
			.patch(`${Config.USER_URI}/${faker.database.mongodbObjectId()}`)
			.set('Cookie', `token=${token}`)
			.send({ auth: Auth.CONTRIBUTOR })
			.expect(403);

		expect(logger.warn).toHaveBeenCalled();
	});

	test(`${Config.USER_URI}/:id should allow a role escalation as an admin escalating another user`, async () => {
		const token = generateSessionToken(),
			auth = Auth.CONTRIBUTOR,
			email = faker.internet.email(),
			firstName = faker.person.firstName(),
			lastName = faker.person.lastName(),
			secondName = faker.person.middleName(),
			password = faker.internet.password();

		const validateSessionTokenSpy = jest.spyOn(crudSession, 'validateSessionToken');
		validateSessionTokenSpy.mockResolvedValueOnce({
			session: { id: '', userID: '', expiresAt: new Date(), host: '', userAgent: '' },
			user: { id: '', email: faker.internet.email(), auth: Auth.ADMIN },
		});

		const getUserSpy = jest.spyOn(crudUser, 'getUser');
		getUserSpy.mockResolvedValue(new User({ email: faker.internet.email(), auth: Auth.CONTRIBUTOR }));

		const updatedUser = new User({
			auth,
			email,
			firstName,
			lastName,
			secondName,
		});

		const updateUserSpy = jest.spyOn(crudUser, 'updateUser');
		updateUserSpy.mockResolvedValue(updatedUser);

		await request(app)
			.patch(`${Config.USER_URI}/${faker.database.mongodbObjectId()}`)
			.set('Cookie', `token=${token}`)
			.send({ auth, email, firstName, password, lastName, secondName })
			.expect(200)
			.then(response => {
				expect(response.body).toEqual(updatedUser);
			});

		expect(logger.info).toHaveBeenCalled();
	});

	test(`${Config.USER_URI}/:id should send 422 status if no user was updated`, async () => {
		const token = generateSessionToken();

		const validateSessionTokenSpy = jest.spyOn(crudSession, 'validateSessionToken');
		validateSessionTokenSpy.mockResolvedValueOnce({
			session: { id: '', userID: '', expiresAt: new Date(), host: '', userAgent: '' },
			user: { id: '', email: '', auth: Auth.ADMIN },
		});

		const getUserSpy = jest.spyOn(crudUser, 'getUser');
		getUserSpy.mockResolvedValue(new User({ email: faker.internet.email(), auth: Auth.ADMIN }));

		const updateUserSpy = jest.spyOn(crudUser, 'updateUser');
		updateUserSpy.mockResolvedValue(undefined);

		await request(app).patch(`${Config.USER_URI}/${faker.database.mongodbObjectId()}`).set('Cookie', `token=${token}`).send({}).expect(422);

		expect(logger.warn).toHaveBeenCalled();
	});

	test(`${Config.USER_URI}/:id should send 200 status with updated user on a successful update as admin`, async () => {
		const token = generateSessionToken(),
			auth = Auth.CONTRIBUTOR,
			email = faker.internet.email(),
			firstName = faker.person.firstName(),
			lastName = faker.person.lastName(),
			secondName = faker.person.middleName(),
			password = faker.internet.password();

		const validateSessionTokenSpy = jest.spyOn(crudSession, 'validateSessionToken');
		validateSessionTokenSpy.mockResolvedValueOnce({
			session: { id: '', userID: '', expiresAt: new Date(), host: '', userAgent: '' },
			user: { id: '', email: '', auth: Auth.ADMIN },
		});

		const getUserSpy = jest.spyOn(crudUser, 'getUser');
		getUserSpy.mockResolvedValue(new User({ email: faker.internet.email(), auth: Auth.ADMIN }));

		const updatedUser = new User({
			auth,
			email,
			firstName,
			lastName,
			secondName,
		});

		const updateUserSpy = jest.spyOn(crudUser, 'updateUser');
		updateUserSpy.mockResolvedValue(updatedUser);

		await request(app)
			.patch(`${Config.USER_URI}/${faker.database.mongodbObjectId()}`)
			.set('Cookie', `token=${token}`)
			.send({ auth, email, firstName, password, lastName, secondName })
			.expect(200)
			.then(response => {
				expect(response.body).toEqual(updatedUser);
			});

		expect(logger.info).toHaveBeenCalled();
	});

	test(`${Config.USER_URI}/:id should send 200 status with updated user on a successful update as self contributor`, async () => {
		const token = generateSessionToken(),
			auth = Auth.CONTRIBUTOR,
			email = faker.internet.email(),
			firstName = faker.person.firstName(),
			lastName = faker.person.lastName(),
			secondName = faker.person.middleName(),
			password = faker.internet.password(),
			id = faker.database.mongodbObjectId();

		const validateSessionTokenSpy = jest.spyOn(crudSession, 'validateSessionToken');
		validateSessionTokenSpy.mockResolvedValueOnce({
			session: { id: '', userID: '', expiresAt: new Date(), host: '', userAgent: '' },
			user: { id, email: '', auth: Auth.CONTRIBUTOR },
		});

		const getUserSpy = jest.spyOn(crudUser, 'getUser');
		getUserSpy.mockResolvedValue(new User({ id, email: faker.internet.email(), auth: Auth.ADMIN }));

		const updatedUser = new User({
			auth,
			email,
			firstName,
			lastName,
			secondName,
			id,
		});

		const updateUserSpy = jest.spyOn(crudUser, 'updateUser');
		updateUserSpy.mockResolvedValue(updatedUser);

		await request(app)
			.patch(`${Config.USER_URI}/${id}`)
			.set('Cookie', `token=${token}`)
			.send({ auth, email, firstName, password, lastName, secondName })
			.expect(200)
			.then(response => {
				expect(response.body).toEqual(updatedUser);
			});

		expect(logger.info).toHaveBeenCalled();
	});
});

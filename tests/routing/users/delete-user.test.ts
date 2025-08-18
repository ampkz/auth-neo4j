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

import logger from '../../../src/api/utils/logging/logger';

jest.mock('../../../src/api/utils/logging/logger');

describe(`Delete User Route Tests`, () => {
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

		await request(app).delete(`${Config.USER_URI}/${faker.database.mongodbObjectId()}`).set('Cookie', `token=${token}`).expect(403);

		expect(logger.warn).toHaveBeenCalled();
	});

	test(`${Config.USER_URI}/:id should send 401 status without token cookie`, async () => {
		await request(app).delete(`${Config.USER_URI}/${faker.database.mongodbObjectId()}`).expect(401);

		expect(logger.warn).toHaveBeenCalled();
	});

	test(`${Config.USER_URI}/:id should send 422 status if no user was deleted`, async () => {
		const token = generateSessionToken();

		const validateSessionTokenSpy = jest.spyOn(crudSession, 'validateSessionToken');
		validateSessionTokenSpy.mockResolvedValueOnce({
			session: { id: '', userID: '', expiresAt: new Date(), host: '', userAgent: '' },
			user: { id: '', email: '', auth: Auth.ADMIN },
		});

		const deleteUserSpy = jest.spyOn(crudUser, 'deleteUser');
		deleteUserSpy.mockResolvedValue(undefined);

		await request(app).delete(`${Config.USER_URI}/${faker.database.mongodbObjectId()}`).set('Cookie', `token=${token}`).expect(422);

		expect(logger.warn).toHaveBeenCalled();
	});

	test(`${Config.USER_URI}/:id should send 401 status as contributor`, async () => {
		const token = generateSessionToken();

		const validateSessionTokenSpy = jest.spyOn(crudSession, 'validateSessionToken');
		validateSessionTokenSpy.mockResolvedValueOnce({
			session: { id: '', userID: '', expiresAt: new Date(), host: '', userAgent: '' },
			user: { id: '', email: '', auth: Auth.CONTRIBUTOR },
		});

		await request(app).delete(`${Config.USER_URI}/${faker.database.mongodbObjectId()}`).set('Cookie', `token=${token}`).expect(401);

		expect(logger.warn).toHaveBeenCalled();
	});

	test(`${Config.USER_URI}/:id should send 204 status if user was deleted as admin`, async () => {
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

		const deleteUserSpy = jest.spyOn(crudUser, 'deleteUser');
		deleteUserSpy.mockResolvedValue(user);

		await request(app).delete(`${Config.USER_URI}/${user.id}`).set('Cookie', `token=${token}`).expect(204);

		expect(logger.info).toHaveBeenCalled();
	});

	test(`${Config.USER_URI}/:id should send 204 status if user was deleted as self contributor`, async () => {
		const token = generateSessionToken(),
			id = faker.database.mongodbObjectId();

		const validateSessionTokenSpy = jest.spyOn(crudSession, 'validateSessionToken');
		validateSessionTokenSpy.mockResolvedValueOnce({
			session: { id: '', userID: '', expiresAt: new Date(), host: '', userAgent: '' },
			user: { id, email: '', auth: Auth.CONTRIBUTOR },
		});

		const deleteUserSpy = jest.spyOn(crudUser, 'deleteUser');
		deleteUserSpy.mockResolvedValue(new User({ email: faker.internet.email(), id, auth: Auth.CONTRIBUTOR }));

		await request(app).delete(`${Config.USER_URI}/${id}`).set('Cookie', `token=${token}`).expect(204);

		expect(logger.info).toHaveBeenCalled();
	});
});

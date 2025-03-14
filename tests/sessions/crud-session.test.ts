import { generateSessionToken, hashToken, Session, SessionValidationResult } from '../../src/sessions/session';
import { createSession, Errors as CRUDSessionErrors, validateSessionToken } from '../../src/sessions/crud-session';
import { createUser } from '../../src/users/crud-user';
import { Auth } from '../../src/auth/auth';
import { faker } from '@faker-js/faker';
import { User } from '../../src/users/user';
import neo4j, { Driver } from 'neo4j-driver';

describe(`CRUD Session Tests`, () => {
	const email: string = 'test@test';
	let user: User;

	beforeAll(async () => {
		user = (await createUser(new User({ auth: Auth.ADMIN, email }), faker.internet.password())) as User;
	});

	beforeEach(() => {
		jest.restoreAllMocks();
	});

	test(`createSession should create a session`, async () => {
		const token: string = generateSessionToken();
		const session: Session = (await createSession(token, user.email)) as Session;

		expect(session).toBeDefined();
		expect(session.id).toEqual(hashToken(token));
		expect(session.userID).toEqual(user.id);
		expect(session.expiresAt).toBeDefined();
	});

	test(`createSession should return undefined if no user was found`, async () => {
		const token: string = generateSessionToken();
		const session: Session | undefined = await createSession(token, faker.internet.email());

		expect(session).toBeUndefined();
	});

	test(`createSession should throw an error if there was an issue with the server`, async () => {
		const createSessionMock = {
			run: jest.fn().mockRejectedValue(CRUDSessionErrors.COULD_NOT_CREATE_SESSION),
			close: jest.fn(),
		};

		const driverMock = {
			session: jest.fn().mockReturnValueOnce(createSessionMock),
			close: jest.fn(),
			getServerInfo: jest.fn(),
		} as unknown as Driver;

		const driverSpy = jest.spyOn(neo4j, 'driver');
		driverSpy.mockReturnValue(driverMock);

		const token: string = generateSessionToken();

		await expect(createSession(token, email)).rejects.toBeDefined();
	});

	test(`validateSession should validate an existing session`, async () => {
		const token: string = generateSessionToken();
		const session: Session = (await createSession(token, email)) as Session;

		const svr: SessionValidationResult = await validateSessionToken(token);

		expect(svr.session).toBeDefined();
		expect(svr.user).toBeDefined();
		expect(svr.session?.id).toEqual(session.id);
		expect(svr.session?.userID).toEqual(user.id);
		expect(svr.session?.expiresAt).toEqual(session.expiresAt);
		expect(svr.user).toEqual(user);
	});

	test(`validateSession should return undefined if no token`, async () => {
		const svr: SessionValidationResult = await validateSessionToken();

		expect(svr.session).toBeNull();
		expect(svr.user).toBeNull();
	});

	test(`validateSession should return undefined with an unknown token`, async () => {
		const svr: SessionValidationResult = await validateSessionToken(generateSessionToken());

		expect(svr.session).toBeNull();
		expect(svr.user).toBeNull();
	});

	test(`validateSession should throw an error if there was an issue with the server`, async () => {
		const validateSessionMock = {
			run: jest.fn().mockRejectedValue(CRUDSessionErrors.COULD_NOT_VALIDATE_SESSION),
			close: jest.fn(),
		};

		const driverMock = {
			session: jest.fn().mockReturnValueOnce(validateSessionMock),
			close: jest.fn(),
			getServerInfo: jest.fn(),
		} as unknown as Driver;

		const driverSpy = jest.spyOn(neo4j, 'driver');
		driverSpy.mockReturnValue(driverMock);

		await expect(validateSessionToken(generateSessionToken())).rejects.toBeDefined();
	});
});

import { Session, SessionValidationResult } from '../../src/sessions/session';
import { generateSessionToken, hashToken } from '../../src/sessions/crud-session';
import {
	createSession,
	Errors as CRUDSessionErrors,
	invalidateAllSessions,
	invalidateSession,
	validateSessionToken,
} from '../../src/sessions/crud-session';
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

	test(`validateSession should invalidate an expired session`, async () => {
		const token: string = generateSessionToken();
		const session: Session = (await createSession(token, email)) as Session;

		const mockRecord = {
			get: (key: string) => {
				if (key === 'u') {
					return { properties: { ...user } };
				}

				if (key === 'r') {
					return { properties: { sessionId: session.id } };
				}

				if (key === 's') {
					return { properties: { ...session, expiresAt: new Date().toISOString() } };
				}
			},
		};

		const dbCreationSessionMock = {
			run: jest.fn().mockResolvedValue({ records: [mockRecord] }),
			close: jest.fn(),
		};

		const driverMock = {
			session: jest.fn().mockReturnValueOnce(dbCreationSessionMock),
			close: jest.fn(),
			getServerInfo: jest.fn(),
		} as unknown as Driver;

		const driverSpy = jest.spyOn(neo4j, 'driver');
		driverSpy.mockReturnValueOnce(driverMock);

		const svr: SessionValidationResult = await validateSessionToken(token);
		expect(svr.session).toBeNull();
		expect(svr.user).toBeNull();
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

	test(`invalidateSession should invalidate a session`, async () => {
		const token: string = generateSessionToken();
		const session: Session = (await createSession(token, email)) as Session;

		await invalidateSession(session.id);

		const svr: SessionValidationResult = await validateSessionToken(token);

		expect(svr.session).toBeNull();
		expect(svr.user).toBeNull();
	});

	test(`invalidateSession should throw an error if there was an issue with the server`, async () => {
		const invalidateSessionMock = {
			run: jest.fn().mockRejectedValue(CRUDSessionErrors.COULD_NOT_INVALIDATE_SESSION),
			close: jest.fn(),
		};

		const driverMock = {
			session: jest.fn().mockReturnValueOnce(invalidateSessionMock),
			close: jest.fn(),
			getServerInfo: jest.fn(),
		} as unknown as Driver;

		const driverSpy = jest.spyOn(neo4j, 'driver');
		driverSpy.mockReturnValue(driverMock);

		await expect(invalidateSession(faker.database.mongodbObjectId())).rejects.toBeDefined();
	});

	test(`invalidateAllSessions should invalidate all sessions`, async () => {
		const tokenOne: string = generateSessionToken();
		await createSession(tokenOne, email);

		const tokenTwo: string = generateSessionToken();
		await createSession(tokenTwo, email);

		await invalidateAllSessions(email);

		const svrOne: SessionValidationResult = await validateSessionToken(tokenOne);
		const svrTwo: SessionValidationResult = await validateSessionToken(tokenTwo);

		expect(svrOne.session).toBeNull();
		expect(svrOne.user).toBeNull();
		expect(svrTwo.session).toBeNull();
		expect(svrTwo.user).toBeNull();
	});

	test(`invalidateSession should throw an error if there was an issue with the server`, async () => {
		const invalidateAllSessionsMock = {
			run: jest.fn().mockRejectedValue(CRUDSessionErrors.COULD_NOT_INVALIDATE_SESSION),
			close: jest.fn(),
		};

		const driverMock = {
			session: jest.fn().mockReturnValueOnce(invalidateAllSessionsMock),
			close: jest.fn(),
			getServerInfo: jest.fn(),
		} as unknown as Driver;

		const driverSpy = jest.spyOn(neo4j, 'driver');
		driverSpy.mockReturnValue(driverMock);

		await expect(invalidateAllSessions(email)).rejects.toBeDefined();
	});
});

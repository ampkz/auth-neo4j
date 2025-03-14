import { generateSessionToken, hashToken, Session } from '../../src/sessions/session';
import { createSession, Errors as CRUDSessionErrors } from '../../src/sessions/crud-session';
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

	test(`createSession should create a session`, async () => {
		const token: string = generateSessionToken();
		const session: Session = (await createSession(token, user.email)) as Session;

		const compDate: Date = new Date();
		compDate.setDate(compDate.getDate() + parseInt(process.env.AUTH_NEO4J_TOKEN_EXPIRATION as string));

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
});

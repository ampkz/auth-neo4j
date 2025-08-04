import neo4j, { Driver } from 'neo4j-driver';
import { destroyDB, initializeDB, ErrorMsgs as DBErrorMsgs, initUser } from '../../src/db/utils';
import * as crudUser from '../../src/users/crud-user';
import Config from '../../src/config/config';
import { User } from '../../src/users/user';
import { faker } from '@faker-js/faker';
import { Auth } from '../../src/auth/auth';

describe(`DB Utils Tests`, () => {
	beforeEach(() => {
		jest.restoreAllMocks();
	});

	it(`should create the database`, async () => {
		const mockRecord = {
			get: (key: string) => {
				if (key === 'address') {
					return `${Config.NEO4J_HOST}:${Config.NEO4J_PORT}`;
				}
			},
		};

		const dbCreationSessionMock = {
			run: jest.fn().mockResolvedValue({ records: [mockRecord] }),
			close: jest.fn(),
		};

		const dbConstraintAddedMock = {
			run: jest.fn().mockResolvedValue({ summary: { counters: { _stats: { constraintsAdded: 1 } } } }),
			close: jest.fn(),
		};

		const driverMock = {
			session: jest.fn().mockReturnValueOnce(dbCreationSessionMock).mockReturnValue(dbConstraintAddedMock),
			close: jest.fn(),
			getServerInfo: jest.fn(),
		} as unknown as Driver;

		const driverSpy = jest.spyOn(neo4j, 'driver');
		driverSpy.mockReturnValue(driverMock);

		await expect(initializeDB()).resolves.toBeTruthy();
	});

	it(`should throw an error if the database was not created`, async () => {
		const mockRecord = {
			get: (key: string) => {
				if (key === 'address') {
					return `not address`;
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
		driverSpy.mockReturnValue(driverMock);

		await expect(initializeDB()).rejects.toThrow(DBErrorMsgs.COULD_NOT_CREATE_DB);
	});

	it(`should throw an error if a constraint couldn't be added`, async () => {
		const mockRecord = {
			get: (key: string) => {
				if (key === 'address') {
					return `${Config.NEO4J_HOST}:${Config.NEO4J_PORT}`;
				}
			},
		};

		const dbCreationSessionMock = {
			run: jest.fn().mockResolvedValue({ records: [mockRecord] }),
			close: jest.fn(),
		};

		const dbConstraintAddedMock = {
			run: jest.fn().mockResolvedValue({ summary: { counters: { _stats: { constraintsAdded: 0 } } } }),
			close: jest.fn(),
		};

		const driverMock = {
			session: jest.fn().mockReturnValueOnce(dbCreationSessionMock).mockReturnValue(dbConstraintAddedMock),
			close: jest.fn(),
			getServerInfo: jest.fn(),
		} as unknown as Driver;

		const driverSpy = jest.spyOn(neo4j, 'driver');
		driverSpy.mockReturnValue(driverMock);

		await expect(initializeDB()).rejects.toThrow(DBErrorMsgs.COULD_NOT_CREATE_CONSTRAINT);
	});

	it(`should destroy the database`, async () => {
		const dbDestroySessionMock = {
			run: jest.fn(),
			close: jest.fn(),
		};

		const driverMock = {
			session: jest.fn().mockReturnValueOnce(dbDestroySessionMock),
			close: jest.fn(),
			getServerInfo: jest.fn(),
		} as unknown as Driver;

		const driverSpy = jest.spyOn(neo4j, 'driver');
		driverSpy.mockReturnValue(driverMock);

		await expect(destroyDB()).resolves.toBeTruthy();
	});

	test(`initUser should create a defined user`, async () => {
		const user: User = new User({
			email: faker.internet.email(),
			auth: Auth.ADMIN,
			firstName: faker.person.firstName(),
			lastName: faker.person.lastName(),
			secondName: faker.person.middleName(),
		});

		const newUser = await initUser(user, faker.internet.password());

		user.id = newUser.id;

		expect(newUser).toEqual(user);
	});

	test(`initUser should throw an error if no user was created`, async () => {
		const createUserSpy = jest.spyOn(crudUser, 'createUser');
		createUserSpy.mockResolvedValue(undefined);

		const user: User = new User({
			email: faker.internet.email(),
			auth: Auth.ADMIN,
			firstName: faker.person.firstName(),
			lastName: faker.person.lastName(),
			secondName: faker.person.middleName(),
		});

		await expect(initUser(user, faker.internet.password())).rejects.toBeDefined();
	});
});

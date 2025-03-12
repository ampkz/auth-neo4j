import { faker } from '@faker-js/faker';
import { Auth } from '../../../src/auth/auth';
import { User } from '../../../src/users/user';
import { createUser, Errors as CRUDUserErrors } from '../../../src/db/users/crud-user';
import neo4j, { Driver } from 'neo4j-driver';

describe(`CRUD User Test`, () => {
	it(`should create a user`, async () => {
		const user: User = new User({
			email: faker.internet.email(),
			auth: Auth.ADMIN,
			firstName: faker.person.firstName(),
			lastName: faker.person.lastName(),
			secondName: faker.person.middleName(),
		});

		const createdUser: User | undefined = await createUser(user, faker.internet.password());

		user.id = createdUser?.id;

		expect(createdUser).toEqual(user);
	});

	test(`createUser should throw an error if there was a server error`, async () => {
		const createUserSessionMock = {
			run: jest.fn().mockRejectedValue(CRUDUserErrors.COULD_NOT_CREATE_USER),
			close: jest.fn(),
		};

		const driverMock = {
			session: jest.fn().mockReturnValueOnce(createUserSessionMock),
			close: jest.fn(),
			getServerInfo: jest.fn(),
		} as unknown as Driver;

		const driverSpy = jest.spyOn(neo4j, 'driver');
		driverSpy.mockReturnValue(driverMock);

		const user: User = new User({ email: faker.internet.email(), auth: Auth.ADMIN });

		await expect(createUser(user, faker.internet.password())).rejects.toBeDefined();
	});

	test(`createUser should return undefined if no user was created`, async () => {
		const createUserSessionMock = {
			run: jest.fn().mockResolvedValue({ records: [] }),
			close: jest.fn(),
		};

		const driverMock = {
			session: jest.fn().mockReturnValueOnce(createUserSessionMock),
			close: jest.fn(),
			getServerInfo: jest.fn(),
		} as unknown as Driver;

		const driverSpy = jest.spyOn(neo4j, 'driver');
		driverSpy.mockReturnValue(driverMock);

		const user: User = new User({ email: faker.internet.email(), auth: Auth.ADMIN });

		const createdUser: User | undefined = await createUser(user, faker.internet.password());

		expect(createdUser).toBeUndefined();
	});
});

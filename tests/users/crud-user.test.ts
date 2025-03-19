import { faker } from '@faker-js/faker';
import { Auth } from '../../src/auth/auth';
import { UserUpdates, User } from '../../src/users/user';
import { createUser, Errors as CRUDUserErrors, deleteUser, getAllUsers, getUser, updateUser } from '../../src/users/crud-user';
import neo4j, { Driver } from 'neo4j-driver';

describe(`CRUD User Test`, () => {
	beforeEach(() => {
		jest.restoreAllMocks();
	});

	test(`createUser should create a user`, async () => {
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
		const createUserMock = {
			run: jest.fn().mockRejectedValue(CRUDUserErrors.COULD_NOT_CREATE_USER),
			close: jest.fn(),
		};

		const driverMock = {
			session: jest.fn().mockReturnValueOnce(createUserMock),
			close: jest.fn(),
			getServerInfo: jest.fn(),
		} as unknown as Driver;

		const driverSpy = jest.spyOn(neo4j, 'driver');
		driverSpy.mockReturnValue(driverMock);

		const user: User = new User({ email: faker.internet.email(), auth: Auth.ADMIN });

		await expect(createUser(user, faker.internet.password())).rejects.toBeDefined();
	});

	test(`createUser should return undefined if no user was created`, async () => {
		const createUserMock = {
			run: jest.fn().mockResolvedValue({ records: [] }),
			close: jest.fn(),
		};

		const driverMock = {
			session: jest.fn().mockReturnValueOnce(createUserMock),
			close: jest.fn(),
			getServerInfo: jest.fn(),
		} as unknown as Driver;

		const driverSpy = jest.spyOn(neo4j, 'driver');
		driverSpy.mockReturnValue(driverMock);

		const user: User = new User({ email: faker.internet.email(), auth: Auth.ADMIN });

		const createdUser: User | undefined = await createUser(user, faker.internet.password());

		expect(createdUser).toBeUndefined();
	});

	test(`getUser should return a created user`, async () => {
		const email: string = faker.internet.email();
		const user: User | undefined = await createUser(new User({ email, auth: Auth.ADMIN }), faker.internet.password());

		const matchedUser: User | undefined = await getUser(user?.id as string);

		expect(matchedUser).toEqual(user);
	});

	test(`getUser should return undefined if no user was found`, async () => {
		const matchedUser: User | undefined = await getUser(faker.database.mongodbObjectId());

		expect(matchedUser).toBeUndefined();
	});

	test(`getUser should throw an error if there was a server error`, async () => {
		const getUserMock = {
			run: jest.fn().mockRejectedValue(CRUDUserErrors.COULD_NOT_GET_USER),
			close: jest.fn(),
		};

		const driverMock = {
			session: jest.fn().mockReturnValueOnce(getUserMock),
			close: jest.fn(),
			getServerInfo: jest.fn(),
		} as unknown as Driver;

		const driverSpy = jest.spyOn(neo4j, 'driver');
		driverSpy.mockReturnValue(driverMock);

		await expect(getUser(faker.database.mongodbObjectId())).rejects.toBeDefined();
	});

	test(`deleteUser should delete a created user`, async () => {
		const email: string = faker.internet.email();
		const user: User | undefined = await createUser(new User({ email, auth: Auth.ADMIN }), faker.internet.password());

		const matchedUser: User | undefined = await deleteUser(email);

		expect(matchedUser).toEqual(user);
	});

	test(`deleteUser should return undefined if no user was deleted`, async () => {
		const email: string = faker.internet.email();

		const matchedUser: User | undefined = await deleteUser(email);

		expect(matchedUser).toBeUndefined();
	});

	test(`deleteUser should throw an error if there was a server error`, async () => {
		const deleteUserMock = {
			run: jest.fn().mockRejectedValue(CRUDUserErrors.COULD_NOT_DELETE_USER),
			close: jest.fn(),
		};

		const driverMock = {
			session: jest.fn().mockReturnValueOnce(deleteUserMock),
			close: jest.fn(),
			getServerInfo: jest.fn(),
		} as unknown as Driver;

		const driverSpy = jest.spyOn(neo4j, 'driver');
		driverSpy.mockReturnValue(driverMock);

		await expect(deleteUser(faker.internet.email())).rejects.toBeDefined();
	});

	test(`updateUser should update a user`, async () => {
		const user: User = new User({
			email: faker.internet.email(),
			auth: Auth.ADMIN,
			firstName: faker.person.firstName(),
			lastName: faker.person.lastName(),
			secondName: faker.person.middleName(),
		});

		const userUpdates: UserUpdates = {
			updatedAuth: Auth.CONTRIBUTOR,
			updatedEmail: faker.internet.email(),
			updatedFirstName: faker.person.firstName(),
			updatedLastName: faker.person.lastName(),
			updatedPassword: faker.internet.password(),
			updatedSecondName: faker.person.middleName(),
		};

		const createdUser: User | undefined = await createUser(user, faker.internet.password());
		const updatedUser: User | undefined = await updateUser(user.email, userUpdates);

		expect(updatedUser).toEqual(
			new User({
				email: userUpdates.updatedEmail as string,
				auth: userUpdates.updatedAuth as Auth,
				firstName: userUpdates.updatedFirstName,
				lastName: userUpdates.updatedLastName,
				secondName: userUpdates.updatedSecondName,
				id: createdUser?.id,
			})
		);
	});

	test(`updateUser should return undefined if no user was updated`, async () => {
		const userUpdates: UserUpdates = {
			updatedAuth: Auth.CONTRIBUTOR,
			updatedEmail: faker.internet.email(),
			updatedFirstName: faker.person.firstName(),
			updatedLastName: faker.person.lastName(),
			updatedPassword: faker.internet.password(),
			updatedSecondName: faker.person.middleName(),
		};

		const updatedUser: User | undefined = await updateUser(faker.internet.password(), userUpdates);

		expect(updatedUser).toBeUndefined();
	});

	test(`updateUser should should throw an error if there was a server error`, async () => {
		const userUpdates: UserUpdates = {
			updatedAuth: Auth.CONTRIBUTOR,
			updatedEmail: faker.internet.email(),
			updatedFirstName: faker.person.firstName(),
			updatedLastName: faker.person.lastName(),
			updatedPassword: faker.internet.password(),
			updatedSecondName: faker.person.middleName(),
		};

		const updateUserMock = {
			run: jest.fn().mockRejectedValue(CRUDUserErrors.COULD_NOT_UPDATE_USER),
			close: jest.fn(),
		};

		const driverMock = {
			session: jest.fn().mockReturnValueOnce(updateUserMock),
			close: jest.fn(),
			getServerInfo: jest.fn(),
		} as unknown as Driver;

		const driverSpy = jest.spyOn(neo4j, 'driver');
		driverSpy.mockReturnValue(driverMock);

		await expect(updateUser(faker.internet.email(), userUpdates)).rejects.toBeDefined();
	});

	test(`getAllUsers should return a list of all users`, async () => {
		const userOne = await createUser(new User({ email: faker.internet.email(), auth: Auth.ADMIN }), faker.internet.password());
		const userTwo = await createUser(new User({ email: faker.internet.email(), auth: Auth.ADMIN }), faker.internet.password());
		const userThree = await createUser(new User({ email: faker.internet.email(), auth: Auth.ADMIN }), faker.internet.password());

		const users = await getAllUsers();

		expect(users).toContainEqual(userOne);
		expect(users).toContainEqual(userTwo);
		expect(users).toContainEqual(userThree);
	});

	test(`getAllUsers should throw an error if there was server error`, async () => {
		const getAllUsersMock = {
			run: jest.fn().mockRejectedValue(CRUDUserErrors.COULD_NOT_GET_USER),
			close: jest.fn(),
		};

		const driverMock = {
			session: jest.fn().mockReturnValueOnce(getAllUsersMock),
			close: jest.fn(),
			getServerInfo: jest.fn(),
		} as unknown as Driver;

		const driverSpy = jest.spyOn(neo4j, 'driver');
		driverSpy.mockReturnValue(driverMock);

		await expect(getAllUsers()).rejects.toBeDefined();
	});
});

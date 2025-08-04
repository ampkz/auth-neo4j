import { faker } from '@faker-js/faker';
import { User } from '../../src/users/user';
import { checkPassword } from '../../src/users/pwd';
import { createUser } from '../../src/users/crud-user';
import { Auth } from '../../src/auth/auth';

describe(`User tests`, () => {
	beforeEach(() => {
		jest.restoreAllMocks();
	});

	test(`checkPassword should return a user if the password matches`, async () => {
		const email: string = faker.internet.email();
		const password: string = faker.internet.password();

		const user: User | undefined = await createUser(new User({ email, auth: Auth.ADMIN }), password);

		const matchedUser: User | undefined = await checkPassword(email, password);

		expect(matchedUser).toEqual(user);
	});

	test(`checkPassword should return undefined if the password does not match`, async () => {
		const email: string = faker.internet.email();
		const password: string = faker.internet.password();

		await createUser(new User({ email, auth: Auth.ADMIN }), password);

		const matchedUser: User | undefined = await checkPassword(email, `not password`);

		expect(matchedUser).toBeUndefined();
	});
});

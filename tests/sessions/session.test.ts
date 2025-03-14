import { generateSessionToken, hashToken } from '../../src/sessions/session';

describe(`Session utils tests`, () => {
	it(`should hash a token`, () => {
		const token: string = generateSessionToken();
		const secondToken: string = generateSessionToken();
		const hashedToken: string = hashToken(token);
		const compHash: string = hashToken(token);
		const secondHash: string = hashToken(secondToken);

		expect(token).not.toEqual(secondToken);
		expect(hashedToken).toEqual(compHash);
		expect(hashedToken).not.toEqual(secondHash);
	});
});

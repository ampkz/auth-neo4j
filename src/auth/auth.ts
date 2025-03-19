export enum Auth {
	ADMIN = 'ADMIN',
	CONTRIBUTOR = 'CONTRIBUTOR',
	SELF = 'SELF',
}

export function isValidAuth(auth: Auth): boolean {
	return Object.values(Auth).includes(auth);
}

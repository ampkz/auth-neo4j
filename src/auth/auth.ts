export enum Auth {
	ADMIN = 'ADMIN',
	CONTRIBUTOR = 'CONTRIBUTOR',
	SELF = 'SELF',
}

export function isValidAuth(auth: Auth): boolean {
	return Object.values(Auth).includes(auth);
}

export function isRoleEscalation(currentAuth: Auth, updatedAuth: Auth, authorizedEmail: string, userEmail: string) {
	if (userEmail !== authorizedEmail) return currentAuth === Auth.CONTRIBUTOR && updatedAuth === Auth.ADMIN;

	return authorizedEmail === userEmail;
}

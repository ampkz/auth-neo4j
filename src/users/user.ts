import { Auth } from '../auth/auth';

export interface IUser {
	id?: string;
	email: string;
	auth: Auth;
	firstName?: string;
	lastName?: string;
	secondName?: string;
}

export type UserUpdates = {
	updatedEmail?: string;
	updatedFirstName?: string;
	updatedSecondName?: string;
	updatedLastName?: string;
	updatedAuth?: string;
	updatedPassword?: string;
};

export class User implements IUser {
	public id?: string;
	public email: string;
	public auth: Auth;
	public firstName?: string;
	public lastName?: string;
	public secondName?: string;

	constructor(user: IUser) {
		this.id = user.id;
		this.email = user.email;
		this.auth = user.auth;
		this.firstName = user.firstName;
		this.lastName = user.lastName;
		this.secondName = user.secondName;
	}
}

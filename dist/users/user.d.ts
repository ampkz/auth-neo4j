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
export declare class User implements IUser {
    id?: string;
    email: string;
    auth: Auth;
    firstName?: string;
    lastName?: string;
    secondName?: string;
    constructor(user: IUser);
}
export declare function checkPassword(email: string, password: string): Promise<User | undefined>;

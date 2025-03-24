import { UserUpdates, User } from './user';
export declare enum Errors {
    COULD_NOT_CREATE_USER = "There was an error trying to create user.",
    COULD_NOT_GET_USER = "There was an error trying to search for user.",
    COULD_NOT_DELETE_USER = "There was an error trying to delete user.",
    COULD_NOT_UPDATE_USER = "There was an error trying to update user."
}
export declare function createUser(user: User, password: string): Promise<User | undefined>;
export declare function getUser(id: string): Promise<User | undefined>;
export declare function deleteUser(id: string): Promise<User | undefined>;
export declare function updateUser(id: string, userUpdates: UserUpdates): Promise<User | undefined>;
export declare function getAllUsers(): Promise<Array<User>>;

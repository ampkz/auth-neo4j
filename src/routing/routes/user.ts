import { Request, Response } from 'express';
import { User } from '../../users/user';
import { getAllUsers } from '../../users/crud-user';

export async function getUsers(req: Request, res: Response) {
	const users: Array<User> = await getAllUsers();

	return res.status(200).json(users);
}
